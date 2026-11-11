import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { TimeSeriesSample } from '../../types/examination';

interface KinematicMotionSkeletonProps {
  activeFrameData?: TimeSeriesSample | null;
  selectedRegion?: string;
  affectedSide?: 'RIGHT' | 'LEFT' | 'BILATERAL';
}

// Reusable volumetric anatomical body segment (wireframe + core)
const VolumetricSegment: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  radiusTop?: number;
  radiusBottom?: number;
  isHighlighted?: boolean;
}> = ({ start, end, radiusTop = 0.05, radiusBottom = 0.04, isHighlighted = false }) => {
  const { position, quaternion, length } = useMemo(() => {
    const pA = new THREE.Vector3(...start);
    const pB = new THREE.Vector3(...end);
    const len = pA.distanceTo(pB);
    const pos = pA.clone().add(pB).multiplyScalar(0.5);
    const v = pB.clone().sub(pA).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    return { position: pos, quaternion: quat, length: len };
  }, [start, end]);

  if (length < 0.01) return null;

  return (
    <group position={position} quaternion={quaternion}>
      {/* 1. Volumetric anatomical dark core */}
      <mesh>
        <cylinderGeometry args={[radiusTop, radiusBottom, length, 16]} />
        <meshStandardMaterial
          color="#021422"
          roughness={0.4}
          metalness={0.2}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Radiant cyan anatomical wireframe contour */}
      <mesh>
        <cylinderGeometry args={[radiusTop * 1.02, radiusBottom * 1.02, length, 16, 4]} />
        <meshStandardMaterial
          color={isHighlighted ? '#f59e0b' : '#00e5ff'}
          emissive={isHighlighted ? '#fbbf24' : '#00b4d8'}
          emissiveIntensity={isHighlighted ? 0.9 : 0.45}
          wireframe
          transparent
          opacity={isHighlighted ? 0.9 : 0.75}
        />
      </mesh>

      {/* 3. Inner illuminated bone core */}
      <mesh>
        <cylinderGeometry args={[0.01, 0.01, length * 0.98, 8]} />
        <meshStandardMaterial
          color={isHighlighted ? '#fef08a' : '#38bdf8'}
          emissive={isHighlighted ? '#eab308' : '#0284c7'}
          emissiveIntensity={1.3}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export const KinematicMotionSkeleton: React.FC<KinematicMotionSkeletonProps> = ({
  activeFrameData,
  selectedRegion = '',
  affectedSide = 'RIGHT',
}) => {
  const lms = activeFrameData?.frame_landmarks_3d;

  // Build landmark lookup map
  const lmMap = useMemo(() => {
    if (!lms || lms.length === 0) return null;
    const map = new Map<number, [number, number, number]>();
    lms.forEach((lm) => {
      map.set(lm.id, [lm.x, lm.y, lm.z]);
    });
    return map;
  }, [lms]);

  if (!lmMap || lmMap.size === 0) return null;

  // Determine active measured joint based on selectedRegion & affectedSide
  const isRight = affectedSide === 'RIGHT' || selectedRegion.toUpperCase().includes('RIGHT');
  const reg = selectedRegion.toUpperCase();

  // Active joint triplet [Parent, Vertex, Child]
  let activeJointTriplet: [number, number, number] | null = null;
  if (reg.includes('KNEE') || reg.includes('SHIN') || reg.includes('LEG')) {
    activeJointTriplet = isRight ? [24, 26, 28] : [23, 25, 27]; // Hip -> Knee -> Ankle
  } else if (reg.includes('SHOULDER')) {
    activeJointTriplet = isRight ? [12, 14, 16] : [11, 13, 15];
  } else if (reg.includes('ELBOW')) {
    activeJointTriplet = isRight ? [12, 14, 16] : [11, 13, 15];
  } else if (reg.includes('HIP')) {
    activeJointTriplet = isRight ? [12, 24, 26] : [11, 23, 25];
  } else if (reg.includes('ANKLE')) {
    activeJointTriplet = isRight ? [26, 28, 30] : [25, 27, 29];
  }

  const vertexPos = activeJointTriplet ? lmMap.get(activeJointTriplet[1]) : null;

  // Key landmarks
  const p11 = lmMap.get(11); // Left Shoulder
  const p12 = lmMap.get(12); // Right Shoulder
  const p13 = lmMap.get(13); // Left Elbow
  const p14 = lmMap.get(14); // Right Elbow
  const p15 = lmMap.get(15); // Left Wrist
  const p16 = lmMap.get(16); // Right Wrist
  const p23 = lmMap.get(23); // Left Hip
  const p24 = lmMap.get(24); // Right Hip
  const p25 = lmMap.get(25); // Left Knee
  const p26 = lmMap.get(26); // Right Knee
  const p27 = lmMap.get(27); // Left Ankle
  const p28 = lmMap.get(28); // Right Ankle
  const p31 = lmMap.get(31); // Left Toe
  const p32 = lmMap.get(32); // Right Toe
  const nose = lmMap.get(0);  // Nose / Head

  // Calculate midpoints for torso & pelvis
  const midShoulder: [number, number, number] | null = p11 && p12 ? [
    (p11[0] + p12[0]) / 2,
    (p11[1] + p12[1]) / 2,
    (p11[2] + p12[2]) / 2,
  ] : null;

  const midHip: [number, number, number] | null = p23 && p24 ? [
    (p23[0] + p24[0]) / 2,
    (p23[1] + p24[1]) / 2,
    (p23[2] + p24[2]) / 2,
  ] : null;

  return (
    <group name="patient-articulated-body-mesh">
      {/* ========================================================= */}
      {/* 1. ARTICULATED VOLUMETRIC TORSO & HEAD                   */}
      {/* ========================================================= */}
      {midShoulder && midHip && (
        <VolumetricSegment
          start={midShoulder}
          end={midHip}
          radiusTop={0.15}
          radiusBottom={0.13}
          isHighlighted={reg.includes('SPINE') || reg.includes('LUMBAR') || reg.includes('CHEST')}
        />
      )}

      {/* Head & Neck */}
      {nose && midShoulder && (
        <group>
          {/* Neck link */}
          <VolumetricSegment start={midShoulder} end={nose} radiusTop={0.065} radiusBottom={0.065} />
          {/* Volumetric Head Sphere */}
          <group position={[nose[0], nose[1] + 0.08, nose[2]]}>
            <mesh>
              <sphereGeometry args={[0.095, 20, 20]} />
              <meshStandardMaterial
                color="#021422"
                roughness={0.4}
                metalness={0.1}
                transparent
                opacity={0.65}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.098, 16, 12]} />
              <meshStandardMaterial
                color="#00e5ff"
                emissive="#00b4d8"
                emissiveIntensity={0.4}
                wireframe
                transparent
                opacity={0.7}
              />
            </mesh>
          </group>
        </group>
      )}

      {/* ========================================================= */}
      {/* 2. ARTICULATED LOWER LIMBS (THIGHS, SHINS, FEET)          */}
      {/* ========================================================= */}
      {/* Left Thigh (Hip -> Knee) */}
      {p23 && p25 && (
        <VolumetricSegment
          start={p23}
          end={p25}
          radiusTop={0.068}
          radiusBottom={0.052}
          isHighlighted={activeJointTriplet !== null && activeJointTriplet[1] === 25}
        />
      )}

      {/* Left Shin / Calf (Knee -> Ankle) */}
      {p25 && p27 && (
        <VolumetricSegment
          start={p25}
          end={p27}
          radiusTop={0.050}
          radiusBottom={0.038}
          isHighlighted={activeJointTriplet !== null && activeJointTriplet[1] === 25}
        />
      )}

      {/* Left Foot (Ankle -> Toe) */}
      {p27 && p31 && (
        <VolumetricSegment start={p27} end={p31} radiusTop={0.035} radiusBottom={0.025} />
      )}

      {/* Right Thigh (Hip -> Knee) */}
      {p24 && p26 && (
        <VolumetricSegment
          start={p24}
          end={p26}
          radiusTop={0.068}
          radiusBottom={0.052}
          isHighlighted={activeJointTriplet !== null && activeJointTriplet[1] === 26}
        />
      )}

      {/* Right Shin / Calf (Knee -> Ankle) */}
      {p26 && p28 && (
        <VolumetricSegment
          start={p26}
          end={p28}
          radiusTop={0.050}
          radiusBottom={0.038}
          isHighlighted={activeJointTriplet !== null && activeJointTriplet[1] === 26}
        />
      )}

      {/* Right Foot (Ankle -> Toe) */}
      {p28 && p32 && (
        <VolumetricSegment start={p28} end={p32} radiusTop={0.035} radiusBottom={0.025} />
      )}

      {/* ========================================================= */}
      {/* 3. ARTICULATED UPPER LIMBS (ARMS & FOREARMS)             */}
      {/* ========================================================= */}
      {/* Left Upper Arm */}
      {p11 && p13 && (
        <VolumetricSegment start={p11} end={p13} radiusTop={0.042} radiusBottom={0.036} />
      )}
      {/* Left Forearm */}
      {p13 && p15 && (
        <VolumetricSegment start={p13} end={p15} radiusTop={0.036} radiusBottom={0.028} />
      )}
      {/* Right Upper Arm */}
      {p12 && p14 && (
        <VolumetricSegment start={p12} end={p14} radiusTop={0.042} radiusBottom={0.036} />
      )}
      {/* Right Forearm */}
      {p14 && p16 && (
        <VolumetricSegment start={p14} end={p16} radiusTop={0.036} radiusBottom={0.028} />
      )}

      {/* ========================================================= */}
      {/* 4. GLOWING 3D JOINT SPHERES                               */}
      {/* ========================================================= */}
      {Array.from(lmMap.entries()).map(([id, pos]) => {
        // Render spheres at major joints
        const isMajorJoint = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(id);
        if (!isMajorJoint) return null;

        const isTargetVertex = activeJointTriplet && id === activeJointTriplet[1];
        const radius = isTargetVertex ? 0.036 : 0.022;

        return (
          <group key={`joint-${id}`} position={pos}>
            <mesh>
              <sphereGeometry args={[radius, 16, 16]} />
              <meshStandardMaterial
                color={isTargetVertex ? '#fbbf24' : '#00f0ff'}
                emissive={isTargetVertex ? '#f59e0b' : '#00e5ff'}
                emissiveIntensity={isTargetVertex ? 2.2 : 1.4}
                roughness={0.1}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[radius * 0.5, 12, 12]} />
              <meshBasicMaterial color="#ffffff" depthWrite={false} />
            </mesh>
          </group>
        );
      })}

      {/* ========================================================= */}
      {/* 5. LIVE FLOATING KINEMATIC ANGLE HUD                      */}
      {/* ========================================================= */}
      {vertexPos && activeFrameData && (
        <Html
          position={[vertexPos[0] + (isRight ? -0.25 : 0.25), vertexPos[1] + 0.06, vertexPos[2] + 0.08]}
          center
          distanceFactor={3.6}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-slate-950/95 border-2 border-amber-400 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-md text-white whitespace-nowrap animate-in fade-in select-none">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                Patient Kinematic Movement
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-lg font-black text-amber-400">
                {activeFrameData.flexion_angle_deg.toFixed(1)}°
              </span>
              <span className="text-[11px] text-slate-300 font-mono">
                @ {activeFrameData.time_sec.toFixed(2)}s
              </span>
              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.2 rounded font-mono font-bold">
                {Math.round(activeFrameData.confidence * 100)}% Conf
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};
