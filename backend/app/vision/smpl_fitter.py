"""
SMPL Anatomical Pose & Biometric Mesh Fitter
Articulates the canonical SMPL 3D wireframe mesh to match the patient's exact
posture, body dimensions, and limb angles captured from their calibration photo.
"""

import os
import json
import struct
import math
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple

def rot_from_u_to_v(u: np.ndarray, v: np.ndarray) -> np.ndarray:
    """Computes minimal 3D rotation matrix aligning unit vector u to unit vector v."""
    u_n = u / (np.linalg.norm(u) + 1e-8)
    v_n = v / (np.linalg.norm(v) + 1e-8)
    dot = np.clip(np.dot(u_n, v_n), -1.0, 1.0)
    if dot > 0.9999:
        return np.eye(3, dtype=np.float32)
    if dot < -0.9999:
        axis = np.array([0, 1, 0], dtype=np.float32) if abs(u_n[0]) > 0.9 else np.array([1, 0, 0], dtype=np.float32)
        ortho = np.cross(u_n, axis)
        ortho /= (np.linalg.norm(ortho) + 1e-8)
        return (2 * np.outer(ortho, ortho) - np.eye(3, dtype=np.float32)).astype(np.float32)
    axis = np.cross(u_n, v_n)
    sin_a = np.linalg.norm(axis)
    axis /= (sin_a + 1e-8)
    cos_a = dot
    K = np.array([
        [0, -axis[2], axis[1]],
        [axis[2], 0, -axis[0]],
        [-axis[1], axis[0], 0]
    ], dtype=np.float32)
    R = np.eye(3, dtype=np.float32) + sin_a * K + (1 - cos_a) * (K @ K)
    return R.astype(np.float32)

class SMPLMeshFitter:
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            base_dir = Path(__file__).resolve().parent.parent.parent
            model_path = str(base_dir / "models" / "SMPL_M_model.npz")
        
        self.model_path = model_path
        self._loaded = False
        self.v_template = None
        self.faces = None
        self.J = None
        self.weights = None
        self.parents = None
        self.shapedirs = None
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            print(f"[SMPLMeshFitter] Model file not found at {self.model_path}")
            return
        
        data = np.load(self.model_path, allow_pickle=True)
        self.v_template = data['v_template'].copy().astype(np.float32)
        self.faces = data['f'].copy().astype(np.uint32)
        self.J = data['J'].copy().astype(np.float32)
        self.weights = data['weights'].copy().astype(np.float32)
        self.parents = data['kintree_table'][0]
        self.shapedirs = data['shapedirs'].astype(np.float32)
        self._loaded = True
        print(f"[SMPLMeshFitter] Loaded SMPL model: {len(self.v_template)} vertices, {len(self.faces)} faces")

    def fit_and_export_glb(
        self,
        landmarks: List[Dict[str, Any]],
        output_glb_path: str,
        custom_betas: Optional[np.ndarray] = None,
        body_proportions: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Fits SMPL mesh to MediaPipe 33 landmarks and exports patient-posed GLB.
        Dynamically generalizes to different patient body sizes (height, shoulders, pelvis)
        and articulates to match their unique photo posture.
        Returns updated 3D joint coordinates for interactive raycasting.
        """
        if not self._loaded:
            self._load_model()
            if not self._loaded:
                return {}

        v = self.v_template.copy()
        J = self.J.copy()
        W = self.weights.copy()
        f = self.faces.copy()

        # 1. Apply patient-specific anthropometric shape blend shapes (betas)
        betas = np.zeros(300, dtype=np.float32)
        if custom_betas is not None:
            betas[:len(custom_betas)] = custom_betas
        elif body_proportions is not None:
            height_cm = float(body_proportions.get("estimated_height_cm", 175.0) or 175.0)
            sh_w = float(body_proportions.get("shoulder_width_m", 0.44) or 0.44)
            hip_w = float(body_proportions.get("hip_width_m", 0.36) or 0.36)
            torso_h = float(body_proportions.get("torso_height_m", 0.55) or 0.55)

            # Beta 0: Height scaling (reference ~175cm)
            betas[0] = float(np.clip(-(height_cm - 175.0) / 8.5, -3.5, 3.5))

            # Beta 1: Body build / width ratio (stockiness vs slenderness)
            width_ratio = (sh_w + hip_w) / max(0.6, torso_h * 1.45)
            betas[1] = float(np.clip((width_ratio - 1.0) * 3.5, -2.5, 3.0))

            # Beta 2: Athletic V-taper / frame definition
            v_taper = sh_w / max(0.25, hip_w)
            betas[2] = float(np.clip((v_taper - 1.25) * 2.5, -2.0, 2.5))

            # Beta 3: Torso-to-leg ratio
            betas[3] = float(np.clip((torso_h - 0.52) * 3.5, -2.0, 2.0))
        else:
            betas[0] = -1.0  # Athletic tall proportions baseline
            betas[1] = 2.0   # Toned waist
            betas[2] = -0.5  # Muscular definition
        
        v = v + np.einsum('vcd,d->vc', self.shapedirs, betas)

        # 2. Extract landmark vectors
        lm_map = {lm["id"]: lm for lm in landmarks}

        # Check if coordinates are normalized [0, 1] image coords or already centered 3D meters
        is_raw_image_coords = any(0.0 <= lm.get("x", 0.0) <= 1.0 and 0.0 <= lm.get("y", 0.0) <= 1.0 for lm in landmarks) and not any(lm.get("y", 0.0) < -0.1 for lm in landmarks)

        def get_mp(idx: int) -> Tuple[np.ndarray, float]:
            if idx in lm_map:
                lm = lm_map[idx]
                vis = float(lm.get("visibility", 1.0) or 1.0)
                if is_raw_image_coords:
                    # MediaPipe raw: x right [0, 1], y down [0, 1]
                    pt = np.array([lm["x"] - 0.5, -(lm["y"] - 0.5), -lm["z"]], dtype=np.float32)
                else:
                    # Normalized 3D meters: x right, y up, z out
                    pt = np.array([lm["x"], lm["y"], lm["z"]], dtype=np.float32)
                return pt, vis
            return np.zeros(3, dtype=np.float32), 0.0

        pt_nose, vis_nose = get_mp(0)
        pt_sh_l, vis_sh_l = get_mp(11)
        pt_sh_r, vis_sh_r = get_mp(12)
        pt_el_l, vis_el_l = get_mp(13)
        pt_el_r, vis_el_r = get_mp(14)
        pt_wr_l, vis_wr_l = get_mp(15)
        pt_wr_r, vis_wr_r = get_mp(16)
        pt_hip_l, vis_hip_l = get_mp(23)
        pt_hip_r, vis_hip_r = get_mp(24)
        pt_kn_l, vis_kn_l = get_mp(25)
        pt_kn_r, vis_kn_r = get_mp(26)
        pt_an_l, vis_an_l = get_mp(27)
        pt_an_r, vis_an_r = get_mp(28)

        # Joint relative rotations (24 joints)
        R = [np.eye(3, dtype=np.float32) for _ in range(24)]

        # --- A. DETECT POSTURE: SEATED VS STANDING ---
        v_th_l = pt_kn_l - pt_hip_l
        v_th_r = pt_kn_r - pt_hip_r

        # Patient is seated if thighs project forward (+Z) or are largely horizontal
        is_seated = (
            (vis_kn_l > 0.35 and (v_th_l[2] > 0.15 or v_th_l[1] > -0.32)) or
            (vis_kn_r > 0.35 and (v_th_r[2] > 0.15 or v_th_r[1] > -0.32))
        )

        # Natural A-pose arm rotation fallback (arms ~55 deg downward)
        a_rad = np.radians(55.0)
        c, s = np.cos(a_rad), np.sin(a_rad)
        R_l_default = np.array([[c, s, 0], [-s, c, 0], [0, 0, 1]], dtype=np.float32)
        R_r_default = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]], dtype=np.float32)

        # --- B. TORSO & SPINE (Natural Upright Stance) ---
        if vis_sh_l > 0.35 and vis_sh_r > 0.35 and vis_hip_l > 0.35 and vis_hip_r > 0.35:
            mid_sh = (pt_sh_l + pt_sh_r) / 2.0
            mid_hip = (pt_hip_l + pt_hip_r) / 2.0
            v_spine = mid_sh - mid_hip
            if v_spine[1] > 0.2:  # Spine must point upward
                blend_spine = (np.array([0, 1, 0], dtype=np.float32) * 5.0 + v_spine) / 6.0
                R[3] = rot_from_u_to_v(np.array([0, 1, 0], dtype=np.float32), blend_spine)

        # --- C. ARMS & FOREARMS (Dynamic Articulation for Abduction / Stance / Elevation) ---
        # Left Arm (SMPL Joint 16, parent 13 -> 9 -> 6 -> 3 -> 0)
        if vis_sh_l > 0.30 and vis_el_l > 0.25 and np.linalg.norm(pt_el_l - pt_sh_l) > 0.04:
            v_arm_l = pt_el_l - pt_sh_l
            v_arm_l_local = R[3].T @ v_arm_l
            R[16] = rot_from_u_to_v(np.array([1, 0, 0], dtype=np.float32), v_arm_l_local)

            # Left Forearm / Elbow (SMPL Joint 18, parent 16)
            if vis_wr_l > 0.20 and np.linalg.norm(pt_wr_l - pt_el_l) > 0.04:
                v_fore_l = pt_wr_l - pt_el_l
                v_fore_l_local = R[16].T @ (R[3].T @ v_fore_l)
                R[18] = rot_from_u_to_v(np.array([1, 0, 0], dtype=np.float32), v_fore_l_local)
            elif is_seated:
                ang = np.radians(35.0)
                R[18] = np.array([[np.cos(ang), 0, np.sin(ang)], [0, 1, 0], [-np.sin(ang), 0, np.cos(ang)]], dtype=np.float32)
        else:
            R[16] = R_l_default

        # Right Arm (SMPL Joint 17, parent 14 -> 9 -> 6 -> 3 -> 0)
        if vis_sh_r > 0.30 and vis_el_r > 0.25 and np.linalg.norm(pt_el_r - pt_sh_r) > 0.04:
            v_arm_r = pt_el_r - pt_sh_r
            v_arm_r_local = R[3].T @ v_arm_r
            R[17] = rot_from_u_to_v(np.array([-1, 0, 0], dtype=np.float32), v_arm_r_local)

            # Right Forearm / Elbow (SMPL Joint 19, parent 17)
            if vis_wr_r > 0.20 and np.linalg.norm(pt_wr_r - pt_el_r) > 0.04:
                v_fore_r = pt_wr_r - pt_el_r
                v_fore_r_local = R[17].T @ (R[3].T @ v_fore_r)
                R[19] = rot_from_u_to_v(np.array([-1, 0, 0], dtype=np.float32), v_fore_r_local)
            elif is_seated:
                ang = np.radians(-35.0)
                R[19] = np.array([[np.cos(ang), 0, np.sin(ang)], [0, 1, 0], [-np.sin(ang), 0, np.cos(ang)]], dtype=np.float32)
        else:
            R[17] = R_r_default

        # --- D. HEAD & NECK (Always Anatomically Upright: Zero Hammerhead) ---
        if vis_nose > 0.5 and vis_sh_l > 0.4 and vis_sh_r > 0.4:
            mid_sh = (pt_sh_l + pt_sh_r) / 2.0
            v_head = pt_nose - mid_sh
            if v_head[1] > 0.1:  # Head must be above shoulders
                blend_head = (np.array([0, 1, 0], dtype=np.float32) * 6.0 + v_head) / 7.0
                R[15] = rot_from_u_to_v(np.array([0, 1, 0], dtype=np.float32), blend_head)
            else:
                R[15] = np.eye(3, dtype=np.float32)
        else:
            R[15] = np.eye(3, dtype=np.float32)

        # --- E. HIPS, THIGHS, KNEES & SHINS (Seated or Standing Articulation) ---
        # Left Leg: Thigh (Joint 1)
        if vis_kn_l > 0.30 and np.linalg.norm(v_th_l) > 0.05:
            R[1] = rot_from_u_to_v(np.array([0, -1, 0], dtype=np.float32), v_th_l)

            # Left Leg: Knee / Shin (Joint 4)
            v_shin_l = pt_an_l - pt_kn_l
            if vis_an_l > 0.30 and np.linalg.norm(v_shin_l) > 0.05:
                v_shin_l_local = R[1].T @ v_shin_l
                R[4] = rot_from_u_to_v(np.array([0, -1, 0], dtype=np.float32), v_shin_l_local)
            elif is_seated:
                # Natural 80 deg knee flexion when seated
                ang = np.radians(80.0)
                R[4] = np.array([[1, 0, 0], [0, np.cos(ang), -np.sin(ang)], [0, np.sin(ang), np.cos(ang)]], dtype=np.float32)

        # Right Leg: Thigh (Joint 2)
        if vis_kn_r > 0.30 and np.linalg.norm(v_th_r) > 0.05:
            R[2] = rot_from_u_to_v(np.array([0, -1, 0], dtype=np.float32), v_th_r)

            # Right Leg: Knee / Shin (Joint 5)
            v_shin_r = pt_an_r - pt_kn_r
            if vis_an_r > 0.30 and np.linalg.norm(v_shin_r) > 0.05:
                v_shin_r_local = R[2].T @ v_shin_r
                R[5] = rot_from_u_to_v(np.array([0, -1, 0], dtype=np.float32), v_shin_r_local)
            elif is_seated:
                ang = np.radians(80.0)
                R[5] = np.array([[1, 0, 0], [0, np.cos(ang), -np.sin(ang)], [0, np.sin(ang), np.cos(ang)]], dtype=np.float32)

        # 3. Forward Kinematics to calculate transformation matrices
        T = [np.eye(4, dtype=np.float32) for _ in range(24)]
        T[0][:3, :3] = R[0]
        T[0][:3, 3] = J[0]

        for i in range(1, 24):
            p = self.parents[i]
            rel_T = np.eye(4, dtype=np.float32)
            rel_T[:3, :3] = R[i]
            rel_T[:3, 3] = J[i] - J[p]
            T[i] = T[p] @ rel_T

        # 4. Linear Blend Skinning (LBS)
        G = np.zeros((24, 4, 4), dtype=np.float32)
        for i in range(24):
            rest_inv = np.eye(4, dtype=np.float32)
            rest_inv[:3, 3] = -J[i]
            G[i] = T[i] @ rest_inv

        v_homo = np.hstack([v, np.ones((len(v), 1), dtype=np.float32)])
        G_verts = np.einsum('ki,iab->kab', W, G)
        v_posed = np.einsum('kab,kb->ka', G_verts, v_homo)[:, :3]

        # 5. Ground alignment: shift feet to ground grid at Y = -0.90
        y_min = v_posed[:, 1].min()
        shift_y = y_min + 0.90
        v_posed[:, 1] -= shift_y

        # Also shift world joint coordinates accordingly
        posed_joints = {}
        # Joint mapping to clinical zone IDs
        # 1: L_Hip, 2: R_Hip, 4: L_Knee, 5: R_Knee, 7: L_Ankle, 8: R_Ankle,
        # 3: Spine1, 12: Neck, 16: L_Shoulder, 17: R_Shoulder, 18: L_Elbow, 19: R_Elbow, 20: L_Wrist, 21: R_Wrist
        joint_map = {
            "RIGHT_KNEE": 5,
            "LEFT_KNEE": 4,
            "RIGHT_HIP": 2,
            "LEFT_HIP": 1,
            "LUMBAR_SPINE": 3,
            "CERVICAL_SPINE": 12,
            "RIGHT_SHOULDER": 17,
            "LEFT_SHOULDER": 16,
            "RIGHT_ELBOW": 19,
            "LEFT_ELBOW": 18,
            "RIGHT_WRIST": 21,
            "LEFT_WRIST": 20,
            "RIGHT_ANKLE": 8,
            "LEFT_ANKLE": 7,
        }
        for name, j_idx in joint_map.items():
            pos = T[j_idx][:3, 3].copy()
            pos[1] -= shift_y
            posed_joints[name] = [round(float(pos[0]), 3), round(float(pos[1]), 3), round(float(pos[2]), 3)]

        # 6. Compute smooth vertex normals
        normals = np.zeros_like(v_posed)
        v0 = v_posed[f[:, 0]]
        v1 = v_posed[f[:, 1]]
        v2 = v_posed[f[:, 2]]
        face_normals = np.cross(v1 - v0, v2 - v0)
        for i in range(3):
            np.add.at(normals, f[:, i], face_normals)
        norms = np.linalg.norm(normals, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        normals = (normals / norms).astype(np.float32)

        # 7. Export standard Binary glTF (GLB)
        v_bytes = v_posed.astype(np.float32).tobytes()
        n_bytes = normals.astype(np.float32).tobytes()
        f_bytes = f.astype(np.uint32).tobytes()

        pad_v = (4 - len(v_bytes) % 4) % 4
        pad_n = (4 - len(n_bytes) % 4) % 4
        pad_f = (4 - len(f_bytes) % 4) % 4

        bin_data = v_bytes + b'\x00'*pad_v + n_bytes + b'\x00'*pad_n + f_bytes + b'\x00'*pad_f

        off_v = 0
        len_v = len(v_bytes)
        off_n = len_v + pad_v
        len_n = len(n_bytes)
        off_f = off_n + len_n + pad_n
        len_f = len(f_bytes)

        gltf = {
            'asset': {'version': '2.0', 'generator': 'SMPL-Patient-Specific-Posed-Fitter'},
            'scenes': [{'nodes': [0]}],
            'nodes': [{'mesh': 0, 'name': 'Patient_Posed_Mesh'}],
            'meshes': [{
                'name': 'SMPL_Patient_Mesh',
                'primitives': [{
                    'attributes': {'POSITION': 0, 'NORMAL': 1},
                    'indices': 2,
                    'mode': 4
                }]
            }],
            'buffers': [{'byteLength': len(bin_data)}],
            'bufferViews': [
                {'buffer': 0, 'byteOffset': off_v, 'byteLength': len_v, 'target': 34962},
                {'buffer': 0, 'byteOffset': off_n, 'byteLength': len_n, 'target': 34962},
                {'buffer': 0, 'byteOffset': off_f, 'byteLength': len_f, 'target': 34963}
            ],
            'accessors': [
                {
                    'bufferView': 0, 'byteOffset': 0, 'componentType': 5126,
                    'count': len(v_posed), 'type': 'VEC3',
                    'min': v_posed.min(axis=0).tolist(), 'max': v_posed.max(axis=0).tolist()
                },
                {
                    'bufferView': 1, 'byteOffset': 0, 'componentType': 5126,
                    'count': len(normals), 'type': 'VEC3',
                    'min': normals.min(axis=0).tolist(), 'max': normals.max(axis=0).tolist()
                },
                {
                    'bufferView': 2, 'byteOffset': 0, 'componentType': 5125,
                    'count': f.size, 'type': 'SCALAR',
                    'min': [int(f.min())], 'max': [int(f.max())]
                }
            ]
        }

        json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
        pad_json = (4 - len(json_bytes) % 4) % 4
        json_bytes += b' ' * pad_json

        header = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(json_bytes) + 8 + len(bin_data))
        json_chunk = struct.pack('<II', len(json_bytes), 0x4E4F534A) + json_bytes
        bin_chunk = struct.pack('<II', len(bin_data), 0x004E4942) + bin_data

        os.makedirs(os.path.dirname(output_glb_path), exist_ok=True)
        with open(output_glb_path, 'wb') as fp:
            fp.write(header + json_chunk + bin_chunk)

        print(f"[SMPLMeshFitter] Exported patient-posed GLB ({os.path.getsize(output_glb_path)} bytes) to {output_glb_path}")

        return {
            "key_joint_positions": posed_joints,
            "glb_path": output_glb_path
        }

smpl_mesh_fitter = SMPLMeshFitter()
