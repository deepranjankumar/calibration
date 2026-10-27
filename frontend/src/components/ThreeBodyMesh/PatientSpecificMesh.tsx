import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { Landmark3D, BiomechanicalMeasurement, ClinicalFinding, BodyProportions } from '../../types/examination';

interface PatientSpecificMeshProps {
  landmarks?: Landmark3D[] | null;
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
  landmarks,
  keyJoints,
  bodyProportions,
  selectedRegion,
  onSelectRegion,
  affectedSide: _affectedSide,
  measurements = [],
  findings = [],
  isExamActive,
}) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const pulseRef = useRef<THREE.Group>(null);

  // Load canonical SMPL anatomical athletic mesh
  const { scene } = useGLTF('/models/smpl_male_apose.glb');

  // Extract BufferGeometry from GLTF
  const baseGeometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !geo) {
        geo = (child as THREE.Mesh).geometry.clone();
      }
    });
    return geo;
  }, [scene]);

  // Compute scale factors from calibrated patient biometrics
  const [scaleX, scaleY, scaleZ] = useMemo(() => {
    if (!bodyProportions) return [1.0, 1.0, 1.0];
    const sX = bodyProportions.shoulder_width_m ? Math.max(0.75, Math.min(1.35, bodyProportions.shoulder_width_m / 0.40)) : 1.0;
    const sY = bodyProportions.estimated_height_cm ? Math.max(0.75, Math.min(1.35, bodyProportions.estimated_height_cm / 189.0)) : 1.0;
    const sZ = 1.0;
    return [sX, sY, sZ];
  }, [bodyProportions]);

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

  // Scaled anatomical zones fitted to the calibrated patient's body dimensions
  const patientZones = useMemo(() => {
    const baseZones = [
      { id: 'RIGHT_KNEE', name: "Patient's Right Knee", side: 'RIGHT' as const, basePos: [-0.11, -0.345, 0.04] },
      { id: 'LEFT_KNEE', name: "Patient's Left Knee", side: 'LEFT' as const, basePos: [0.105, -0.345, 0.04] },
      { id: 'RIGHT_HIP', name: "Patient's Right Hip", side: 'RIGHT' as const, basePos: [-0.095, 0.085, 0.02] },
      { id: 'LEFT_HIP', name: "Patient's Left Hip", side: 'LEFT' as const, basePos: [0.095, 0.085, 0.02] },
      { id: 'LUMBAR_SPINE', name: "Patient's Lumbar Spine", side: 'BILATERAL' as const, basePos: [0.0, 0.29, -0.02] },
      { id: 'CERVICAL_SPINE', name: "Patient's Cervical Spine", side: 'BILATERAL' as const, basePos: [0.0, 0.69, 0.02] },
      { id: 'RIGHT_SHOULDER', name: "Patient's Right Shoulder", side: 'RIGHT' as const, basePos: [-0.19, 0.64, 0.01] },
      { id: 'LEFT_SHOULDER', name: "Patient's Left Shoulder", side: 'LEFT' as const, basePos: [0.19, 0.64, 0.01] },
      { id: 'RIGHT_ELBOW', name: "Patient's Right Elbow", side: 'RIGHT' as const, basePos: [-0.29, 0.38, -0.01] },
      { id: 'LEFT_ELBOW', name: "Patient's Left Elbow", side: 'LEFT' as const, basePos: [0.29, 0.38, -0.01] },
      { id: 'RIGHT_WRIST', name: "Patient's Right Wrist/Hand", side: 'RIGHT' as const, basePos: [-0.40, 0.11, -0.02] },
      { id: 'LEFT_WRIST', name: "Patient's Left Wrist/Hand", side: 'LEFT' as const, basePos: [0.40, 0.11, -0.02] },
      { id: 'RIGHT_ANKLE', name: "Patient's Right Ankle", side: 'RIGHT' as const, basePos: [-0.095, -0.81, 0.01] },
      { id: 'LEFT_ANKLE', name: "Patient's Left Ankle", side: 'LEFT' as const, basePos: [0.095, -0.81, 0.01] },
    ];

    return baseZones.map((z) => {
      // If direct 3D key joint coordinates were calculated by CV intake, use them; otherwise scale base SMPL joint
      let pos: [number, number, number] = [
        z.basePos[0] * scaleX,
        z.basePos[1] * scaleY,
        z.basePos[2] * scaleZ,
      ];
      if (keyJoints && keyJoints[z.id.toLowerCase()]) {
        pos = keyJoints[z.id.toLowerCase()];
      }
      return { ...z, pos };
    });
  }, [scaleX, scaleY, scaleZ, keyJoints]);

  // Latest kinematic measurement
  const latestMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  // Active joint for kinematic readout
  const activeZone = useMemo(() => {
    return patientZones.find((z) => z.id === selectedRegion) || patientZones[0];
  }, [patientZones, selectedRegion]);

  return (
    <group position={[0, -0.05, 0]}>
      {/* --- PATIENT SPECIFIC DEFORMED ANATOMICAL WIREFRAME MESH --- */}
      {baseGeometry && (
        <group scale={[scaleX, scaleY, scaleZ]}>
          {/* Layer 1: Dark volumetric silhouette core */}
          <mesh geometry={baseGeometry}>
            <meshStandardMaterial
              color="#021422"
              roughness={0.45}
              metalness={0.2}
              transparent
              opacity={0.80}
            />
          </mesh>

          {/* Layer 2: Radiant cyan wireframe topology */}
          <mesh geometry={baseGeometry}>
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00b4d8"
              emissiveIntensity={0.35}
              wireframe
              transparent
              opacity={0.82}
            />
          </mesh>
        </group>
      )}

      {/* --- REAL-TIME 3D LANDMARK SKELETON (IF STREAMING FROM REPLAY/CV) --- */}
      {landmarks && landmarks.length > 0 && (
        <group>
          {landmarks.map((lm) => (
            <mesh key={lm.id} position={[lm.x, lm.y, lm.z]}>
              <sphereGeometry args={[0.018, 12, 12]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={0.8}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* --- INTERACTIVE PATIENT JOINT ZONES --- */}
      {patientZones.map((zone) => {
        const isSelected = selectedRegion === zone.id;
        const isHovered = hoveredZone === zone.id;

        return (
          <group key={zone.id} position={zone.pos}>
            {/* Clickable collider */}
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
              <sphereGeometry args={[0.11, 16, 16]} />
              <meshBasicMaterial
                color={isSelected ? '#00e5ff' : isHovered ? '#67e8f9' : '#0284c7'}
                transparent
                opacity={isSelected ? 0.35 : isHovered ? 0.25 : 0.001}
                wireframe={isSelected || isHovered}
              />
            </mesh>

            {/* Visual Joint Sphere Node */}
            <mesh>
              <sphereGeometry args={[isSelected ? 0.035 : isHovered ? 0.028 : 0.018, 16, 16]} />
              <meshStandardMaterial
                color={isSelected ? jointColor : isHovered ? '#67e8f9' : '#00e5ff'}
                emissive={isSelected ? jointColor : isHovered ? '#00e5ff' : '#0284c7'}
                emissiveIntensity={isSelected ? 0.9 : isHovered ? 0.7 : 0.3}
              />
            </mesh>

            {/* Glowing target ring when idle */}
            {!isExamActive && (
              <mesh position={[0, 0, 0.02]}>
                <ringGeometry args={[0.04, 0.065, 24]} />
                <meshBasicMaterial
                  color={isHovered ? '#22d3ee' : '#00e5ff'}
                  transparent
                  opacity={isHovered ? 0.95 : 0.45}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* Concentric pulsing ring on selected painful zone */}
            {isSelected && (
              <group ref={pulseRef}>
                <mesh position={[0, 0, 0.03]}>
                  <ringGeometry args={[0.08, 0.12, 32]} />
                  <meshBasicMaterial
                    color={jointColor}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0.85}
                  />
                </mesh>
              </group>
            )}

            {/* Hover Tooltip */}
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
            <group key={finding.id} position={[anchor.x * scaleX, anchor.y * scaleY, anchor.z * scaleZ]}>
              <mesh>
                <sphereGeometry args={[0.025, 16, 16]} />
                <meshBasicMaterial color="#ef4444" />
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
