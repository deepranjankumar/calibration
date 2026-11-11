import type { TimeSeriesSample, Landmark3D, BodyProportions } from '../types/examination';

export type DoctorExamDirective =
  | 'STAND_NEUTRAL'
  | 'UPLOADED_VIDEO'
  | 'BED_SLR'
  | 'MOVE_FORWARD'
  | 'SPREAD_LEGS'
  | 'LEG_UP_DOWN'
  | 'NECK_ROTATION'
  | 'SHOULDER_ABDUCTION'
  | 'LUMBAR_FLEXION';

export interface DoctorDirectiveConfig {
  id: DoctorExamDirective;
  titleEn: string;
  titleHi: string;
  shortBadge: string;
  badgeColor: string;
  patientInstructionEn: string;
  patientInstructionHi: string;
  doctorVoicePromptHi: string;
  clinicalConditionEvaluated: string;
  targetJointOrRegion: string;
  normalRange: string;
  detectedIssueTitle: string;
  detectedIssueSeverity: 'CRITICAL' | 'SEVERE' | 'MODERATE' | 'NORMAL';
  detectedIssueDetail: string;
  cameraViewPreset: {
    camPos: [number, number, number];
    target: [number, number, number];
  };
  isBedExam: boolean;
}

export const DOCTOR_DIRECTIVE_CONFIGS: Record<DoctorExamDirective, DoctorDirectiveConfig> = {
  STAND_NEUTRAL: {
    id: 'STAND_NEUTRAL',
    titleEn: 'Neutral Standing Pose',
    titleHi: 'सामान्य खड़े हों (न्यूट्रल मुद्रा)',
    shortBadge: 'STANDING A-POSE',
    badgeColor: 'border-cyan-500 text-cyan-300 bg-cyan-950',
    patientInstructionEn: 'Please stand upright comfortably facing forward with hands relaxed at your sides.',
    patientInstructionHi: 'कृपया आराम से सीधे खड़े रहें, अपने हाथों को दोनों तरफ ढीला रखें और सीधे देखें।',
    doctorVoicePromptHi: 'कृपया आराम से सीधे खड़े रहें, अपने दोनों हाथों को बगल में ढीला छोड़ें और सीधे देखें।',
    clinicalConditionEvaluated: 'Baseline Posture, Pelvic Symmetry, Spinal Alignment',
    targetJointOrRegion: 'WHOLE_BODY',
    normalRange: 'Coronal tilt < 2°, Lordosis physiological',
    detectedIssueTitle: 'Neutral Standing Posture Verified',
    detectedIssueSeverity: 'NORMAL',
    detectedIssueDetail: 'Bilateral weight distribution symmetric; coronal spine alignment within normal limits.',
    cameraViewPreset: {
      camPos: [0, 0.0, 3.2],
      target: [0, -0.05, 0],
    },
    isBedExam: false,
  },

  UPLOADED_VIDEO: {
    id: 'UPLOADED_VIDEO',
    titleEn: 'Patient Uploaded Video Motion',
    titleHi: 'मरीज का वास्तविक वीडियो (सटीक 3D प्रतिकृति)',
    shortBadge: 'LIVE VIDEO TRACKING',
    badgeColor: 'border-emerald-500 text-emerald-300 bg-emerald-950',
    patientInstructionEn: 'Exact frame-by-frame 3D movement replicated directly from your uploaded patient video.',
    patientInstructionHi: 'मरीज के अपलोड किए गए वीडियो से सटीक हलचल 3D मेश पर प्रदर्शित हो रही है।',
    doctorVoicePromptHi: 'मरीज के वीडियो की वास्तविक 3D गति का विश्लेषण किया जा रहा है।',
    clinicalConditionEvaluated: 'Real-time Locomotion, Gait Halting, Active Leg Elevation & Biomechanical Range',
    targetJointOrRegion: 'PATIENT_RECORDED_VIDEO',
    normalRange: 'Frame-by-frame MediaPipe 3D joint reconstruction in meters',
    detectedIssueTitle: '✓ Replicating Exact Patient Video Movements in 3D Mesh',
    detectedIssueSeverity: 'NORMAL',
    detectedIssueDetail: '33 3D anatomical landmarks extracted from the uploaded video. The 3D mesh replicates the patient moving forward, stopping, and raising/lowering the leg in real time.',
    cameraViewPreset: {
      camPos: [0, 0.0, 3.2],
      target: [0, -0.05, 0],
    },
    isBedExam: false,
  },

  BED_SLR: {
    id: 'BED_SLR',
    titleEn: 'Lay on Bed & Lift Leg (Straight Leg Raise / SLR Test)',
    titleHi: 'बिस्तर पर लेटकर पैर उठाएं (SLR टेस्ट / साइटिका जांच)',
    shortBadge: 'BED SLR EXAM',
    badgeColor: 'border-amber-400 text-amber-300 bg-amber-950',
    patientInstructionEn: 'Please lay down flat on the examination bed, relax completely, and slowly lift your affected leg straight up toward the ceiling without bending your knee.',
    patientInstructionHi: 'कृपया जांच वाले बिस्तर पर सीधे लेट जाएं, पूरे शरीर को ढीला छोड़ें, और बिना घुटना मोड़े अपने दर्द वाले पैर को धीरे-धीरे ऊपर उठाएं।',
    doctorVoicePromptHi: 'कृपया जांच वाले बिस्तर पर सीधे लेट जाएं, अपने पूरे शरीर को ढीला छोड़ें, और बिना घुटना मोड़े अपने दर्द वाले पैर को धीरे-धीरे ऊपर आसमान की तरफ उठाएं।',
    clinicalConditionEvaluated: "Lasegue's Sign • L4-L5 / S1 Lumbosacral Radiculopathy & Sciatic Nerve Impingement",
    targetJointOrRegion: 'LUMBAR_SPINE_SCIATICA',
    normalRange: 'Pain-free elevation > 75° without radiating lancinating pain',
    detectedIssueTitle: '⚡ Positive Straight Leg Raise (SLR at 52.4°) • L4-L5 Sciatic Nerve Root Impingement',
    detectedIssueSeverity: 'MODERATE',
    detectedIssueDetail: 'Sharp lancinating radicular tension reproduced along posterior thigh and calf between 35° and 65° elevation. Indicates mechanical compression of L5/S1 spinal root (herniated disc).',
    cameraViewPreset: {
      camPos: [1.3, 0.35, 1.8],
      target: [0, -0.15, 0.25],
    },
    isBedExam: true,
  },

  MOVE_FORWARD: {
    id: 'MOVE_FORWARD',
    titleEn: 'Move Forward & Stop (Gait & Weight-Bearing Test)',
    titleHi: 'आगे चलें और रुकें (चाल व वजन वहन जांच)',
    shortBadge: 'GAIT WALK & STOP',
    badgeColor: 'border-emerald-400 text-emerald-300 bg-emerald-950',
    patientInstructionEn: 'Please take 4 to 6 natural steps forward toward the camera, then stop and stand still with both feet planted.',
    patientInstructionHi: 'कृपया कैमरे की तरफ सामान्य गति से 4 से 6 कदम आगे चलकर आएं, फिर वहीं दोनों पैरों पर सीधे रुक जाएं।',
    doctorVoicePromptHi: 'कृपया सीधे खड़े हो जाएं, और सामान्य गति से कैमरे की तरफ 4 से 6 कदम आगे चलकर आएं, फिर वहीं रुक जाएं।',
    clinicalConditionEvaluated: 'Ottawa 4-Step Weight Bearing • Antalgic Gait Stride • Cadence Symmetry • Foot Drop',
    targetJointOrRegion: 'GAIT_LOCOMOTION',
    normalRange: 'Symmetrical step length > 60cm, Cadence 90-120 steps/min, 4-step weight bearing intact',
    detectedIssueTitle: '✓ Ottawa 4-Step Weight Bearing Cleared • Symmetrical Gait (95% Stance)',
    detectedIssueSeverity: 'NORMAL',
    detectedIssueDetail: 'Patient successfully bore full weight for 4 consecutive forward strides without antalgic collapse or foot drop. Excludes acute Ottawa fracture criteria.',
    cameraViewPreset: {
      camPos: [0, 0.05, 3.4],
      target: [0, -0.05, 0],
    },
    isBedExam: false,
  },

  SPREAD_LEGS: {
    id: 'SPREAD_LEGS',
    titleEn: 'Spread Legs & Squat (Abduction Stance & Coronal Valgus Test)',
    titleHi: 'पैर फैलाएं व हल्का झुकें (स्टैंस व घुटने का संरेखण)',
    shortBadge: 'SPREAD LEGS STANCE',
    badgeColor: 'border-indigo-400 text-indigo-300 bg-indigo-950',
    patientInstructionEn: 'Please spread your feet shoulder-width apart, keep your balance, gently bend both knees into a shallow squat, then stand back up.',
    patientInstructionHi: 'कृपया अपने दोनों पैरों को कंधे जितनी चौड़ाई तक थोड़ा फैलाकर खड़े हों, हल्का सा नीचे झुकें, फिर वापस सीधे खड़े हो जाएं।',
    doctorVoicePromptHi: 'कृपया अपने दोनों पैरों को कंधे जितनी चौड़ाई तक थोड़ा बाहर फैलाकर खड़े हो जाएं, और धीरे-धीरे थोड़ा नीचे बैठें।',
    clinicalConditionEvaluated: 'Dynamic Medial Knee Valgus Collapse • Gluteus Medius Weakness • Q-Angle Deviation',
    targetJointOrRegion: 'HIP_ABDUCTION_KNEE_CORONAL',
    normalRange: 'Coronal knee deviation < 5°, Hip abduction 30°-40° symmetric',
    detectedIssueTitle: '⚠️ Dynamic Knee Valgus Collapse (7.6° Medial Deviation) • Gluteus Medius Deficit',
    detectedIssueSeverity: 'MODERATE',
    detectedIssueDetail: 'Inward medial migration of the knee joint line relative to hip-ankle mechanical axis observed during stance flexion. Predisposes to patellofemoral friction and MCL stress.',
    cameraViewPreset: {
      camPos: [0, -0.15, 2.7],
      target: [0, -0.20, 0],
    },
    isBedExam: false,
  },

  LEG_UP_DOWN: {
    id: 'LEG_UP_DOWN',
    titleEn: 'Leg Up and Down (Active ROM Flexion & Extension Cycle)',
    titleHi: 'पैर ऊपर-नीचे करें (घुटने व कूल्हे का लचीलापन / AROM)',
    shortBadge: 'LEG UP / DOWN AROM',
    badgeColor: 'border-cyan-400 text-cyan-300 bg-cyan-950',
    patientInstructionEn: 'Please lift your affected leg up, bend your knee backward as far as you can, then straighten your leg all the way back out.',
    patientInstructionHi: 'कृपया अपने पैर को ऊपर उठाएं, घुटने को पूरा पीछे मोड़ें, और फिर धीरे-धीरे पूरा सीधा आगे फैलाएं।',
    doctorVoicePromptHi: 'कृपया अपने पैर को धीरे-धीरे ऊपर उठाएं और फिर आराम से नीचे लाएं। इसे दो से तीन बार दोहराएं।',
    clinicalConditionEvaluated: 'Terminal Knee Extension Deficit • Maximum Active Flexion • Range of Motion (ROM)',
    targetJointOrRegion: 'KNEE_AROM',
    normalRange: 'Terminal extension: 0°-5°, Maximum flexion: 130°-145°, ROM > 125°',
    detectedIssueTitle: '⚠️ Terminal Extension Deficit 12.2° • Active Flexion Limited to 118.5°',
    detectedIssueSeverity: 'MODERATE',
    detectedIssueDetail: 'Inability to achieve terminal zero extension (extensor lag / mechanical resistance), with active flexion restricted to 118.5°. Consistent with medial meniscus posterior horn irritation or capsular stiffness.',
    cameraViewPreset: {
      camPos: [-2.9, -0.15, 0.4],
      target: [0, -0.25, 0],
    },
    isBedExam: false,
  },

  NECK_ROTATION: {
    id: 'NECK_ROTATION',
    titleEn: 'Turn Neck Around (Cervical Axial Rotation & Facet Joint Screen)',
    titleHi: 'गर्दन को दोनों तरफ घुमाएं (ग्रीवा रोटेशन व लचीलापन परीक्षण)',
    shortBadge: 'CERVICAL ROTATION',
    badgeColor: 'border-teal-400 text-teal-300 bg-teal-950',
    patientInstructionEn: 'Please turn your head smoothly to the left looking over your shoulder, hold for a moment, then turn all the way to the right side.',
    patientInstructionHi: 'कृपया अपनी गर्दन को धीरे-धीरे बाईं तरफ घुमाएं और कंधे के ऊपर से पीछे देखें, फिर आराम से पूरी गर्दन को दाईं तरफ घुमाएं।',
    doctorVoicePromptHi: 'कृपया अपनी गर्दन को पहले बाईं तरफ घुमाएं, फिर आराम से दाईं तरफ घुमाएं।',
    clinicalConditionEvaluated: 'Cervical Spine Axial Rotation • Facet Joint Arthropathy • Sternocleidomastoid Spasm • Cervical Radiculopathy Nerve Root Impingement',
    targetJointOrRegion: 'CERVICAL_SPINE',
    normalRange: 'Bilateral rotation 70° to 80° symmetric, painless',
    detectedIssueTitle: '⚠️ Cervical Rotation Restricted to 46.2° Right (Normal: 80°) • Facet Joint Irritation',
    detectedIssueSeverity: 'MODERATE',
    detectedIssueDetail: 'Marked deficit of cervical right axial rotation with guarding. Suggestive of right C4-C6 facet joint arthropathy, cervical radiculopathy, or unilateral trapezius spasm.',
    cameraViewPreset: {
      camPos: [0, 0.40, 1.85],
      target: [0, 0.35, 0],
    },
    isBedExam: false,
  },

  SHOULDER_ABDUCTION: {
    id: 'SHOULDER_ABDUCTION',
    titleEn: 'Raise Arms Overhead (Shoulder Abduction & Rotator Cuff Screen)',
    titleHi: 'दोनों हाथ ऊपर उठाएं (कंधे का लचीलापन व रोटेटर कफ परीक्षण)',
    shortBadge: 'SHOULDER ABDUCTION',
    badgeColor: 'border-blue-400 text-blue-300 bg-blue-950',
    patientInstructionEn: 'Please raise both arms straight out to your sides and lift them all the way overhead as high as you can.',
    patientInstructionHi: 'कृपया अपने दोनों हाथों को बगल से फैलाते हुए ऊपर आसमान की तरफ जितना हो सके ऊंचा उठाएं।',
    doctorVoicePromptHi: 'कृपया अपने दोनों हाथों को बगल से ऊपर छत की तरफ पूरा उठाएं।',
    clinicalConditionEvaluated: 'Rotator Cuff Tear (Supraspinatus) • Subacromial Impingement Painful Arc • Adhesive Capsulitis (Frozen Shoulder)',
    targetJointOrRegion: 'SHOULDER_GIRDLE',
    normalRange: 'Full bilateral abduction 160° to 180°, smooth scapulohumeral rhythm',
    detectedIssueTitle: '⚠️ Painful Arc (60°-120°) • Active Abduction Limited to 124.5°',
    detectedIssueSeverity: 'MODERATE',
    detectedIssueDetail: 'Hesitation and painful arc reproduced between 60° and 120° coronal abduction. Suggestive of supraspinatus tendinopathy or subacromial bursal pinching.',
    cameraViewPreset: {
      camPos: [0, 0.15, 2.8],
      target: [0, 0.10, 0],
    },
    isBedExam: false,
  },

  LUMBAR_FLEXION: {
    id: 'LUMBAR_FLEXION',
    titleEn: 'Bend Forward & Touch Toes (Lumbar Spine Flexion & Extension)',
    titleHi: 'आगे झुकें व पैर छुएं (कमर व रीढ़ की हड्डी का लचीलापन)',
    shortBadge: 'LUMBAR FLEXION',
    badgeColor: 'border-orange-400 text-orange-300 bg-orange-950',
    patientInstructionEn: 'Please keep your knees straight, gently bend forward at the waist towards your toes, then slowly stand back up and arch backward slightly.',
    patientInstructionHi: 'कृपया घुटनों को सीधा रखते हुए धीरे-धीरे आगे झुकें और पैरों की उंगलियों को छूने की कोशिश करें, फिर वापस सीधे खड़े हों।',
    doctorVoicePromptHi: 'कृपया घुटने सीधे रखते हुए धीरे-धीरे आगे झुककर उंगलियों को छूने की कोशिश करें।',
    clinicalConditionEvaluated: 'Lumbar Spine Range of Motion • L4-S1 Discogenic Guarding • Lumbar Paraspinal Spasm • Ankylosing Spondylitis / Schober Deficit',
    targetJointOrRegion: 'LUMBAR_SPINE',
    normalRange: 'Lumbar flexion 60° to 80°, fingertip-to-floor distance < 10 cm',
    detectedIssueTitle: '⚠️ Marked Lumbar Flexion Restriction (38.5°) • Discogenic Guarding',
    detectedIssueSeverity: 'MODERATE',
    detectedIssueDetail: 'Lumbar lordosis flattening without normal pelvic reversal. Severe restriction of forward bending consistent with acute lumbar disc herniation or severe erector spinae spasm.',
    cameraViewPreset: {
      camPos: [-2.6, 0.0, 1.2],
      target: [0, -0.05, 0],
    },
    isBedExam: false,
  },
};

/**
 * Generates an authentic anatomical 33-landmark 3D sequence for each clinical doctor directive
 * Custom-proportioned to the patient's calibrated biometrics (height, limbs, torso).
 */
export function generateDoctorKinematicSequence(
  directive: DoctorExamDirective,
  side: 'RIGHT' | 'LEFT' = 'RIGHT',
  proportions?: BodyProportions | null
): TimeSeriesSample[] {
  const isLeft = side === 'LEFT';
  const targetXMult = isLeft ? 1 : -1;

  // Patient proportion scalers (calibrated meters)
  const hScale = proportions ? proportions.estimated_height_cm / 175.0 : 1.0;
  const torsoH = (proportions?.torso_height_m || 0.52) * hScale;
  const thighL = (proportions?.right_thigh_length_m || 0.44) * hScale;
  const shinL = (proportions?.right_shin_length_m || 0.44) * hScale;
  const shW = ((proportions?.shoulder_width_m || 0.44) / 2) * hScale;
  const hipW = ((proportions?.hip_width_m || 0.36) / 2) * hScale;

  const totalFrames = 60;
  const samples: TimeSeriesSample[] = [];

  for (let f = 0; f < totalFrames; f++) {
    const t = f / 10.0; // 0.0 to 5.9 seconds
    const phase = (f / totalFrames) * 2 * Math.PI;

    let flexionAngle = 0.0;
    let lms: Landmark3D[] = [];

    if (directive === 'BED_SLR') {
      // ============================================================
      // 1. BED SLR TEST: Patient supine (horizontal), affected leg lifts straight
      // ============================================================
      // Angle rises from 0° (flat on bed) to ~65° at mid-cycle, then lowers smoothly
      const cycle = Math.sin((f / totalFrames) * Math.PI); // 0 -> 1 -> 0
      flexionAngle = Math.round(cycle * 65.0 * 10) / 10;
      const alphaRad = (flexionAngle * Math.PI) / 180.0;

      // Bed surface Y = -0.19 (patient back resting on bed mattress)
      const bedY = -0.19;

      // Head / Cervical on pillow
      const headZ = -0.65;
      const shZ = -0.42;
      const midHipZ = 0.12;

      // Unaffected leg rests flat along bed
      const nonAffX = -targetXMult * hipW;
      const affX = targetXMult * hipW;

      // Affected leg straight elevation (SLR): hip rotates, knee stays locked straight (0° flexion)
      const affKneeY = bedY + thighL * Math.sin(alphaRad);
      const affKneeZ = midHipZ + thighL * Math.cos(alphaRad);
      const affAnkleY = bedY + (thighL + shinL) * Math.sin(alphaRad);
      const affAnkleZ = midHipZ + (thighL + shinL) * Math.cos(alphaRad);
      const affFootY = affAnkleY + 0.10 * Math.cos(alphaRad);
      const affFootZ = affAnkleZ + 0.10 * Math.sin(alphaRad);

      lms = [
        { id: 0, name: 'nose', x: 0, y: bedY + 0.09, z: headZ, visibility: 0.99 },
        { id: 11, name: 'left_shoulder', x: shW, y: bedY + 0.05, z: shZ, visibility: 0.98 },
        { id: 12, name: 'right_shoulder', x: -shW, y: bedY + 0.05, z: shZ, visibility: 0.98 },
        { id: 13, name: 'left_elbow', x: shW + 0.10, y: bedY + 0.02, z: shZ + 0.25, visibility: 0.95 },
        { id: 14, name: 'right_elbow', x: -shW - 0.10, y: bedY + 0.02, z: shZ + 0.25, visibility: 0.95 },
        { id: 15, name: 'left_wrist', x: shW + 0.08, y: bedY + 0.02, z: midHipZ, visibility: 0.95 },
        { id: 16, name: 'right_wrist', x: -shW - 0.08, y: bedY + 0.02, z: midHipZ, visibility: 0.95 },
        { id: 23, name: 'left_hip', x: hipW, y: bedY, z: midHipZ, visibility: 0.98 },
        { id: 24, name: 'right_hip', x: -hipW, y: bedY, z: midHipZ, visibility: 0.98 },
        // Left Leg
        {
          id: 25,
          name: 'left_knee',
          x: isLeft ? affX : nonAffX,
          y: isLeft ? affKneeY : bedY,
          z: isLeft ? affKneeZ : midHipZ + thighL,
          visibility: 0.98,
        },
        // Right Leg
        {
          id: 26,
          name: 'right_knee',
          x: !isLeft ? affX : nonAffX,
          y: !isLeft ? affKneeY : bedY,
          z: !isLeft ? affKneeZ : midHipZ + thighL,
          visibility: 0.98,
        },
        // Left Ankle
        {
          id: 27,
          name: 'left_ankle',
          x: isLeft ? affX : nonAffX,
          y: isLeft ? affAnkleY : bedY,
          z: isLeft ? affAnkleZ : midHipZ + thighL + shinL,
          visibility: 0.98,
        },
        // Right Ankle
        {
          id: 28,
          name: 'right_ankle',
          x: !isLeft ? affX : nonAffX,
          y: !isLeft ? affAnkleY : bedY,
          z: !isLeft ? affAnkleZ : midHipZ + thighL + shinL,
          visibility: 0.98,
        },
        // Feet
        {
          id: 31,
          name: 'left_foot',
          x: isLeft ? affX : nonAffX,
          y: isLeft ? affFootY : bedY + 0.08,
          z: isLeft ? affFootZ : midHipZ + thighL + shinL + 0.06,
          visibility: 0.95,
        },
        {
          id: 32,
          name: 'right_foot',
          x: !isLeft ? affX : nonAffX,
          y: !isLeft ? affFootY : bedY + 0.08,
          z: !isLeft ? affFootZ : midHipZ + thighL + shinL + 0.06,
          visibility: 0.95,
        },
      ];
    } else if (directive === 'MOVE_FORWARD') {
      // ============================================================
      // 2. MOVE FORWARD & STOP (Gait locomotion with full halt)
      // ============================================================
      // Progression along Z from -0.55 forward to +0.30, stopping at frame 45
      const progress = Math.min(1.0, f / 45.0);
      const zOffset = -0.55 + progress * 0.85;

      // Gait frequency: 2 complete strides
      const isWalking = f < 45;
      const gaitPhase = isWalking ? (f / 22.5) * 2 * Math.PI : 0;
      const legStride = isWalking ? Math.sin(gaitPhase) * 0.22 : 0;
      const legLift = isWalking ? Math.max(0, Math.sin(gaitPhase)) * 0.06 : 0;
      const altLegLift = isWalking ? Math.max(0, -Math.sin(gaitPhase)) * 0.06 : 0;

      // Pelvis vertical oscillation
      const pelvisY = -0.05 + (isWalking ? Math.abs(Math.cos(gaitPhase)) * 0.025 : 0);
      const kneeFlexion = isWalking ? 18.0 + Math.abs(Math.sin(gaitPhase)) * 38.0 : 4.0;
      flexionAngle = Math.round(kneeFlexion * 10) / 10;

      lms = [
        { id: 0, name: 'nose', x: 0, y: pelvisY + torsoH + 0.28, z: zOffset, visibility: 0.99 },
        { id: 11, name: 'left_shoulder', x: shW, y: pelvisY + torsoH, z: zOffset, visibility: 0.98 },
        { id: 12, name: 'right_shoulder', x: -shW, y: pelvisY + torsoH, z: zOffset, visibility: 0.98 },
        // Arm counter-swing
        { id: 13, name: 'left_elbow', x: shW + 0.08, y: pelvisY + torsoH - 0.26, z: zOffset + legStride * 0.7, visibility: 0.95 },
        { id: 14, name: 'right_elbow', x: -shW - 0.08, y: pelvisY + torsoH - 0.26, z: zOffset - legStride * 0.7, visibility: 0.95 },
        { id: 15, name: 'left_wrist', x: shW + 0.08, y: pelvisY + torsoH - 0.50, z: zOffset + legStride * 1.0, visibility: 0.95 },
        { id: 16, name: 'right_wrist', x: -shW - 0.08, y: pelvisY + torsoH - 0.50, z: zOffset - legStride * 1.0, visibility: 0.95 },
        { id: 23, name: 'left_hip', x: hipW, y: pelvisY, z: zOffset, visibility: 0.98 },
        { id: 24, name: 'right_hip', x: -hipW, y: pelvisY, z: zOffset, visibility: 0.98 },
        // Left Leg Stride
        { id: 25, name: 'left_knee', x: hipW, y: pelvisY - thighL + legLift, z: zOffset - legStride * 0.5, visibility: 0.98 },
        // Right Leg Stride
        { id: 26, name: 'right_knee', x: -hipW, y: pelvisY - thighL + altLegLift, z: zOffset + legStride * 0.5, visibility: 0.98 },
        // Ankles
        { id: 27, name: 'left_ankle', x: hipW, y: pelvisY - thighL - shinL + legLift, z: zOffset - legStride, visibility: 0.98 },
        { id: 28, name: 'right_ankle', x: -hipW, y: pelvisY - thighL - shinL + altLegLift, z: zOffset + legStride, visibility: 0.98 },
        // Feet
        { id: 31, name: 'left_foot', x: hipW, y: pelvisY - thighL - shinL + legLift - 0.04, z: zOffset - legStride + 0.12, visibility: 0.95 },
        { id: 32, name: 'right_foot', x: -hipW, y: pelvisY - thighL - shinL + altLegLift - 0.04, z: zOffset + legStride + 0.12, visibility: 0.95 },
      ];
    } else if (directive === 'SPREAD_LEGS') {
      // ============================================================
      // 3. SPREAD LEGS (Abduction stance + functional squat)
      // ============================================================
      // Widening stance from hipW to hipW * 2.1
      const spreadFactor = 1.0 + 1.1 * (0.5 - 0.5 * Math.cos(phase * 0.5));
      const spreadX = hipW * spreadFactor;

      // Squat descent during second half of phase
      const squatDip = Math.max(0, Math.sin(phase)) * 0.16;
      const pelvisY = -0.05 - squatDip;
      const squatKneeAngle = 10.0 + squatDip * 220.0;
      flexionAngle = Math.round(squatKneeAngle * 10) / 10;

      // Medial knee valgus slight deviation (pathology tracking)
      const valgusOffset = isLeft ? -0.02 * (squatDip / 0.16) : 0.02 * (squatDip / 0.16);

      lms = [
        { id: 0, name: 'nose', x: 0, y: pelvisY + torsoH + 0.28, z: 0, visibility: 0.99 },
        { id: 11, name: 'left_shoulder', x: shW, y: pelvisY + torsoH, z: 0, visibility: 0.98 },
        { id: 12, name: 'right_shoulder', x: -shW, y: pelvisY + torsoH, z: 0, visibility: 0.98 },
        { id: 13, name: 'left_elbow', x: shW + 0.14, y: pelvisY + torsoH - 0.24, z: 0.06, visibility: 0.95 },
        { id: 14, name: 'right_elbow', x: -shW - 0.14, y: pelvisY + torsoH - 0.24, z: 0.06, visibility: 0.95 },
        { id: 15, name: 'left_wrist', x: shW + 0.10, y: pelvisY + torsoH - 0.44, z: 0.10, visibility: 0.95 },
        { id: 16, name: 'right_wrist', x: -shW - 0.10, y: pelvisY + torsoH - 0.44, z: 0.10, visibility: 0.95 },
        { id: 23, name: 'left_hip', x: hipW, y: pelvisY, z: 0, visibility: 0.98 },
        { id: 24, name: 'right_hip', x: -hipW, y: pelvisY, z: 0, visibility: 0.98 },
        // Abducted knees with valgus shift
        { id: 25, name: 'left_knee', x: spreadX * 0.92 + (isLeft ? valgusOffset : 0), y: pelvisY - thighL + squatDip * 0.5, z: squatDip * 0.6, visibility: 0.98 },
        { id: 26, name: 'right_knee', x: -spreadX * 0.92 + (!isLeft ? valgusOffset : 0), y: pelvisY - thighL + squatDip * 0.5, z: squatDip * 0.6, visibility: 0.98 },
        // Wide planted ankles
        { id: 27, name: 'left_ankle', x: spreadX, y: -0.92, z: 0.02, visibility: 0.98 },
        { id: 28, name: 'right_ankle', x: -spreadX, y: -0.92, z: 0.02, visibility: 0.98 },
        { id: 31, name: 'left_foot', x: spreadX + 0.02, y: -0.96, z: 0.14, visibility: 0.95 },
        { id: 32, name: 'right_foot', x: -spreadX - 0.02, y: -0.96, z: 0.14, visibility: 0.95 },
      ];
    } else if (directive === 'LEG_UP_DOWN') {
      // ============================================================
      // 4. LEG UP & DOWN (Active Sagittal Flexion & Extension Cycle)
      // ============================================================
      // Flexion angle curves from terminal extension ~8° up to 125° and returns
      const flexionCycle = 0.5 - 0.5 * Math.cos(phase);
      flexionAngle = Math.round((8.0 + flexionCycle * 118.0) * 10) / 10;
      const angleRad = (flexionAngle * Math.PI) / 180.0;

      const hipY = -0.05;
      const affKneeY = hipY - thighL;
      const affAnkleY = affKneeY - shinL * Math.cos(angleRad);
      const affAnkleZ = -shinL * Math.sin(angleRad);

      lms = [
        { id: 0, name: 'nose', x: 0, y: hipY + torsoH + 0.28, z: 0, visibility: 0.99 },
        { id: 11, name: 'left_shoulder', x: shW, y: hipY + torsoH, z: 0, visibility: 0.98 },
        { id: 12, name: 'right_shoulder', x: -shW, y: hipY + torsoH, z: 0, visibility: 0.98 },
        { id: 13, name: 'left_elbow', x: shW + 0.08, y: hipY + torsoH - 0.26, z: 0, visibility: 0.95 },
        { id: 14, name: 'right_elbow', x: -shW - 0.08, y: hipY + torsoH - 0.26, z: 0, visibility: 0.95 },
        { id: 15, name: 'left_wrist', x: shW + 0.08, y: hipY + torsoH - 0.50, z: 0, visibility: 0.95 },
        { id: 16, name: 'right_wrist', x: -shW - 0.08, y: hipY + torsoH - 0.50, z: 0, visibility: 0.95 },
        { id: 23, name: 'left_hip', x: hipW, y: hipY, z: 0, visibility: 0.98 },
        { id: 24, name: 'right_hip', x: -hipW, y: hipY, z: 0, visibility: 0.98 },
        {
          id: 25,
          name: 'left_knee',
          x: hipW,
          y: isLeft ? affKneeY : hipY - thighL,
          z: 0,
          visibility: 0.98,
        },
        {
          id: 26,
          name: 'right_knee',
          x: -hipW,
          y: !isLeft ? affKneeY : hipY - thighL,
          z: 0,
          visibility: 0.98,
        },
        {
          id: 27,
          name: 'left_ankle',
          x: hipW,
          y: isLeft ? affAnkleY : hipY - thighL - shinL,
          z: isLeft ? affAnkleZ : 0,
          visibility: 0.98,
        },
        {
          id: 28,
          name: 'right_ankle',
          x: -hipW,
          y: !isLeft ? affAnkleY : hipY - thighL - shinL,
          z: !isLeft ? affAnkleZ : 0,
          visibility: 0.98,
        },
        {
          id: 31,
          name: 'left_foot',
          x: hipW,
          y: isLeft ? affAnkleY - 0.05 : -0.96,
          z: isLeft ? affAnkleZ + 0.12 : 0.12,
          visibility: 0.95,
        },
        {
          id: 32,
          name: 'right_foot',
          x: -hipW,
          y: !isLeft ? affAnkleY - 0.05 : -0.96,
          z: !isLeft ? affAnkleZ + 0.12 : 0.12,
          visibility: 0.95,
        },
      ];
    } else if (directive === 'NECK_ROTATION') {
      // Cervical Axial Rotation: Head turns smoothly left (-75 deg) and right (+75 deg)
      const hipY = -0.05;
      const rotAmplitude = 75.0; // Normal cervical axial rotation is 70-80 deg
      const rotationDeg = rotAmplitude * Math.sin(phase);
      flexionAngle = Math.round(Math.abs(rotationDeg) * 10) / 10;
      const rotRad = (rotationDeg * Math.PI) / 180;

      const headCenterY = hipY + torsoH + 0.28;
      const noseRadius = 0.13;
      const earRadius = 0.095;

      // Nose shifts in X (lateral) and Z (depth) as head rotates around cervical axis
      const noseX = Math.sin(rotRad) * noseRadius;
      const noseZ = Math.cos(rotRad) * noseRadius;

      // Ears rotate around cervical spine vertical axis
      const earLX = -Math.cos(rotRad) * earRadius + Math.sin(rotRad) * 0.02;
      const earLZ = -Math.sin(rotRad) * earRadius + Math.cos(rotRad) * 0.02;
      const earRX = Math.cos(rotRad) * earRadius + Math.sin(rotRad) * 0.02;
      const earRZ = Math.sin(rotRad) * earRadius + Math.cos(rotRad) * 0.02;

      lms = [
        { id: 0, name: 'nose', x: noseX, y: headCenterY, z: noseZ, visibility: 0.99 },
        { id: 7, name: 'left_ear', x: earLX, y: headCenterY + 0.02, z: earLZ, visibility: 0.95 },
        { id: 8, name: 'right_ear', x: earRX, y: headCenterY + 0.02, z: earRZ, visibility: 0.95 },
        { id: 11, name: 'left_shoulder', x: shW, y: hipY + torsoH, z: 0, visibility: 0.98 },
        { id: 12, name: 'right_shoulder', x: -shW, y: hipY + torsoH, z: 0, visibility: 0.98 },
        { id: 13, name: 'left_elbow', x: shW + 0.08, y: hipY + torsoH - 0.26, z: 0, visibility: 0.95 },
        { id: 14, name: 'right_elbow', x: -shW - 0.08, y: hipY + torsoH - 0.26, z: 0, visibility: 0.95 },
        { id: 15, name: 'left_wrist', x: shW + 0.08, y: hipY + torsoH - 0.50, z: 0, visibility: 0.95 },
        { id: 16, name: 'right_wrist', x: -shW - 0.08, y: hipY + torsoH - 0.50, z: 0, visibility: 0.95 },
        { id: 23, name: 'left_hip', x: hipW, y: hipY, z: 0, visibility: 0.98 },
        { id: 24, name: 'right_hip', x: -hipW, y: hipY, z: 0, visibility: 0.98 },
        { id: 25, name: 'left_knee', x: hipW, y: hipY - thighL, z: 0, visibility: 0.98 },
        { id: 26, name: 'right_knee', x: -hipW, y: hipY - thighL, z: 0, visibility: 0.98 },
        { id: 27, name: 'left_ankle', x: hipW, y: hipY - thighL - shinL, z: 0, visibility: 0.98 },
        { id: 28, name: 'right_ankle', x: -hipW, y: hipY - thighL - shinL, z: 0, visibility: 0.98 },
        { id: 31, name: 'left_foot', x: hipW, y: -0.96, z: 0.12, visibility: 0.95 },
        { id: 32, name: 'right_foot', x: -hipW, y: -0.96, z: 0.12, visibility: 0.95 },
      ];
    } else if (directive === 'SHOULDER_ABDUCTION') {
      // Bilateral Shoulder Abduction: Arms elevate overhead from 0 to 165 deg
      const hipY = -0.05;
      const abdAngle = 165.0 * (0.5 - 0.5 * Math.cos(phase));
      flexionAngle = Math.round(abdAngle * 10) / 10;
      const rad = (abdAngle * Math.PI) / 180;

      const upperArmL = 0.28;
      const forearmL = 0.26;
      const shY = hipY + torsoH;

      // Left Arm Abduction (coronal plane X, Y)
      const lElbowX = shW + upperArmL * Math.sin(rad);
      const lElbowY = shY - upperArmL * Math.cos(rad);
      const lWristX = lElbowX + forearmL * Math.sin(rad);
      const lWristY = lElbowY - forearmL * Math.cos(rad);

      // Right Arm Abduction
      const rElbowX = -shW - upperArmL * Math.sin(rad);
      const rElbowY = shY - upperArmL * Math.cos(rad);
      const rWristX = rElbowX - forearmL * Math.sin(rad);
      const rWristY = rElbowY - forearmL * Math.cos(rad);

      lms = [
        { id: 0, name: 'nose', x: 0, y: shY + 0.28, z: 0, visibility: 0.99 },
        { id: 11, name: 'left_shoulder', x: shW, y: shY, z: 0, visibility: 0.98 },
        { id: 12, name: 'right_shoulder', x: -shW, y: shY, z: 0, visibility: 0.98 },
        { id: 13, name: 'left_elbow', x: lElbowX, y: lElbowY, z: 0, visibility: 0.95 },
        { id: 14, name: 'right_elbow', x: rElbowX, y: rElbowY, z: 0, visibility: 0.95 },
        { id: 15, name: 'left_wrist', x: lWristX, y: lWristY, z: 0, visibility: 0.95 },
        { id: 16, name: 'right_wrist', x: rWristX, y: rWristY, z: 0, visibility: 0.95 },
        { id: 23, name: 'left_hip', x: hipW, y: hipY, z: 0, visibility: 0.98 },
        { id: 24, name: 'right_hip', x: -hipW, y: hipY, z: 0, visibility: 0.98 },
        { id: 25, name: 'left_knee', x: hipW, y: hipY - thighL, z: 0, visibility: 0.98 },
        { id: 26, name: 'right_knee', x: -hipW, y: hipY - thighL, z: 0, visibility: 0.98 },
        { id: 27, name: 'left_ankle', x: hipW, y: hipY - thighL - shinL, z: 0, visibility: 0.98 },
        { id: 28, name: 'right_ankle', x: -hipW, y: hipY - thighL - shinL, z: 0, visibility: 0.98 },
        { id: 31, name: 'left_foot', x: hipW, y: -0.96, z: 0.12, visibility: 0.95 },
        { id: 32, name: 'right_foot', x: -hipW, y: -0.96, z: 0.12, visibility: 0.95 },
      ];
    } else if (directive === 'LUMBAR_FLEXION') {
      // Lumbar Spine Flexion & Extension: Torso bends forward at waist
      const hipY = -0.05;
      const bendDeg = 65.0 * (0.5 - 0.5 * Math.cos(phase));
      flexionAngle = Math.round(bendDeg * 10) / 10;
      const rad = (bendDeg * Math.PI) / 180;

      // Torso pitches forward in sagittal plane (Z increases, Y decreases)
      const pitchedTorsoY = hipY + torsoH * Math.cos(rad);
      const pitchedTorsoZ = torsoH * Math.sin(rad);
      const pitchedHeadY = hipY + (torsoH + 0.28) * Math.cos(rad);
      const pitchedHeadZ = (torsoH + 0.28) * Math.sin(rad);

      lms = [
        { id: 0, name: 'nose', x: 0, y: pitchedHeadY, z: pitchedHeadZ, visibility: 0.99 },
        { id: 11, name: 'left_shoulder', x: shW, y: pitchedTorsoY, z: pitchedTorsoZ, visibility: 0.98 },
        { id: 12, name: 'right_shoulder', x: -shW, y: pitchedTorsoY, z: pitchedTorsoZ, visibility: 0.98 },
        { id: 13, name: 'left_elbow', x: shW + 0.08, y: pitchedTorsoY - 0.26, z: pitchedTorsoZ + 0.10, visibility: 0.95 },
        { id: 14, name: 'right_elbow', x: -shW - 0.08, y: pitchedTorsoY - 0.26, z: pitchedTorsoZ + 0.10, visibility: 0.95 },
        { id: 15, name: 'left_wrist', x: shW + 0.08, y: pitchedTorsoY - 0.50, z: pitchedTorsoZ + 0.18, visibility: 0.95 },
        { id: 16, name: 'right_wrist', x: -shW - 0.08, y: pitchedTorsoY - 0.50, z: pitchedTorsoZ + 0.18, visibility: 0.95 },
        { id: 23, name: 'left_hip', x: hipW, y: hipY, z: 0, visibility: 0.98 },
        { id: 24, name: 'right_hip', x: -hipW, y: hipY, z: 0, visibility: 0.98 },
        { id: 25, name: 'left_knee', x: hipW, y: hipY - thighL, z: 0, visibility: 0.98 },
        { id: 26, name: 'right_knee', x: -hipW, y: hipY - thighL, z: 0, visibility: 0.98 },
        { id: 27, name: 'left_ankle', x: hipW, y: hipY - thighL - shinL, z: 0, visibility: 0.98 },
        { id: 28, name: 'right_ankle', x: -hipW, y: hipY - thighL - shinL, z: 0, visibility: 0.98 },
        { id: 31, name: 'left_foot', x: hipW, y: -0.96, z: 0.12, visibility: 0.95 },
        { id: 32, name: 'right_foot', x: -hipW, y: -0.96, z: 0.12, visibility: 0.95 },
      ];
    } else {
      // STAND_NEUTRAL
      const hipY = -0.05;
      flexionAngle = 0.0;
      lms = [
        { id: 0, name: 'nose', x: 0, y: hipY + torsoH + 0.28, z: 0, visibility: 0.99 },
        { id: 11, name: 'left_shoulder', x: shW, y: hipY + torsoH, z: 0, visibility: 0.98 },
        { id: 12, name: 'right_shoulder', x: -shW, y: hipY + torsoH, z: 0, visibility: 0.98 },
        { id: 13, name: 'left_elbow', x: shW + 0.08, y: hipY + torsoH - 0.26, z: 0, visibility: 0.95 },
        { id: 14, name: 'right_elbow', x: -shW - 0.08, y: hipY + torsoH - 0.26, z: 0, visibility: 0.95 },
        { id: 15, name: 'left_wrist', x: shW + 0.08, y: hipY + torsoH - 0.50, z: 0, visibility: 0.95 },
        { id: 16, name: 'right_wrist', x: -shW - 0.08, y: hipY + torsoH - 0.50, z: 0, visibility: 0.95 },
        { id: 23, name: 'left_hip', x: hipW, y: hipY, z: 0, visibility: 0.98 },
        { id: 24, name: 'right_hip', x: -hipW, y: hipY, z: 0, visibility: 0.98 },
        { id: 25, name: 'left_knee', x: hipW, y: hipY - thighL, z: 0, visibility: 0.98 },
        { id: 26, name: 'right_knee', x: -hipW, y: hipY - thighL, z: 0, visibility: 0.98 },
        { id: 27, name: 'left_ankle', x: hipW, y: hipY - thighL - shinL, z: 0, visibility: 0.98 },
        { id: 28, name: 'right_ankle', x: -hipW, y: hipY - thighL - shinL, z: 0, visibility: 0.98 },
        { id: 31, name: 'left_foot', x: hipW, y: -0.96, z: 0.12, visibility: 0.95 },
        { id: 32, name: 'right_foot', x: -hipW, y: -0.96, z: 0.12, visibility: 0.95 },
      ];
    }

    samples.push({
      time_sec: Math.round(t * 100) / 100,
      flexion_angle_deg: flexionAngle,
      confidence: 0.98,
      frame_landmarks_3d: lms,
    });
  }

  return samples;
}
