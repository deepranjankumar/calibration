import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { BiomechanicalMeasurement, ClinicalFinding, BodyProportions } from '../../types/examination';

interface PatientSpecificMeshProps {
  meshUrl?: string | null;
  keyJoints?: Record<string, [number, number, number]> | null;
  bodyProportions?: BodyProportions | null;
  selectedRegion: string;
  onSelectRegion?: (region: string, side: 'RIGHT' | 'LEFT') => void;
  affectedSide: 'RIGHT' | 'LEFT' | 'BILATERAL';
  measurements?: BiomechanicalMeasurement[];
  findings?: ClinicalFinding[];
  isExamActive: boolean;
}

export const PatientSpecificMesh: React.FC<PatientSpecificMeshProps> = ({
  meshUrl,
  keyJoints,
  bodyProportions: _bodyProportions,
  selectedRegion,
  onSelectRegion,
  affectedSide: _affectedSide,
  measurements = [],
  findings = [],
  isExamActive: _isExamActive,
}) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const pulseRef = useRef<THREE.Group>(null);

  // Active GLTF model: use patient's customized posed mesh if calibrated, otherwise fallback to canonical SMPL
  const activeModelUrl = meshUrl && meshUrl.trim().length > 0
    ? (meshUrl.startsWith('http') ? meshUrl : `http://localhost:8000${meshUrl}`)
    : '/models/smpl_male_apose.glb';

  const { scene } = useGLTF(activeModelUrl);

  // Extract BufferGeometry from the active GLTF
  const bodyGeometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !geo) {
        geo = (child as THREE.Mesh).geometry.clone();
      }
    });
    return geo;
  }, [scene]);

  // Pulse animation for selected zone indicator
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pulseRef.current) {
      const scale = 1.0 + 0.14 * Math.sin(t * 3.5);
      pulseRef.current.scale.set(scale, scale, scale);
    }
  });

  // Calculate dynamic joint severity color based on clinical findings
  const jointColor = useMemo(() => {
    const hasCritical = findings.some((f) => f.severity === 'CRITICAL');
    if (hasCritical) return '#ef4444'; // Red
    const hasModerate = findings.some((f) => f.severity === 'MODERATE' || f.severity === 'SEVERE');
    if (hasModerate) return '#f59e0b'; // Amber
    return '#00e5ff'; // Radiant Cyan
  }, [findings]);

  // Base fallback anatomical coordinates for canonical SMPL A-pose
  const baseZones = useMemo(() => [
    { id: 'RIGHT_KNEE', name: "Patient's Right Knee", side: 'RIGHT' as const, defaultPos: [-0.11, -0.345, 0.04] },
    { id: 'LEFT_KNEE', name: "Patient's Left Knee", side: 'LEFT' as const, defaultPos: [0.105, -0.345, 0.04] },
    { id: 'RIGHT_HIP', name: "Patient's Right Hip", side: 'RIGHT' as const, defaultPos: [-0.095, 0.085, 0.02] },
    { id: 'LEFT_HIP', name: "Patient's Left Hip", side: 'LEFT' as const, defaultPos: [0.095, 0.085, 0.02] },
    { id: 'LUMBAR_SPINE', name: "Patient's Lumbar Spine", side: 'BILATERAL' as const, defaultPos: [0.0, 0.29, -0.02] },
    { id: 'CERVICAL_SPINE', name: "Patient's Cervical Spine", side: 'BILATERAL' as const, defaultPos: [0.0, 0.69, 0.02] },
    { id: 'RIGHT_SHOULDER', name: "Patient's Right Shoulder", side: 'RIGHT' as const, defaultPos: [-0.19, 0.64, 0.01] },
    { id: 'LEFT_SHOULDER', name: "Patient's Left Shoulder", side: 'LEFT' as const, defaultPos: [0.19, 0.64, 0.01] },
    { id: 'RIGHT_ELBOW', name: "Patient's Right Elbow", side: 'RIGHT' as const, defaultPos: [-0.29, 0.38, -0.01] },
    { id: 'LEFT_ELBOW', name: "Patient's Left Elbow", side: 'LEFT' as const, defaultPos: [0.29, 0.38, -0.01] },
    { id: 'RIGHT_WRIST', name: "Patient's Right Wrist/Hand", side: 'RIGHT' as const, defaultPos: [-0.40, 0.11, -0.02] },
    { id: 'LEFT_WRIST', name: "Patient's Left Wrist/Hand", side: 'LEFT' as const, defaultPos: [0.40, 0.11, -0.02] },
    { id: 'RIGHT_ANKLE', name: "Patient's Right Ankle", side: 'RIGHT' as const, defaultPos: [-0.095, -0.81, 0.01] },
    { id: 'LEFT_ANKLE', name: "Patient's Left Ankle", side: 'LEFT' as const, defaultPos: [0.095, -0.81, 0.01] },
  ], []);

  // Anatomical zones accurately positioned at the patient's posed joints
  const patientZones = useMemo(() => {
    return baseZones.map((z) => {
      let pos: [number, number, number] = z.defaultPos as [number, number, number];
      if (keyJoints) {
        if (keyJoints[z.id]) {
          pos = keyJoints[z.id];
        } else if (keyJoints[z.id.toUpperCase()]) {
          pos = keyJoints[z.id.toUpperCase()];
        }
      }
      return { ...z, pos };
    });
  }, [baseZones, keyJoints]);

  // Latest kinematic measurement
  const latestMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  // Active joint for kinematic readout
  const activeZone = useMemo(() => {
    if (!selectedRegion) return null;
    return patientZones.find((z) => z.id === selectedRegion) || null;
  }, [patientZones, selectedRegion]);

  return (
    <group position={[0, -0.05, 0]}>
      {/* --- PATIENT SPECIFIC POSED ANATOMICAL WIREFRAME MESH (IMAGE 1 AESTHETIC) --- */}
      {bodyGeometry && (
        <group>
          {/* Layer 1: Dark translucent silhouette core (depthWrite=false prevents any z-buffer holes or black clipping) */}
          <mesh geometry={bodyGeometry}>
            <meshStandardMaterial
              color="#021422"
              roughness={0.5}
              metalness={0.1}
              transparent
              opacity={0.65}
              depthWrite={false}
            />
          </mesh>

          {/* Layer 2: Radiant cyan wireframe topology (Getty Images aesthetic) */}
          <mesh geometry={bodyGeometry}>
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00b4d8"
              emissiveIntensity={0.4}
              wireframe
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      )}

      {/* --- INTERACTIVE PATIENT JOINT ZONES (CLEAN: NO PERMANENT DOTS OR CLUTTER) --- */}
      {patientZones.map((zone) => {
        const isSelected = selectedRegion === zone.id;
        const isHovered = hoveredZone === zone.id;

        return (
          <group key={zone.id} position={zone.pos}>
            {/* Clickable invisible raycast collider: depthWrite=false ensures it NEVER punches holes in the mesh */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectRegion) {
                  onSelectRegion(zone.id, zone.side === 'BILATERAL' ? 'RIGHT' : zone.side);
                }
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredZone(zone.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredZone(null);
                document.body.style.cursor = 'default';
              }}
            >
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshBasicMaterial
                transparent
                opacity={0}
                depthWrite={false}
              />
            </mesh>

            {/* Glowing cyan hover indicator ring (ONLY rendered when hovering) */}
            {isHovered && !isSelected && (
              <mesh position={[0, 0, 0.02]}>
                <ringGeometry args={[0.04, 0.065, 32]} />
                <meshBasicMaterial
                  color="#00e5ff"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.9}
                  depthWrite={false}
                />
              </mesh>
            )}

            {/* Glowing pulse ring ONLY when user explicitly picks this point */}
            {isSelected && (
              <group ref={pulseRef}>
                <mesh position={[0, 0, 0.03]}>
                  <ringGeometry args={[0.05, 0.085, 32]} />
                  <meshBasicMaterial
                    color={jointColor}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0.9}
                    depthWrite={false}
                  />
                </mesh>
                <mesh>
                  <sphereGeometry args={[0.02, 16, 16]} />
                  <meshStandardMaterial
                    color={jointColor}
                    emissive={jointColor}
                    emissiveIntensity={0.9}
                    depthWrite={false}
                  />
                </mesh>
              </group>
            )}

            {/* Interactive hover tooltip */}
            {isHovered && (
              <Html distanceFactor={3.8} position={[0, 0.16, 0]} center style={{ pointerEvents: 'none' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(6, 14, 28, 0.95)',
                    color: '#22d3ee',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #00e5ff',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
                    fontSize: '11px',
                    fontWeight: 700,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.02em',
                  }}
                >
                  👉 Click to examine: {zone.name}
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* --- DYNAMIC KINEMATIC READOUT OVERLAY (ON PATIENT'S ACTIVE JOINT) --- */}
      {latestMeasurement && activeZone && (
        <Html
          position={[activeZone.pos[0] + (activeZone.pos[0] < 0 ? -0.32 : 0.32), activeZone.pos[1], activeZone.pos[2] + 0.15]}
          center
          distanceFactor={3.8}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-slate-950/95 border border-cyan-500/60 rounded-xl p-3 shadow-2xl backdrop-blur-md text-white min-w-[200px]">
            <div className="flex items-center justify-between gap-2 border-b border-cyan-500/30 pb-1 mb-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-400 font-mono">
                Patient Kinematics
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                {latestMeasurement.quality_rating}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Flexion Angle:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {latestMeasurement.maximum_flexion_deg?.toFixed(1)}°
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Terminal Ext.:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {latestMeasurement.terminal_extension_deg?.toFixed(1)}°
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active ROM:</span>
                <span className="font-mono font-bold text-amber-400">
                  {latestMeasurement.range_of_motion_deg?.toFixed(1)}°
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-[10px]">
                <span className="text-slate-500">CV Confidence:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {(latestMeasurement.tracking_confidence_mean * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </Html>
      )}

      {/* --- CLINICAL FINDING PINS --- */}
      {findings
        .filter((f) => f.mesh_anchor)
        .map((finding) => {
          const anchor = finding.mesh_anchor!;
          return (
            <group key={finding.id} position={[anchor.x, anchor.y, anchor.z]}>
              <mesh>
                <sphereGeometry args={[0.02, 16, 16]} />
                <meshBasicMaterial color="#ef4444" depthWrite={false} />
              </mesh>
              <Html distanceFactor={3.8} position={[0, 0.08, 0]} center style={{ pointerEvents: 'none' }}>
                <div className="bg-red-950/90 border border-red-500/50 text-red-200 text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                  ● {finding.title}
                </div>
              </Html>
            </group>
          );
        })}
    </group>
  );
};
