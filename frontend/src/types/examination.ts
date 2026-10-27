export type ExaminationStatus = 
  | 'ACTIVE' 
  | 'COMPLETED' 
  | 'ABORTED_RED_FLAG' 
  | 'URGENT_REFERRAL';

export type StepActionType = 
  | 'QUESTION_BOOLEAN' 
  | 'QUESTION_CHOICE' 
  | 'VIDEO_MOVEMENT' 
  | 'PALPATION_SCORE';

export interface StepInputConfig {
  guidance?: string;
  choices?: Array<{
    value: string;
    label: string;
    zone?: string;
    mesh_pin?: { x: number; y: number; z: number };
  }>;
  min_value?: number;
  max_value?: number;
  unit?: string;
  camera_guidance?: string;
  target_joint?: string;
  plane?: string;
  target_duration_sec?: number;
  sample_clip_available?: boolean;
  normal_ranges?: Record<string, number>;
  severity_brackets?: Array<{ range: [number, number]; label: string }>;
}

export interface ExaminationStep {
  id: string;
  step_id: string;
  step_index: number;
  phase: 'RED_FLAGS' | 'LOCALIZATION' | 'ACTIVE_ROM' | 'FUNCTIONAL_TEST' | 'PALPATION' | 'SYNTHESIS';
  title: string;
  operator_instruction: string;
  patient_question?: string | null;
  action_type: StepActionType;
  status: 'PENDING' | 'CURRENT' | 'COMPLETED' | 'SKIPPED';
  input_config?: StepInputConfig | null;
  completed_at?: string | null;
}

export interface Landmark3D {
  id: number;
  name?: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface BodyProportions {
  shoulder_width_m: number;
  hip_width_m: number;
  torso_height_m: number;
  right_thigh_length_m: number;
  right_shin_length_m: number;
  estimated_height_cm: number;
}

export interface PatientCalibration {
  status: string;
  is_calibrated: boolean;
  landmarks_3d: Landmark3D[];
  key_joint_positions: Record<string, [number, number, number]>;
  body_proportions: BodyProportions;
  annotated_image_url?: string | null;
  photo_url?: string | null;
}

export interface TimeSeriesSample {
  time_sec: number;
  flexion_angle_deg: number;
  confidence: number;
  hip?: [number, number] | null;
  knee?: [number, number] | null;
  ankle?: [number, number] | null;
  frame_landmarks_3d?: Landmark3D[] | null;
}

export interface BiomechanicalMeasurement {
  id: string;
  joint_name: string;
  movement_type: string;
  terminal_extension_deg?: number | null;
  maximum_flexion_deg?: number | null;
  range_of_motion_deg?: number | null;
  peak_angular_velocity_dps?: number | null;
  valgus_varus_deviation_deg?: number | null;
  tracking_confidence_mean: number;
  frames_total: number;
  frames_tracked: number;
  occlusion_detected: boolean;
  quality_rating: 'HIGH' | 'ACCEPTABLE' | 'POOR_OCCLUDED' | 'UNRELIABLE';
  timeseries_data?: TimeSeriesSample[] | null;
  quality_warnings?: string[] | null;
  calculated_at: string;
}

export interface ClinicalFinding {
  id: string;
  source_category: 'PATIENT_REPORTED' | 'CV_OBSERVATION' | 'CALCULATED_MEASUREMENT' | 'RED_FLAG_ALERT' | 'CLINICIAN_CONFIRMED';
  code: string;
  title: string;
  description: string;
  severity: 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  anatomical_site?: string | null;
  mesh_anchor?: { x: number; y: number; z: number } | null;
  is_provisional: boolean;
  created_at: string;
}

export interface Examination {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_age?: number | null;
  patient_gender?: string | null;
  selected_region: string;
  specific_zone?: string | null;
  affected_side: 'RIGHT' | 'LEFT' | 'BILATERAL';
  patient_orientation: string;
  status: ExaminationStatus;
  protocol_name: string;
  current_step_id: string;
  current_step_index: number;
  total_steps: number;
  urgent_referral: boolean;
  urgent_referral_reason?: string | null;
  referral_urgency?: string | null;
  clinical_summary?: string | null;
  disclaimer: string;
  created_at: string;
  updated_at: string;
  current_step?: ExaminationStep | null;
  steps: ExaminationStep[];
  findings: ClinicalFinding[];
  measurements: BiomechanicalMeasurement[];
  patient_calibration?: PatientCalibration | null;
}

export interface StructuredClinicalReport {
  examination_id: string;
  generated_at: string;
  patient_demographics: {
    patient_id: string;
    patient_name: string;
    patient_age?: number;
    patient_gender?: string;
    affected_side: string;
    selected_region: string;
    specific_zone?: string;
  };
  protocol_administered: string;
  examination_status: string;
  red_flag_evaluation: {
    red_flags_cleared: boolean;
    screened_conditions: string[];
    flagged_alerts: string[];
  };
  urgent_referral_alert?: {
    triggered: boolean;
    urgency: string;
    reason: string;
    directive: string;
  } | null;
  patient_reported_symptoms: ClinicalFinding[];
  computer_vision_observations: ClinicalFinding[];
  objective_measurements: BiomechanicalMeasurement[];
  provisional_clinical_findings: ClinicalFinding[];
  computer_vision_quality_summary: {
    overall_status: string;
    mean_tracking_confidence: string;
    frames_analyzed: number;
    valid_tracking_frames: number;
    occlusion_detected: boolean;
    quality_warnings: string[];
  };
  regulatory_disclaimer: string;
  clinician_attestation?: {
    clinician_name: string;
    clinician_license: string;
    diagnostic_impression: string;
    recommended_plan: string;
    signed_at: string;
  } | null;
}
