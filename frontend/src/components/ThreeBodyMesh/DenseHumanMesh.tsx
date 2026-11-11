import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { BiomechanicalMeasurement, ClinicalFinding, Point3D } from '../../types/examination';

interface DenseHumanMeshProps {
  selectedRegion: string;
  onSelectRegion?: (region: string, side: 'RIGHT' | 'LEFT') => void;
  affectedSide: 'RIGHT' | 'LEFT' | 'BILATERAL';
  measurements?: BiomechanicalMeasurement[];
  findings?: ClinicalFinding[];
  isExamActive: boolean;
  isMotionActive?: boolean;
  selectedPoint?: Point3D | null;
  selectedPoints?: Point3D[];
  selectionMode?: 'POINT' | 'LINE';
  onSelectPoint?: (point: Point3D) => void;
}

const RadiationCylinder: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
}> = ({ start, end, color = '#f59e0b' }) => {
  const { position, quaternion, length } = useMemo(() => {
    const pA = new THREE.Vector3(...start);
    const pB = new THREE.Vector3(...end);
    const length = pA.distanceTo(pB);
    const position = pA.clone().add(pB).multiplyScalar(0.5);
    const v = pB.clone().sub(pA).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    return { position, quaternion: quat, length };
  }, [start, end]);

  if (length < 0.001) return null;

  return (
    <group>
      {/* Outer soft glowing sheath */}
      <mesh position={position} quaternion={quaternion} raycast={() => null}>
        <cylinderGeometry args={[0.014, 0.014, length, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.1}
          roughness={0.2}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>
      {/* Inner intense radiant laser core */}
      <mesh position={position} quaternion={quaternion} raycast={() => null}>
        <cylinderGeometry args={[0.006, 0.006, length, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

interface AnatomicalZone {
  id: string;
  name: string;
  side: 'RIGHT' | 'LEFT' | 'BILATERAL';
  position: [number, number, number];
  radius: number;
}

// Canonical SMPL athletic mesh joint locations
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
  onSelectRegion: _onSelectRegion,
  affectedSide,
  measurements = [],
  findings = [],
  isExamActive: _isExamActive,
  isMotionActive = false,
  selectedPoint,
  selectedPoints,
  selectionMode = 'LINE',
  onSelectPoint,
}) => {
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
    if (!selectedRegion) return null;
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
    } else if (reg.includes('KNEE')) {
      return {
        node1: [targetX * 0.095, 0.085, 0.02] as [number, number, number],
        node2: [targetX * 0.11, -0.345, 0.04] as [number, number, number],
        node3: [targetX * 0.095, -0.81, 0.01] as [number, number, number],
        label: 'Knee Kinematics',
        calloutPos: [targetX * 0.11 + (isRight ? -0.32 : 0.32), -0.345, 0.15] as [number, number, number],
      };
    }
    return null;
  }, [selectedRegion, isRight, targetX]);

  return (
    <group position={[0, -0.05, 0]}>
      {/* --- DENSE ANATOMICAL HUMAN MESH (IMAGE 1 WIREFRAME AESTHETIC) --- */}
      {bodyGeometry && !isMotionActive && (
        <group>
          {/* Layer 1: Dark core + Raycast surface listener for ANY POINT on the body */}
          <mesh
            geometry={bodyGeometry}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectPoint) {
                onSelectPoint({
                  x: e.point.x,
                  y: e.point.y,
                  z: e.point.z,
                  normal: e.face ? { x: e.face.normal.x, y: e.face.normal.y, z: e.face.normal.z } : undefined,
                });
              }
            }}
            onPointerOver={() => {
              document.body.style.cursor = 'crosshair';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default';
            }}
          >
            <meshStandardMaterial
              color="#021422"
              roughness={0.5}
              metalness={0.1}
              transparent
              opacity={isMotionActive ? 0.25 : 0.65}
              depthWrite={false}
            />
          </mesh>

          {/* Layer 2: Radiant glowing cyan wireframe topology (Getty aesthetic) */}
          <mesh geometry={bodyGeometry} raycast={() => null}>
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00b4d8"
              emissiveIntensity={isMotionActive ? 0.2 : 0.4}
              wireframe
              transparent
              opacity={isMotionActive ? 0.35 : 0.85}
            />
          </mesh>
        </group>
      )}

      {/* --- MULTI-POINT & RADIATION LINE 3D PINS --- */}
      {selectedPoints && selectedPoints.length > 0 ? (
        <group>
          {/* 3D Glowing Radiation Tube connecting consecutive nodes ONLY in LINE mode */}
          {selectionMode === 'LINE' &&
            selectedPoints.length >= 2 &&
            selectedPoints.slice(0, -1).map((pt, idx) => {
              const nextPt = selectedPoints[idx + 1];
              return (
                <RadiationCylinder
                  key={`rad-seg-${idx}`}
                  start={[pt.x, pt.y, pt.z]}
                  end={[nextPt.x, nextPt.y, nextPt.z]}
                  color="#f59e0b"
                />
              );
            })}

          {/* Individual Marked Point Beacon Spheres & Number Badges */}
          {selectedPoints.map((pt, idx) => (
            <group key={`pt-${idx}-${pt.x.toFixed(3)}-${pt.y.toFixed(3)}`} position={[pt.x, pt.y, pt.z]}>
              <group ref={idx === selectedPoints.length - 1 ? pulseRef : undefined}>
                <mesh position={[0, 0, 0.02]} raycast={() => null}>
                  <ringGeometry args={[0.035, 0.065, 32]} />
                  <meshBasicMaterial
                    color={idx === 0 ? '#00e5ff' : '#f59e0b'}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0.9}
                    depthWrite={false}
                  />
                </mesh>
              </group>

              <mesh raycast={() => null}>
                <sphereGeometry args={[0.018, 16, 16]} />
                <meshStandardMaterial
                  color={idx === 0 ? '#38bdf8' : '#fbbf24'}
                  emissive={idx === 0 ? '#38bdf8' : '#fbbf24'}
                  emissiveIntensity={1.2}
                  depthWrite={false}
                />
              </mesh>

              {/* Number Pin Badge */}
              <Html position={[0, 0.045, 0]} center distanceFactor={3.5} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
                <div className="bg-slate-900/95 text-cyan-300 border border-cyan-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-lg pointer-events-none select-none">
                  {idx + 1}
                </div>
              </Html>
            </group>
          ))}
        </group>
      ) : (
        /* Single point fallback */
        selectedPoint && (
          <group position={[selectedPoint.x, selectedPoint.y, selectedPoint.z]}>
            {/* Animated radiating beacon pulse ring */}
            <group ref={pulseRef}>
              <mesh position={[0, 0, 0.02]} raycast={() => null}>
                <ringGeometry args={[0.045, 0.08, 32]} />
                <meshBasicMaterial
                  color="#00e5ff"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.9}
                  depthWrite={false}
                />
              </mesh>
              <mesh position={[0, 0, 0.025]} raycast={() => null}>
                <ringGeometry args={[0.015, 0.035, 32]} />
                <meshBasicMaterial
                  color="#f59e0b"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.95}
                  depthWrite={false}
                />
              </mesh>
            </group>

            {/* Glowing central target sphere */}
            <mesh raycast={() => null}>
              <sphereGeometry args={[0.02, 16, 16]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#38bdf8"
                emissiveIntensity={1.2}
                depthWrite={false}
              />
            </mesh>
          </group>
        )
      )}

      {/* --- ACTIVE ANATOMICAL SELECTION INDICATOR (CLEAN: NO BLOCKING COLLIDERS OR HOVER TEXT) --- */}
      {ANATOMICAL_ZONES.map((zone) => {
        const isSelected = selectedRegion === zone.id;
        if (!isSelected) return null;

        return (
          <group key={zone.id} position={zone.position} ref={pulseRef}>
            <mesh position={[0, 0, 0.03]} raycast={() => null}>
              <ringGeometry args={[0.05, 0.085, 32]} />
              <meshBasicMaterial
                color={jointColor}
                side={THREE.DoubleSide}
                transparent
                opacity={0.9}
                depthWrite={false}
              />
            </mesh>
            <mesh raycast={() => null}>
              <sphereGeometry args={[0.02, 16, 16]} />
              <meshStandardMaterial
                color={jointColor}
                emissive={jointColor}
                emissiveIntensity={0.9}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}

      {/* --- DYNAMIC BIOMECHANICAL KINEMATIC OVERLAY (WHEN MEASUREMENT ACTIVE) --- */}
      {latestMeasurement && jointKinematics && (
        <group>
          {/* 1. Tracked 3D Joint Nodes */}
          <mesh position={jointKinematics.node1}>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.6} depthWrite={false} />
          </mesh>
          <mesh position={jointKinematics.node2}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshStandardMaterial color={jointColor} emissive={jointColor} emissiveIntensity={0.8} depthWrite={false} />
          </mesh>
          <mesh position={jointKinematics.node3}>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.6} depthWrite={false} />
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
            <lineBasicMaterial attach="material" color="#22d3ee" linewidth={2} />
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
            <lineBasicMaterial attach="material" color={jointColor} linewidth={2} />
          </line>

          {/* 3. Floating 3D Angle & ROM Readout Callout */}
          <Html position={jointKinematics.calloutPos} center distanceFactor={3.8} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
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
                <sphereGeometry args={[0.02, 16, 16]} />
                <meshBasicMaterial color="#ef4444" depthWrite={false} />
              </mesh>
              <Html distanceFactor={3.8} position={[0, 0.08, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
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

useGLTF.preload('/models/smpl_male_apose.glb');
