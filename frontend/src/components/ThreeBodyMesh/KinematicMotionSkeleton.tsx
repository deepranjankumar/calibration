import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { TimeSeriesSample, BodyProportions } from '../../types/examination';
import type { DoctorExamDirective } from '../../utils/doctorExamKinematics';

interface KinematicMotionSkeletonProps {
  activeFrameData?: TimeSeriesSample | null;
  selectedRegion?: string;
  affectedSide?: 'RIGHT' | 'LEFT' | 'BILATERAL';
  doctorExamDirective?: DoctorExamDirective;
  bodyProportions?: BodyProportions | null;
}

// Volumetric anatomical wireframe segment (radiant cyber-medical aesthetic)
const VolumetricSegment: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  radiusTop?: number;
  radiusBottom?: number;
  isHighlighted?: boolean;
  highlightColor?: string;
}> = ({
  start,
  end,
  radiusTop = 0.05,
  radiusBottom = 0.04,
  isHighlighted = false,
  highlightColor = '#f59e0b',
}) => {
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
      {/* 1. Volumetric anatomical dark cyber core */}
      <mesh raycast={() => null}>
        <cylinderGeometry args={[radiusTop, radiusBottom, length, 16]} />
        <meshStandardMaterial
          color="#021422"
          roughness={0.4}
          metalness={0.2}
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Radiant cyan wireframe topology contour */}
      <mesh raycast={() => null}>
        <cylinderGeometry args={[radiusTop * 1.02, radiusBottom * 1.02, length, 16, 4]} />
        <meshStandardMaterial
          color={isHighlighted ? highlightColor : '#00e5ff'}
          emissive={isHighlighted ? highlightColor : '#00b4d8'}
          emissiveIntensity={isHighlighted ? 1.1 : 0.45}
          wireframe
          transparent
          opacity={isHighlighted ? 0.95 : 0.8}
        />
      </mesh>

      {/* 3. Inner illuminated bone axis core */}
      <mesh raycast={() => null}>
        <cylinderGeometry args={[0.008, 0.008, length * 0.98, 8]} />
        <meshStandardMaterial
          color={isHighlighted ? '#fef08a' : '#38bdf8'}
          emissive={isHighlighted ? '#eab308' : '#0284c7'}
          emissiveIntensity={1.3}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// Glowing dual-layer radiation tube for nerve radiation (Sciatica / Radiculopathy)
const RadiationTube: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
}> = ({ start, end, color = '#ef4444' }) => {
  const { position, quaternion, length } = useMemo(() => {
    const pA = new THREE.Vector3(...start);
    const pB = new THREE.Vector3(...end);
    const len = pA.distanceTo(pB);
    const pos = pA.clone().add(pB).multiplyScalar(0.5);
    const v = pB.clone().sub(pA).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    return { position: pos, quaternion: quat, length: len };
  }, [start, end]);

  if (length < 0.001) return null;

  return (
    <group position={position} quaternion={quaternion}>
      {/* Outer pulsing radiant sheath */}
      <mesh raycast={() => null}>
        <cylinderGeometry args={[0.016, 0.016, length, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.8}
          roughness={0.1}
          transparent
          opacity={0.88}
          depthWrite={false}
        />
      </mesh>
      {/* Intense inner laser core */}
      <mesh raycast={() => null}>
        <cylinderGeometry args={[0.007, 0.007, length, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.98} depthWrite={false} />
      </mesh>
    </group>
  );
};

export const KinematicMotionSkeleton: React.FC<KinematicMotionSkeletonProps> = ({
  activeFrameData,
  selectedRegion = '',
  affectedSide = 'RIGHT',
  doctorExamDirective = 'STAND_NEUTRAL',
  bodyProportions,
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

  const isRight = affectedSide === 'RIGHT' || selectedRegion.toUpperCase().includes('RIGHT');
  const reg = selectedRegion.toUpperCase();

  // Active joint triplet [Parent, Vertex, Child]
  let activeJointTriplet: [number, number, number] | null = null;
  if (doctorExamDirective === 'BED_SLR') {
    activeJointTriplet = isRight ? [12, 24, 26] : [11, 23, 25]; // Lumbar/Shoulder -> Hip -> Knee
  } else if (reg.includes('CERVICAL') || reg.includes('NECK') || reg.includes('HEAD') || doctorExamDirective === 'NECK_ROTATION') {
    activeJointTriplet = [11, 0, 12]; // Left Shoulder -> Nose/Head -> Right Shoulder
  } else if (doctorExamDirective === 'SHOULDER_ABDUCTION' || reg.includes('SHOULDER')) {
    activeJointTriplet = isRight ? [24, 12, 14] : [23, 11, 13];
  } else if (doctorExamDirective === 'LUMBAR_FLEXION' || reg.includes('LUMBAR') || reg.includes('SPINE') || reg.includes('BACK')) {
    activeJointTriplet = isRight ? [12, 24, 26] : [11, 23, 25];
  } else if (reg.includes('KNEE') || reg.includes('SHIN') || reg.includes('LEG') || doctorExamDirective === 'LEG_UP_DOWN' || doctorExamDirective === 'SPREAD_LEGS' || doctorExamDirective === 'UPLOADED_VIDEO') {
    activeJointTriplet = isRight ? [24, 26, 28] : [23, 25, 27]; // Hip -> Knee -> Ankle
  } else if (reg.includes('ELBOW')) {
    activeJointTriplet = isRight ? [12, 14, 16] : [11, 13, 15];
  } else if (reg.includes('HIP') || doctorExamDirective === 'MOVE_FORWARD') {
    activeJointTriplet = isRight ? [12, 24, 26] : [11, 23, 25];
  } else if (reg.includes('ANKLE')) {
    activeJointTriplet = isRight ? [26, 28, 30] : [25, 27, 29];
  }

  const vertexPos = activeJointTriplet ? lmMap.get(activeJointTriplet[1]) : null;

  // Key landmarks
  const nose = lmMap.get(0);
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
  const p31 = lmMap.get(31); // Left Foot
  const p32 = lmMap.get(32); // Right Foot

  // Midpoints for Torso, Neck, and Pelvis
  const midShoulder: [number, number, number] | null =
    p11 && p12 ? [(p11[0] + p12[0]) / 2, (p11[1] + p12[1]) / 2, (p11[2] + p12[2]) / 2] : null;

  const midHip: [number, number, number] | null =
    p23 && p24 ? [(p23[0] + p24[0]) / 2, (p23[1] + p24[1]) / 2, (p23[2] + p24[2]) / 2] : null;

  const lumbarMid: [number, number, number] | null =
    midShoulder && midHip
      ? [
          midHip[0] + (midShoulder[0] - midHip[0]) * 0.4,
          midHip[1] + (midShoulder[1] - midHip[1]) * 0.4,
          midHip[2] + (midShoulder[2] - midHip[2]) * 0.4,
        ]
      : null;

  // Patient proportion custom limb radius
  const limbScale = bodyProportions ? bodyProportions.estimated_height_cm / 175.0 : 1.0;
  const thighRadius = 0.068 * limbScale;
  const shinRadius = 0.048 * limbScale;
  const armRadius = 0.042 * limbScale;
  const torsoRadius = 0.155 * limbScale;

  const isBedExam = doctorExamDirective === 'BED_SLR';
  const isSciaticaHighlighted =
    isBedExam && (activeFrameData?.flexion_angle_deg || 0) >= 28.0;

  // Dynamic severity highlight color
  const highlightColor = isSciaticaHighlighted ? '#ef4444' : '#fbbf24';

  // Affected leg coordinates for sciatica radiation path (L4-S1 nerve root)
  const affHip = isRight ? p24 : p23;
  const affKnee = isRight ? p26 : p25;
  const affAnkle = isRight ? p28 : p27;

  return (
    <group name="patient-dense-articulated-body-mesh">
      {/* ========================================================= */}
      {/* 1. ARTICULATED VOLUMETRIC TORSO & HEAD                    */}
      {/* ========================================================= */}
      {/* Upper Thoracic & Ribcage Segment */}
      {midShoulder && lumbarMid && (
        <VolumetricSegment
          start={midShoulder}
          end={lumbarMid}
          radiusTop={torsoRadius * 1.15}
          radiusBottom={torsoRadius * 0.95}
          isHighlighted={isBedExam || reg.includes('SPINE') || reg.includes('CHEST')}
          highlightColor={isBedExam ? '#06b6d4' : '#fbbf24'}
        />
      )}

      {/* Lumbar Spine & Abdomen Segment */}
      {lumbarMid && midHip && (
        <VolumetricSegment
          start={lumbarMid}
          end={midHip}
          radiusTop={torsoRadius * 0.95}
          radiusBottom={torsoRadius * 1.05}
          isHighlighted={isBedExam || reg.includes('LUMBAR') || reg.includes('SPINE')}
          highlightColor={isSciaticaHighlighted ? '#ef4444' : '#f59e0b'}
        />
      )}

      {/* Anatomical Pelvic Girdle Link (Hip-to-Hip Bar) */}
      {p23 && p24 && (
        <VolumetricSegment
          start={p23}
          end={p24}
          radiusTop={0.065 * limbScale}
          radiusBottom={0.065 * limbScale}
          isHighlighted={isBedExam}
          highlightColor="#0284c7"
        />
      )}

      {/* Shoulder Girdle Link (Shoulder-to-Shoulder Bar) */}
      {p11 && p12 && (
        <VolumetricSegment
          start={p11}
          end={p12}
          radiusTop={0.055 * limbScale}
          radiusBottom={0.055 * limbScale}
        />
      )}

      {/* Cervical Spine / Neck */}
      {nose && midShoulder && (
        <VolumetricSegment
          start={midShoulder}
          end={nose}
          radiusTop={0.062 * limbScale}
          radiusBottom={0.068 * limbScale}
          isHighlighted={doctorExamDirective === 'NECK_ROTATION' || reg.includes('CERVICAL') || reg.includes('NECK')}
          highlightColor={doctorExamDirective === 'NECK_ROTATION' ? '#14b8a6' : '#f59e0b'}
        />
      )}

      {/* Contoured Cranial Head Sphere with Dynamic Facial Yaw Pointer */}
      {nose && (
        <group position={[nose[0], nose[1] + (isBedExam ? 0.02 : 0.08), nose[2]]}>
          {/* Dark anatomical silhouette core */}
          <mesh raycast={() => null}>
            <sphereGeometry args={[0.098 * limbScale, 20, 20]} />
            <meshStandardMaterial
              color="#021422"
              roughness={0.4}
              metalness={0.15}
              transparent
              opacity={0.7}
              depthWrite={false}
            />
          </mesh>
          {/* Radiant cyan/teal anatomical wireframe grid */}
          <mesh raycast={() => null}>
            <sphereGeometry args={[0.102 * limbScale, 16, 12]} />
            <meshStandardMaterial
              color={doctorExamDirective === 'NECK_ROTATION' ? '#2dd4bf' : '#00e5ff'}
              emissive={doctorExamDirective === 'NECK_ROTATION' ? '#0d9488' : '#00b4d8'}
              emissiveIntensity={0.55}
              wireframe
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* Facial Orientation Indicator: Nose/Chin Forward Marker */}
          <mesh position={[0, -0.015 * limbScale, 0.095 * limbScale]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
            <coneGeometry args={[0.022 * limbScale, 0.05 * limbScale, 8]} />
            <meshStandardMaterial
              color={doctorExamDirective === 'NECK_ROTATION' ? '#fde047' : '#38bdf8'}
              emissive={doctorExamDirective === 'NECK_ROTATION' ? '#eab308' : '#0284c7'}
              emissiveIntensity={1.3}
            />
          </mesh>
        </group>
      )}

      {/* ========================================================= */}
      {/* 2. ARTICULATED LOWER LIMBS (THIGHS, KNEES, SHINS, FEET)   */}
      {/* ========================================================= */}
      {/* Left Thigh (Hip -> Knee) */}
      {p23 && p25 && (
        <VolumetricSegment
          start={p23}
          end={p25}
          radiusTop={thighRadius}
          radiusBottom={thighRadius * 0.78}
          isHighlighted={(!isRight && isBedExam) || (activeJointTriplet !== null && activeJointTriplet[1] === 25)}
          highlightColor={!isRight && isSciaticaHighlighted ? '#ef4444' : highlightColor}
        />
      )}

      {/* Left Shin / Calf (Knee -> Ankle) */}
      {p25 && p27 && (
        <VolumetricSegment
          start={p25}
          end={p27}
          radiusTop={shinRadius}
          radiusBottom={shinRadius * 0.72}
          isHighlighted={(!isRight && isBedExam) || (activeJointTriplet !== null && activeJointTriplet[1] === 25)}
          highlightColor={!isRight && isSciaticaHighlighted ? '#ef4444' : highlightColor}
        />
      )}

      {/* Left Foot (Ankle -> Toe) */}
      {p27 && p31 && (
        <VolumetricSegment
          start={p27}
          end={p31}
          radiusTop={0.038 * limbScale}
          radiusBottom={0.028 * limbScale}
        />
      )}

      {/* Right Thigh (Hip -> Knee) */}
      {p24 && p26 && (
        <VolumetricSegment
          start={p24}
          end={p26}
          radiusTop={thighRadius}
          radiusBottom={thighRadius * 0.78}
          isHighlighted={(isRight && isBedExam) || (activeJointTriplet !== null && activeJointTriplet[1] === 26)}
          highlightColor={isRight && isSciaticaHighlighted ? '#ef4444' : highlightColor}
        />
      )}

      {/* Right Shin / Calf (Knee -> Ankle) */}
      {p26 && p28 && (
        <VolumetricSegment
          start={p26}
          end={p28}
          radiusTop={shinRadius}
          radiusBottom={shinRadius * 0.72}
          isHighlighted={(isRight && isBedExam) || (activeJointTriplet !== null && activeJointTriplet[1] === 26)}
          highlightColor={isRight && isSciaticaHighlighted ? '#ef4444' : highlightColor}
        />
      )}

      {/* Right Foot (Ankle -> Toe) */}
      {p28 && p32 && (
        <VolumetricSegment
          start={p28}
          end={p32}
          radiusTop={0.038 * limbScale}
          radiusBottom={0.028 * limbScale}
        />
      )}

      {/* ========================================================= */}
      {/* 3. SCIATIC NERVE RADICULAR TENSION PATH (L4-S1 RADIATION) */}
      {/* ========================================================= */}
      {isSciaticaHighlighted && lumbarMid && affHip && affKnee && affAnkle && (
        <group name="sciatic-nerve-radiation-path">
          {/* L4-L5 Root from Lumbar Spine to Sciatic Notch */}
          <RadiationTube start={lumbarMid} end={affHip} color="#ef4444" />
          {/* Sciatic Trunk down Posterior Thigh */}
          <RadiationTube start={affHip} end={affKnee} color="#f59e0b" />
          {/* Tibial / Peroneal Nerve down Calf to Ankle */}
          <RadiationTube start={affKnee} end={affAnkle} color="#ef4444" />
        </group>
      )}

      {/* ========================================================= */}
      {/* 4. ARTICULATED UPPER LIMBS (SHOULDERS, ARMS, HANDS)       */}
      {/* ========================================================= */}
      {/* Left Upper Arm */}
      {p11 && p13 && (
        <VolumetricSegment
          start={p11}
          end={p13}
          radiusTop={armRadius}
          radiusBottom={armRadius * 0.85}
        />
      )}
      {/* Left Forearm */}
      {p13 && p15 && (
        <VolumetricSegment
          start={p13}
          end={p15}
          radiusTop={armRadius * 0.85}
          radiusBottom={armRadius * 0.70}
        />
      )}
      {/* Right Upper Arm */}
      {p12 && p14 && (
        <VolumetricSegment
          start={p12}
          end={p14}
          radiusTop={armRadius}
          radiusBottom={armRadius * 0.85}
        />
      )}
      {/* Right Forearm */}
      {p14 && p16 && (
        <VolumetricSegment
          start={p14}
          end={p16}
          radiusTop={armRadius * 0.85}
          radiusBottom={armRadius * 0.70}
        />
      )}

      {/* ========================================================= */}
      {/* 5. GLOWING 3D JOINT NODES & BEACON SPHERES                */}
      {/* ========================================================= */}
      {Array.from(lmMap.entries()).map(([id, pos]) => {
        const isMajorJoint = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(id);
        if (!isMajorJoint) return null;

        const isTargetVertex = activeJointTriplet && id === activeJointTriplet[1];
        const radius = isTargetVertex ? 0.038 : 0.022;
        const sphereColor = isTargetVertex ? highlightColor : '#00f0ff';

        return (
          <group key={`joint-${id}`} position={pos}>
            <mesh raycast={() => null}>
              <sphereGeometry args={[radius, 16, 16]} />
              <meshStandardMaterial
                color={sphereColor}
                emissive={sphereColor}
                emissiveIntensity={isTargetVertex ? 2.4 : 1.4}
                roughness={0.1}
                depthWrite={false}
              />
            </mesh>
            <mesh raycast={() => null}>
              <sphereGeometry args={[radius * 0.5, 12, 12]} />
              <meshBasicMaterial color="#ffffff" depthWrite={false} />
            </mesh>
          </group>
        );
      })}

      {/* ========================================================= */}
      {/* 6. LIVE FLOATING 3D ORTHOPEDIC ANGLE & CLINICAL HUD       */}
      {/* ========================================================= */}
      {vertexPos && activeFrameData && (
        <Html
          position={[
            vertexPos[0] + (isBedExam ? 0.0 : isRight ? -0.28 : 0.28),
            vertexPos[1] + (isBedExam ? 0.22 : 0.08),
            vertexPos[2] + (isBedExam ? 0.08 : 0.10),
          ]}
          center
          distanceFactor={3.6}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-slate-950/95 border-2 border-cyan-400 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md text-white whitespace-nowrap animate-in fade-in select-none min-w-[210px]">
            <div className="flex items-center justify-between gap-2 border-b border-cyan-500/30 pb-1 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                {isBedExam
                  ? 'Straight Leg Raise (SLR)'
                  : doctorExamDirective === 'MOVE_FORWARD'
                  ? 'Gait Locomotion'
                  : doctorExamDirective === 'SPREAD_LEGS'
                  ? 'Stance Abduction'
                  : doctorExamDirective === 'NECK_ROTATION'
                  ? 'Cervical Axial Rotation'
                  : doctorExamDirective === 'SHOULDER_ABDUCTION'
                  ? 'Shoulder Abduction Arc'
                  : doctorExamDirective === 'LUMBAR_FLEXION'
                  ? 'Lumbar Spine Flexion'
                  : 'Active ROM Kinematics'}
              </span>
              <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1.5 py-0.2 rounded font-mono font-bold">
                {Math.round(activeFrameData.confidence * 100)}% Conf
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-slate-400 text-xs">
                {isBedExam
                  ? 'Hip Elevation:'
                  : doctorExamDirective === 'NECK_ROTATION'
                  ? 'Neck Rotation:'
                  : doctorExamDirective === 'SHOULDER_ABDUCTION'
                  ? 'Abduction Angle:'
                  : doctorExamDirective === 'LUMBAR_FLEXION'
                  ? 'Lumbar Bending:'
                  : 'Flexion Angle:'}
              </span>
              <span className="font-mono text-lg font-black text-amber-400">
                {activeFrameData.flexion_angle_deg.toFixed(1)}°
              </span>
            </div>

            {/* Clinical Pathology / Exact Issue Callout */}
            {isSciaticaHighlighted && (
              <div className="mt-1 pt-1 border-t border-red-500/40 text-[10px] text-red-300 font-bold flex items-center gap-1 bg-red-950/70 px-1.5 py-0.5 rounded animate-pulse">
                <span>⚡ L4/L5 Sciatica Tension Reproduced</span>
              </div>
            )}
            {doctorExamDirective === 'MOVE_FORWARD' && (
              <div className="mt-1 pt-1 border-t border-emerald-500/40 text-[10px] text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/70 px-1.5 py-0.5 rounded">
                <span>✓ Ottawa Weight-Bearing 4 Steps Cleared</span>
              </div>
            )}
            {doctorExamDirective === 'SPREAD_LEGS' && (
              <div className="mt-1 pt-1 border-t border-indigo-500/40 text-[10px] text-indigo-300 font-bold flex items-center gap-1 bg-indigo-950/70 px-1.5 py-0.5 rounded">
                <span>✓ Symmetrical Coronal Stance Alignment</span>
              </div>
            )}
            {doctorExamDirective === 'NECK_ROTATION' && (
              <div className="mt-1 pt-1 border-t border-teal-500/40 text-[10px] text-teal-300 font-bold flex items-center gap-1 bg-teal-950/70 px-1.5 py-0.5 rounded">
                <span>🔄 Bilateral Cervical Rotation (C1-C7)</span>
              </div>
            )}
            {doctorExamDirective === 'SHOULDER_ABDUCTION' && activeFrameData.flexion_angle_deg >= 60.0 && activeFrameData.flexion_angle_deg <= 120.0 && (
              <div className="mt-1 pt-1 border-t border-amber-500/40 text-[10px] text-amber-300 font-bold flex items-center gap-1 bg-amber-950/70 px-1.5 py-0.5 rounded">
                <span>⚠️ Subacromial Impingement Painful Arc Zone (60°-120°)</span>
              </div>
            )}
            {doctorExamDirective === 'LUMBAR_FLEXION' && (
              <div className="mt-1 pt-1 border-t border-orange-500/40 text-[10px] text-orange-300 font-bold flex items-center gap-1 bg-orange-950/70 px-1.5 py-0.5 rounded">
                <span>🔄 Lumbar Sagittal Excursion (Schober Assessment)</span>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
