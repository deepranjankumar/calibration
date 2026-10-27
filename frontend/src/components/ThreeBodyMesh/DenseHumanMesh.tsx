import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { BiomechanicalMeasurement, ClinicalFinding } from '../../types/examination';

interface DenseHumanMeshProps {
  selectedRegion: string;
  onSelectRegion?: (region: string, side: 'RIGHT' | 'LEFT') => void;
  affectedSide: 'RIGHT' | 'LEFT' | 'BILATERAL';
  measurements?: BiomechanicalMeasurement[];
  findings?: ClinicalFinding[];
  isExamActive: boolean;
}

interface AnatomicalZone {
  id: string;
  name: string;
  side: 'RIGHT' | 'LEFT' | 'BILATERAL';
  position: [number, number, number];
  radius: number;
}

// Exact 3D anatomical coordinates derived from the canonical SMPL athletic mesh
const ANATOMICAL_ZONES: AnatomicalZone[] = [
  { id: 'RIGHT_KNEE', name: 'Right Knee Joint', side: 'RIGHT', position: [-0.11, -0.345, 0.04], radius: 0.09 },
  { id: 'LEFT_KNEE', name: 'Left Knee Joint', side: 'LEFT', position: [0.105, -0.345, 0.04], radius: 0.09 },
  { id: 'RIGHT_HIP', name: 'Right Hip & Pelvis', side: 'RIGHT', position: [-0.095, 0.085, 0.02], radius: 0.10 },
  { id: 'LEFT_HIP', name: 'Left Hip & Pelvis', side: 'LEFT', position: [0.095, 0.085, 0.02], radius: 0.10 },
  { id: 'LUMBAR_SPINE', name: 'Lumbar Spine (Low Back)', side: 'BILATERAL', position: [0.0, 0.29, -0.02], radius: 0.11 },
  { id: 'CERVICAL_SPINE', name: 'Cervical Spine (Neck)', side: 'BILATERAL', position: [0.0, 0.69, 0.02], radius: 0.08 },
  { id: 'RIGHT_SHOULDER', name: 'Right Shoulder', side: 'RIGHT', position: [-0.19, 0.64, 0.01], radius: 0.09 },
  { id: 'LEFT_SHOULDER', name: 'Left Shoulder', side: 'LEFT', position: [0.19, 0.64, 0.01], radius: 0.09 },
  { id: 'RIGHT_ELBOW', name: 'Right Elbow Joint', side: 'RIGHT', position: [-0.29, 0.38, -0.01], radius: 0.08 },
  { id: 'LEFT_ELBOW', name: 'Left Elbow Joint', side: 'LEFT', position: [0.29, 0.38, -0.01], radius: 0.08 },
  { id: 'RIGHT_WRIST', name: 'Right Wrist & Hand', side: 'RIGHT', position: [-0.40, 0.11, -0.02], radius: 0.08 },
  { id: 'LEFT_WRIST', name: 'Left Wrist & Hand', side: 'LEFT', position: [0.40, 0.11, -0.02], radius: 0.08 },
  { id: 'RIGHT_ANKLE', name: 'Right Ankle & Foot', side: 'RIGHT', position: [-0.095, -0.81, 0.01], radius: 0.08 },
  { id: 'LEFT_ANKLE', name: 'Left Ankle & Foot', side: 'LEFT', position: [0.095, -0.81, 0.01], radius: 0.08 },
];

export const DenseHumanMesh: React.FC<DenseHumanMeshProps> = ({
  selectedRegion,
  onSelectRegion,
  affectedSide,
  measurements = [],
  findings = [],
  isExamActive,
}) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const pulseRef = useRef<THREE.Group>(null);

  // Load canonical SMPL anatomical athletic mesh (Image 1 aesthetic)
  const { scene } = useGLTF('/models/smpl_male_apose.glb');

  // Extract pure BufferGeometry from GLTF
  const bodyGeometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !geo) {
        geo = (child as THREE.Mesh).geometry.clone();
      }
    });
    return geo;
  }, [scene]);

  // Latest kinematic measurement
  const latestMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null;

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

  const isRight = affectedSide === 'RIGHT' || selectedRegion.includes('RIGHT');
  const targetX = isRight ? -1 : 1;

  // Dynamic 3D kinematic tracking vectors based on the symptomatic region
  const jointKinematics = useMemo(() => {
    const reg = selectedRegion.toUpperCase();
    if (reg.includes('SHOULDER')) {
      return {
        node1: [0, 0.69, 0.02] as [number, number, number],
        node2: [targetX * 0.19, 0.64, 0.01] as [number, number, number],
        node3: [targetX * 0.29, 0.38, -0.01] as [number, number, number],
        label: 'Shoulder Kinematics',
        calloutPos: [targetX * 0.19 + (isRight ? -0.32 : 0.32), 0.64, 0.15] as [number, number, number],
      };
    } else if (reg.includes('ELBOW')) {
      return {
        node1: [targetX * 0.19, 0.64, 0.01] as [number, number, number],
        node2: [targetX * 0.29, 0.38, -0.01] as [number, number, number],
        node3: [targetX * 0.40, 0.11, -0.02] as [number, number, number],
        label: 'Elbow Kinematics',
        calloutPos: [targetX * 0.29 + (isRight ? -0.32 : 0.32), 0.38, 0.15] as [number, number, number],
      };
    } else if (reg.includes('WRIST')) {
      return {
        node1: [targetX * 0.29, 0.38, -0.01] as [number, number, number],
        node2: [targetX * 0.40, 0.11, -0.02] as [number, number, number],
        node3: [targetX * 0.43, 0.02, -0.04] as [number, number, number],
        label: 'Wrist Kinematics',
        calloutPos: [targetX * 0.40 + (isRight ? -0.32 : 0.32), 0.11, 0.15] as [number, number, number],
      };
    } else if (reg.includes('HIP')) {
      return {
        node1: [0, 0.29, 0] as [number, number, number],
        node2: [targetX * 0.095, 0.085, 0.02] as [number, number, number],
        node3: [targetX * 0.11, -0.345, 0.04] as [number, number, number],
        label: 'Hip Kinematics',
        calloutPos: [targetX * 0.095 + (isRight ? -0.32 : 0.32), 0.085, 0.15] as [number, number, number],
      };
    } else if (reg.includes('ANKLE')) {
      return {
        node1: [targetX * 0.11, -0.345, 0.04] as [number, number, number],
        node2: [targetX * 0.095, -0.81, 0.01] as [number, number, number],
        node3: [targetX * 0.13, -0.88, 0.09] as [number, number, number],
        label: 'Ankle Kinematics',
        calloutPos: [targetX * 0.095 + (isRight ? -0.32 : 0.32), -0.81, 0.15] as [number, number, number],
      };
    } else if (reg.includes('SPINE') || reg.includes('LUMBAR') || reg.includes('CERVICAL')) {
      return {
        node1: [0, 0.69, 0.02] as [number, number, number],
        node2: [0, 0.43, 0.01] as [number, number, number],
        node3: [0, 0.29, -0.02] as [number, number, number],
        label: 'Spine Kinematics',
        calloutPos: [0.35, 0.43, 0.15] as [number, number, number],
      };
    }
    // Default Knee Kinematics
    return {
      node1: [targetX * 0.095, 0.085, 0.02] as [number, number, number],
      node2: [targetX * 0.11, -0.345, 0.04] as [number, number, number],
      node3: [targetX * 0.095, -0.81, 0.01] as [number, number, number],
      label: 'Knee Kinematics',
      calloutPos: [targetX * 0.11 + (isRight ? -0.32 : 0.32), -0.345, 0.15] as [number, number, number],
    };
  }, [selectedRegion, isRight, targetX]);

  return (
    <group position={[0, -0.05, 0]}>
      {/* --- DENSE ANATOMICAL HUMAN MESH (IMAGE 1 WIREFRAME AESTHETIC) --- */}
      {bodyGeometry && (
        <group>
          {/* Layer 1: Dark volumetric silhouette core (prevents visual clutter by occluding back-wires) */}
          <mesh geometry={bodyGeometry}>
            <meshStandardMaterial
              color="#021422"
              roughness={0.45}
              metalness={0.2}
              transparent
              opacity={0.78}
            />
          </mesh>

          {/* Layer 2: Radiant cyan wireframe topology (Getty aesthetic) */}
          <mesh geometry={bodyGeometry}>
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

      {/* --- INTERACTIVE ANATOMICAL RAYCAST HIT ZONES --- */}
      {ANATOMICAL_ZONES.map((zone) => {
        const isSelected = selectedRegion === zone.id;
        const isHovered = hoveredZone === zone.id;

        return (
          <group key={zone.id} position={zone.position}>
            {/* Clickable transparent collider sphere */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectRegion) {
                  onSelectRegion(zone.id, zone.side as 'RIGHT' | 'LEFT');
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
              <sphereGeometry args={[zone.radius * 1.3, 16, 16]} />
              <meshBasicMaterial
                color={isSelected ? '#00e5ff' : isHovered ? '#67e8f9' : '#0284c7'}
                transparent
                opacity={isSelected ? 0.35 : isHovered ? 0.25 : 0.001}
                wireframe={isSelected || isHovered}
              />
            </mesh>

            {/* Glowing target node at the joint */}
            <mesh>
              <sphereGeometry args={[isSelected ? 0.035 : isHovered ? 0.028 : 0.018, 16, 16]} />
              <meshStandardMaterial
                color={isSelected ? jointColor : isHovered ? '#67e8f9' : '#00e5ff'}
                emissive={isSelected ? jointColor : isHovered ? '#00e5ff' : '#0284c7'}
                emissiveIntensity={isSelected ? 0.9 : isHovered ? 0.7 : 0.3}
              />
            </mesh>

            {/* Glowing target ring / pulse on each zone when idle */}
            {!isExamActive && (
              <mesh position={[0, 0, 0.02]}>
                <ringGeometry args={[zone.radius * 0.45, zone.radius * 0.65, 24]} />
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
                  <ringGeometry args={[zone.radius * 0.9, zone.radius * 1.25, 32]} />
                  <meshBasicMaterial
                    color={jointColor}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0.85}
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

      {/* --- DYNAMIC BIOMECHANICAL KINEMATIC OVERLAY --- */}
      {latestMeasurement && (
        <group>
          {/* 1. Tracked 3D Joint Nodes */}
          <mesh position={jointKinematics.node1}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={jointKinematics.node2}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color={jointColor} emissive={jointColor} emissiveIntensity={0.8} />
          </mesh>
          <mesh position={jointKinematics.node3}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.6} />
          </mesh>

          {/* 2. Kinematic Vector Links */}
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={(geo) => {
                const points = [
                  new THREE.Vector3(...jointKinematics.node1),
                  new THREE.Vector3(...jointKinematics.node2),
                ];
                geo.setFromPoints(points);
              }}
            />
            <lineBasicMaterial attach="material" color="#22d3ee" linewidth={3} />
          </line>
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={(geo) => {
                const points = [
                  new THREE.Vector3(...jointKinematics.node2),
                  new THREE.Vector3(...jointKinematics.node3),
                ];
                geo.setFromPoints(points);
              }}
            />
            <lineBasicMaterial attach="material" color={jointColor} linewidth={3} />
          </line>

          {/* 3. Floating 3D Angle & ROM Readout Callout */}
          <Html position={jointKinematics.calloutPos} center distanceFactor={3.8} style={{ pointerEvents: 'none' }}>
            <div className="bg-slate-950/95 border border-cyan-500/60 rounded-xl p-3 shadow-2xl backdrop-blur-md text-white min-w-[200px]">
              <div className="flex items-center justify-between gap-2 border-b border-cyan-500/30 pb-1 mb-1.5">
                <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-400 font-mono">
                  {jointKinematics.label}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    latestMeasurement.quality_rating === 'HIGH'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {latestMeasurement.quality_rating}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Flexion:</span>
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
        </group>
      )}

      {/* --- CLINICAL FINDING PINS --- */}
      {findings
        .filter((f) => f.mesh_anchor)
        .map((finding) => {
          const anchor = finding.mesh_anchor!;
          const posX = isRight ? -anchor.x : anchor.x;
          const posY = -0.345 + anchor.y;
          const posZ = 0.04 + anchor.z;

          return (
            <group key={finding.id} position={[posX, posY, posZ]}>
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

// Preload the SMPL anatomical asset
useGLTF.preload('/models/smpl_male_apose.glb');
