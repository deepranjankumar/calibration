from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# --- Examination Schemas ---

class ExaminationCreate(BaseModel):
    patient_id: Optional[str] = "PT-8821"
    patient_name: Optional[str] = "Anonymous Patient"
    patient_age: Optional[int] = 42
    patient_gender: Optional[str] = "Unspecified"
    selected_region: str = Field(default="RIGHT_KNEE", description="Selected body region: RIGHT_KNEE, LEFT_KNEE, LUMBAR_SPINE, etc.")
    affected_side: str = Field(default="RIGHT", description="RIGHT, LEFT, or BILATERAL")
    patient_orientation: str = Field(default="SAGITTAL_RIGHT", description="Viewing profile")

class StepInputConfig(BaseModel):
    choices: Optional[List[Dict[str, str]]] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    unit: Optional[str] = None
    camera_instruction: Optional[str] = None
    target_joint: Optional[str] = None
    required_duration_sec: Optional[int] = None
    sample_clip_available: Optional[bool] = False

class ExaminationStepSchema(BaseModel):
    id: str
    step_id: str
    step_index: int
    phase: str
    title: str
    operator_instruction: str
    patient_question: Optional[str] = None
    action_type: str
    status: str
    input_config: Optional[Dict[str, Any]] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BiomechanicalMeasurementSchema(BaseModel):
    id: str
    joint_name: str
    movement_type: str
    terminal_extension_deg: Optional[float] = None
    maximum_flexion_deg: Optional[float] = None
    range_of_motion_deg: Optional[float] = None
    peak_angular_velocity_dps: Optional[float] = None
    valgus_varus_deviation_deg: Optional[float] = None
    tracking_confidence_mean: float
    frames_total: int
    frames_tracked: int
    occlusion_detected: bool
    quality_rating: str
    timeseries_data: Optional[List[Dict[str, Any]]] = None
    quality_warnings: Optional[List[str]] = None
    calculated_at: datetime

    class Config:
        from_attributes = True

class ClinicalFindingSchema(BaseModel):
    id: str
    source_category: str # PATIENT_REPORTED, CV_OBSERVATION, CALCULATED_MEASUREMENT, RED_FLAG_ALERT, CLINICIAN_CONFIRMED
    code: str
    title: str
    description: str
    severity: str # NORMAL, MILD, MODERATE, SEVERE, CRITICAL
    anatomical_site: Optional[str] = None
    mesh_anchor: Optional[Dict[str, float]] = None
    is_provisional: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class StepSubmissionRequest(BaseModel):
    response_boolean: Optional[bool] = None
    response_choice: Optional[str] = None
    response_text: Optional[str] = None
    response_numeric: Optional[float] = None
    # For demo or synthetic tests:
    use_synthetic_kinematic_demo: Optional[bool] = False

class ExaminationDetailResponse(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    selected_region: str
    specific_zone: Optional[str] = None
    affected_side: str
    patient_orientation: str
    status: str
    protocol_name: str
    current_step_id: str
    current_step_index: int
    total_steps: int
    urgent_referral: bool
    urgent_referral_reason: Optional[str] = None
    referral_urgency: Optional[str] = None
    clinical_summary: Optional[str] = None
    disclaimer: str
    created_at: datetime
    updated_at: datetime
    
    current_step: Optional[ExaminationStepSchema] = None
    steps: List[ExaminationStepSchema] = []
    findings: List[ClinicalFindingSchema] = []
    measurements: List[BiomechanicalMeasurementSchema] = []

    class Config:
        from_attributes = True

# --- Structured Clinician Report ---

class ClinicianSignOffRequest(BaseModel):
    clinician_name: str
    clinician_license: str
    diagnostic_impression: str
    recommended_plan: str
    confirmed_findings: Optional[List[str]] = None

class StructuredClinicalReport(BaseModel):
    examination_id: str
    generated_at: datetime
    patient_demographics: Dict[str, Any]
    protocol_administered: str
    examination_status: str
    
    # Critical Safety & Triage
    red_flag_evaluation: Dict[str, Any]
    urgent_referral_alert: Optional[Dict[str, Any]] = None
    
    # Categorized Clinical Evidence
    patient_reported_symptoms: List[ClinicalFindingSchema]
    computer_vision_observations: List[ClinicalFindingSchema]
    objective_measurements: List[BiomechanicalMeasurementSchema]
    provisional_clinical_findings: List[ClinicalFindingSchema]
    
    # Quality & Artifact Metrics
    computer_vision_quality_summary: Dict[str, Any]
    
    # Disclaimers & Attestation
    regulatory_disclaimer: str
    clinician_attestation: Optional[Dict[str, Any]] = None
