import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
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
  size: [number, number, number];
}

const ZONES: AnatomicalZone[] = [
  { id: 'RIGHT_KNEE', name: 'Right Knee Joint', side: 'RIGHT', position: [-0.45, -0.65, 0.05], size: [0.32, 0.36, 0.32] },
  { id: 'LEFT_KNEE', name: 'Left Knee Joint', side: 'LEFT', position: [0.45, -0.65, 0.05], size: [0.32, 0.36, 0.32] },
  { id: 'RIGHT_HIP', name: 'Right Hip & Pelvis', side: 'RIGHT', position: [-0.48, 0.15, 0.0], size: [0.35, 0.35, 0.35] },
  { id: 'LEFT_HIP', name: 'Left Hip & Pelvis', side: 'LEFT', position: [0.48, 0.15, 0.0], size: [0.35, 0.35, 0.35] },
  { id: 'LUMBAR_SPINE', name: 'Lumbar Spine (Low Back)', side: 'BILATERAL', position: [0.0, 0.45, -0.05], size: [0.4, 0.5, 0.3] },
  { id: 'CERVICAL_SPINE', name: 'Cervical Spine (Neck)', side: 'BILATERAL', position: [0.0, 1.45, 0.0], size: [0.3, 0.3, 0.3] },
  { id: 'RIGHT_SHOULDER', name: 'Right Shoulder', side: 'RIGHT', position: [-0.95, 1.15, 0.0], size: [0.35, 0.35, 0.35] },
  { id: 'LEFT_SHOULDER', name: 'Left Shoulder', side: 'LEFT', position: [0.95, 1.15, 0.0], size: [0.35, 0.35, 0.35] },
  { id: 'RIGHT_ELBOW', name: 'Right Elbow Joint', side: 'RIGHT', position: [-0.85, 0.55, 0.0], size: [0.28, 0.32, 0.28] },
  { id: 'LEFT_ELBOW', name: 'Left Elbow Joint', side: 'LEFT', position: [0.85, 0.55, 0.0], size: [0.28, 0.32, 0.28] },
  { id: 'RIGHT_WRIST', name: 'Right Wrist & Hand', side: 'RIGHT', position: [-0.85, 0.10, 0.0], size: [0.25, 0.30, 0.25] },
  { id: 'LEFT_WRIST', name: 'Left Wrist & Hand', side: 'LEFT', position: [0.85, 0.10, 0.0], size: [0.25, 0.30, 0.25] },
  { id: 'RIGHT_ANKLE', name: 'Right Ankle & Foot', side: 'RIGHT', position: [-0.45, -1.55, 0.1], size: [0.3, 0.35, 0.35] },
  { id: 'LEFT_ANKLE', name: 'Left Ankle & Foot', side: 'LEFT', position: [0.45, -1.55, 0.1], size: [0.3, 0.35, 0.35] },
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

  // Latest kinematic measurement
  const latestMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  // Pulse animation for selected zone and kinematic indicators
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pulseRef.current) {
      const scale = 1.0 + 0.12 * Math.sin(t * 3.5);
      pulseRef.current.scale.set(scale, scale, scale);
    }
  });

  // Calculate dynamic knee joint color based on findings
  const kneeColor = useMemo(() => {
    const hasCritical = findings.some(f => f.severity === 'CRITICAL');
    if (hasCritical) return '#ef4444'; // Red
    const hasModerate = findings.some(f => f.severity === 'MODERATE' || f.severity === 'SEVERE');
    if (hasModerate) return '#f59e0b'; // Amber
    return '#06b6d4'; // Cyan
  }, [findings]);

  const isRight = affectedSide === 'RIGHT' || selectedRegion.includes('RIGHT');
  const targetX = isRight ? -1 : 1;

  // Dynamic 3D kinematic tracking vectors based on the symptomatic region
  const jointKinematics = useMemo(() => {
    const reg = selectedRegion.toUpperCase();
    if (reg.includes('SHOULDER')) {
      return {
        node1: [0, 1.48, 0] as [number, number, number],
        node2: [targetX * 0.95, 1.15, 0] as [number, number, number],
        node3: [targetX * 0.85, 0.55, 0] as [number, number, number],
        label: 'Shoulder Kinematics',
        calloutPos: [targetX * 0.95 + (isRight ? -0.45 : 0.45), 1.15, 0.15] as [number, number, number],
      };
    } else if (reg.includes('ELBOW')) {
      return {
        node1: [targetX * 0.95, 1.15, 0] as [number, number, number],
        node2: [targetX * 0.85, 0.55, 0] as [number, number, number],
        node3: [targetX * 0.85, 0.10, 0] as [number, number, number],
        label: 'Elbow Kinematics',
        calloutPos: [targetX * 0.85 + (isRight ? -0.45 : 0.45), 0.55, 0.15] as [number, number, number],
      };
    } else if (reg.includes('WRIST')) {
      return {
        node1: [targetX * 0.85, 0.55, 0] as [number, number, number],
        node2: [targetX * 0.85, 0.10, 0] as [number, number, number],
        node3: [targetX * 0.85, -0.20, 0] as [number, number, number],
        label: 'Wrist Kinematics',
        calloutPos: [targetX * 0.85 + (isRight ? -0.45 : 0.45), 0.10, 0.15] as [number, number, number],
      };
    } else if (reg.includes('HIP')) {
      return {
        node1: [0, 0.45, 0] as [number, number, number],
        node2: [targetX * 0.48, 0.15, 0] as [number, number, number],
        node3: [targetX * 0.45, -0.65, 0.05] as [number, number, number],
        label: 'Hip Kinematics',
        calloutPos: [targetX * 0.48 + (isRight ? -0.45 : 0.45), 0.15, 0.15] as [number, number, number],
      };
    } else if (reg.includes('ANKLE')) {
      return {
        node1: [targetX * 0.45, -0.65, 0.05] as [number, number, number],
        node2: [targetX * 0.45, -1.55, 0.1] as [number, number, number],
        node3: [targetX * 0.45, -1.65, 0.25] as [number, number, number],
        label: 'Ankle Kinematics',
        calloutPos: [targetX * 0.45 + (isRight ? -0.45 : 0.45), -1.55, 0.15] as [number, number, number],
      };
    } else if (reg.includes('SPINE') || reg.includes('LUMBAR') || reg.includes('CERVICAL')) {
      return {
        node1: [0, 1.48, 0] as [number, number, number],
        node2: [0, 0.85, 0] as [number, number, number],
        node3: [0, 0.45, -0.05] as [number, number, number],
        label: 'Spine Kinematics',
        calloutPos: [0.55, 0.65, 0.15] as [number, number, number],
      };
    }
    // Default Knee Kinematics
    return {
      node1: [targetX * 0.45, 0.15, 0] as [number, number, number],
      node2: [targetX * 0.45, -0.65, 0.05] as [number, number, number],
      node3: [targetX * 0.45, -1.55, 0.1] as [number, number, number],
      label: 'Knee Kinematics',
      calloutPos: [targetX * 0.45 + (isRight ? -0.45 : 0.45), -0.65, 0.15] as [number, number, number],
    };
  }, [selectedRegion, isRight, targetX]);

  return (
    <group position={[0, -0.1, 0]}>
      {/* --- ANATOMICAL DENSE WIREFRAME MODEL --- */}
      
      {/* 1. Head & Cranium */}
      <group position={[0, 1.82, 0]}>
        <mesh>
          <sphereGeometry args={[0.26, 24, 24]} />
          <meshStandardMaterial
            color="#0ea5e9"
            wireframe
            transparent
            opacity={0.35}
            roughness={0.2}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.24, 16, 16]} />
          <meshStandardMaterial
            color="#0369a1"
            transparent
            opacity={0.12}
            roughness={0.4}
          />
        </mesh>
      </group>

      {/* 2. Neck & Cervical Spine */}
      <mesh position={[0, 1.48, 0]}>
        <cylinderGeometry args={[0.11, 0.13, 0.22, 16]} />
        <meshStandardMaterial color="#0284c7" wireframe transparent opacity={0.3} />
      </mesh>

      {/* 3. Thoracic Ribcage & Chest */}
      <group position={[0, 1.05, 0]}>
        <mesh>
          <cylinderGeometry args={[0.42, 0.36, 0.65, 24, 8]} />
          <meshStandardMaterial color="#0284c7" wireframe transparent opacity={0.32} />
        </mesh>
        {/* Internal core glow */}
        <mesh>
          <cylinderGeometry args={[0.38, 0.32, 0.6, 16]} />
          <meshStandardMaterial color="#0c4a6e" transparent opacity={0.15} />
        </mesh>
      </group>

      {/* 4. Lumbar Spine & Abdomen */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.34, 0.38, 0.45, 20, 6]} />
        <meshStandardMaterial color="#0284c7" wireframe transparent opacity={0.32} />
      </mesh>

      {/* 5. Pelvis & Sacrum */}
      <group position={[0, 0.15, 0]}>
        <mesh>
          <cylinderGeometry args={[0.44, 0.42, 0.38, 24, 6]} />
          <meshStandardMaterial color="#0369a1" wireframe transparent opacity={0.38} />
        </mesh>
      </group>

      {/* 6. Arms & Forearms */}
      {/* Right Arm */}
      <group position={[-0.85, 0.85, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.09, 0.08, 0.45, 12]} />
          <meshStandardMaterial color="#0284c7" wireframe transparent opacity={0.25} />
        </mesh>
        <mesh position={[0, -0.65, 0]}>
          <cylinderGeometry args={[0.075, 0.065, 0.45, 12]} />
          <meshStandardMaterial color="#0284c7" wireframe transparent opacity={0.25} />
        </mesh>
      </group>
      {/* Left Arm */}
      <group position={[0.85, 0.85, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.09, 0.08, 0.45, 12]} />
          <meshStandardMaterial color="#0284c7" wireframe transparent opacity={0.25} />
        </mesh>
        <mesh position={[0, -0.65, 0]}>
          <cylinderGeometry args={[0.075, 0.065, 0.45, 12]} />
          <meshStandardMaterial color="#0284c7" wireframe transparent opacity={0.25} />
        </mesh>
      </group>

      {/* 7. Lower Extremities: Thighs, Knees, Shanks, Ankles */}
      {/* Right Leg */}
      <group position={[-0.45, 0, 0]}>
        {/* Right Femur / Thigh */}
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.16, 0.13, 0.65, 16, 8]} />
          <meshStandardMaterial
            color={selectedRegion === 'RIGHT_KNEE' ? kneeColor : '#0284c7'}
            wireframe
            transparent
            opacity={selectedRegion === 'RIGHT_KNEE' ? 0.65 : 0.3}
          />
        </mesh>

        {/* Right Patella & Knee Joint Capsule */}
        <group position={[0, -0.65, 0.05]}>
          <mesh>
            <sphereGeometry args={[0.14, 18, 18]} />
            <meshStandardMaterial
              color={selectedRegion === 'RIGHT_KNEE' ? kneeColor : '#0284c7'}
              wireframe
              transparent
              opacity={selectedRegion === 'RIGHT_KNEE' ? 0.9 : 0.4}
              emissive={selectedRegion === 'RIGHT_KNEE' ? kneeColor : '#000000'}
              emissiveIntensity={selectedRegion === 'RIGHT_KNEE' ? 0.5 : 0}
            />
          </mesh>
          {/* Patella Anterior Disc */}
          <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
            <meshStandardMaterial
              color={selectedRegion === 'RIGHT_KNEE' ? kneeColor : '#38bdf8'}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* Right Shank / Tibia */}
        <mesh position={[0, -1.1, 0.02]}>
          <cylinderGeometry args={[0.12, 0.09, 0.75, 16, 8]} />
          <meshStandardMaterial
            color={selectedRegion === 'RIGHT_KNEE' ? kneeColor : '#0284c7'}
            wireframe
            transparent
            opacity={selectedRegion === 'RIGHT_KNEE' ? 0.55 : 0.3}
          />
        </mesh>

        {/* Right Foot & Ankle */}
        <mesh position={[0, -1.55, 0.08]}>
          <boxGeometry args={[0.16, 0.12, 0.32]} />
          <meshStandardMaterial color="#0284c7" wireframe transparent opacity={0.3} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group position={[0.45, 0, 0]}>
        {/* Left Femur / Thigh */}
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.16, 0.13, 0.65, 16, 8]} />
          <meshStandardMaterial
            color={selectedRegion === 'LEFT_KNEE' ? kneeColor : '#0284c7'}
            wireframe
            transparent
            opacity={selectedRegion === 'LEFT_KNEE' ? 0.65 : 0.3}
          />
        </mesh>

        {/* Left Knee Joint Capsule */}
        <group position={[0, -0.65, 0.05]}>
          <mesh>
            <sphereGeometry args={[0.14, 18, 18]} />
            <meshStandardMaterial
              color={selectedRegion === 'LEFT_KNEE' ? kneeColor : '#0284c7'}
              wireframe
              transparent
              opacity={selectedRegion === 'LEFT_KNEE' ? 0.9 : 0.4}
              emissive={selectedRegion === 'LEFT_KNEE' ? kneeColor : '#000000'}
              emissiveIntensity={selectedRegion === 'LEFT_KNEE' ? 0.5 : 0}
            />
          </mesh>
          <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
            <meshStandardMaterial
              color={selectedRegion === 'LEFT_KNEE' ? kneeColor : '#38bdf8'}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* Left Shank / Tibia */}
        <mesh position={[0, -1.1, 0.02]}>
          <cylinderGeometry args={[0.12, 0.09, 0.75, 16, 8]} />
          <meshStandardMaterial
            color={selectedRegion === 'LEFT_KNEE' ? kneeColor : '#0284c7'}
            wireframe
            transparent
            opacity={selectedRegion === 'LEFT_KNEE' ? 0.55 : 0.3}
          />
        </mesh>

        {/* Left Foot & Ankle */}
        <mesh position={[0, -1.55, 0.08]}>
          <boxGeometry args={[0.16, 0.12, 0.32]} />
          <meshStandardMaterial color="#0284c7" wireframe transparent opacity={0.3} />
        </mesh>
      </group>

      {/* --- INTERACTIVE RAYCAST HIT ZONES --- */}
      {ZONES.map((zone) => {
        const isSelected = selectedRegion === zone.id;
        const isHovered = hoveredZone === zone.id;
        return (
          <group key={zone.id} position={zone.position}>
            {/* Clickable transparent collider */}
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
              <boxGeometry args={zone.size} />
              <meshBasicMaterial
                color={isSelected ? '#38bdf8' : isHovered ? '#67e8f9' : '#0284c7'}
                transparent
                opacity={isSelected ? 0.35 : isHovered ? 0.25 : 0.001}
                wireframe={isSelected || isHovered}
              />
            </mesh>

            {/* Glowing target ring / pulse on each zone when idle */}
            {!isExamActive && (
              <mesh position={[0, 0, 0.05]}>
                <ringGeometry args={[0.07, 0.10, 24]} />
                <meshBasicMaterial
                  color={isHovered ? '#22d3ee' : '#0ea5e9'}
                  transparent
                  opacity={isHovered ? 0.95 : 0.55}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* Pulsing indicator on selected zone */}
            {isSelected && (
              <group ref={pulseRef}>
                <mesh>
                  <ringGeometry args={[0.22, 0.28, 32]} />
                  <meshBasicMaterial
                    color={kneeColor}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0.85}
                  />
                </mesh>
              </group>
            )}

            {/* Hover tooltip */}
            {isHovered && (
              <Html distanceFactor={7} position={[0, 0.25, 0]} center>
                <div style={{
                  backgroundColor: 'rgba(8, 15, 30, 0.95)',
                  color: '#22d3ee',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: '1.5px solid #06b6d4',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                  fontSize: '11px',
                  fontWeight: 700,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                }}>
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
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={jointKinematics.node2}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color={kneeColor} emissive={kneeColor} emissiveIntensity={0.8} />
          </mesh>
          <mesh position={jointKinematics.node3}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.6} />
          </mesh>

          {/* 2. Kinematic Links (Femur & Tibia or Arm vectors) */}
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={(geo) => {
                const points = [
                  new THREE.Vector3(...jointKinematics.node1),
                  new THREE.Vector3(...jointKinematics.node2)
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
                  new THREE.Vector3(...jointKinematics.node3)
                ];
                geo.setFromPoints(points);
              }}
            />
            <lineBasicMaterial attach="material" color={kneeColor} linewidth={3} />
          </line>

          {/* 3. Floating 3D Angle & ROM Readout Callout */}
          <Html position={jointKinematics.calloutPos} center distanceFactor={7}>
            <div className="bg-slate-950/95 border border-cyan-500/60 rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-white min-w-[190px]">
              <div className="flex items-center justify-between gap-2 border-b border-cyan-500/30 pb-1 mb-1.5">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-cyan-400">
                  {jointKinematics.label}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  latestMeasurement.quality_rating === 'HIGH' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                }`}>
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
                  <span className="text-slate-500">Tracking Conf:</span>
                  <span className="font-mono text-emerald-400">
                    {(latestMeasurement.tracking_confidence_mean * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* --- ANATOMICAL FINDING PINS (FROM LOCALIZATION / OBSERVATIONS) --- */}
      {findings.filter(f => f.mesh_anchor).map((finding) => {
        const anchor = finding.mesh_anchor!;
        const posX = isRight ? -anchor.x * 2 : anchor.x * 2;
        const posY = -0.65 + anchor.y * 1.5;
        const posZ = 0.05 + anchor.z;

        return (
          <group key={finding.id} position={[posX, posY, posZ]}>
            <mesh>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            <Html distanceFactor={8} position={[0, 0.12, 0]} center>
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
