import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Examination(Base):
    __tablename__ = "examinations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(64), nullable=False, default="PT-ANON")
    patient_name = Column(String(128), nullable=True, default="Anonymous Patient")
    patient_age = Column(Integer, nullable=True, default=45)
    patient_gender = Column(String(32), nullable=True, default="Unspecified")
    
    # Patient-specific 3D Mesh calibration (from photo)
    patient_calibration = Column(JSON, nullable=True)
    
    # Arbitrary 3D Point Selection & Clinical Intelligence
    selected_point = Column(JSON, nullable=True) # {x: float, y: float, z: float}
    point_analysis = Column(JSON, nullable=True) # Comprehensive anatomical structures & clinical decisions
    custom_prescription = Column(JSON, nullable=True) # Clinician-authored/edited medical & exercise prescription
    
    # Anatomical region selected on 3D wireframe mesh
    selected_region = Column(String(64), nullable=False, default="RIGHT_KNEE")
    specific_zone = Column(String(64), nullable=True) # e.g. "ANTERIOR_PATELLA", "MEDIAL_JOINT_LINE"
    affected_side = Column(String(32), nullable=False, default="RIGHT") # "RIGHT", "LEFT", "BILATERAL"
    patient_orientation = Column(String(64), nullable=False, default="SAGITTAL_RIGHT")
    
    # State Machine Status
    status = Column(String(32), nullable=False, default="ACTIVE") 
    # ACTIVE, COMPLETED, ABORTED_RED_FLAG, URGENT_REFERRAL
    
    protocol_name = Column(String(128), nullable=False, default="Knee Pain Biomechanical Examination Protocol")
    current_step_id = Column(String(64), nullable=False, default="RED_FLAG_TRAUMA")
    current_step_index = Column(Integer, nullable=False, default=1)
    total_steps = Column(Integer, nullable=False, default=8)
    
    # Safety & Referral Rules
    urgent_referral = Column(Boolean, default=False)
    urgent_referral_reason = Column(Text, nullable=True)
    referral_urgency = Column(String(32), nullable=True) # "EMERGENCY_IMMEDIATE", "URGENT_24H", "ROUTINE_CLINIC"
    
    # Structured Clinical Assessment
    clinical_summary = Column(Text, nullable=True)
    disclaimer = Column(
        Text, 
        default="NOTICE: This physical examination summary provides objective computer vision kinematic metrics and structured protocol responses for clinical assistance. It is NOT an autonomous medical diagnosis or prescription. Final diagnosis must be confirmed by a licensed clinician."
    )
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    steps = relationship("ExaminationStepRecord", back_populates="examination", cascade="all, delete-orphan", order_by="ExaminationStepRecord.step_index")
    findings = relationship("ClinicalFinding", back_populates="examination", cascade="all, delete-orphan")
    measurements = relationship("BiomechanicalMeasurement", back_populates="examination", cascade="all, delete-orphan")


class ExaminationStepRecord(Base):
    __tablename__ = "examination_steps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    examination_id = Column(String(36), ForeignKey("examinations.id"), nullable=False)
    step_id = Column(String(64), nullable=False)
    step_index = Column(Integer, nullable=False)
    phase = Column(String(64), nullable=False) # RED_FLAGS, LOCALIZATION, ACTIVE_ROM, FUNCTIONAL_TEST, PALPATION, SYNTHESIS
    title = Column(String(128), nullable=False)
    
    # Clear separation of roles
    operator_instruction = Column(Text, nullable=False)
    patient_question = Column(Text, nullable=True)
    patient_question_hi = Column(Text, nullable=True)
    action_type = Column(String(64), nullable=False) # QUESTION_BOOLEAN, QUESTION_CHOICE, VIDEO_MOVEMENT, PALPATION_SCORE
    input_config = Column(JSON, nullable=True) # Options, guidance, camera angle requirements
    
    status = Column(String(32), default="PENDING") # PENDING, CURRENT, COMPLETED, SKIPPED
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    examination = relationship("Examination", back_populates="steps")
    submission = relationship("StepSubmission", back_populates="step", uselist=False, cascade="all, delete-orphan")


class StepSubmission(Base):
    __tablename__ = "step_submissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    step_id = Column(String(36), ForeignKey("examination_steps.id"), nullable=False)
    examination_id = Column(String(36), nullable=False)
    
    # Operator / Patient responses
    response_boolean = Column(Boolean, nullable=True)
    response_choice = Column(String(128), nullable=True)
    response_text = Column(Text, nullable=True)
    response_numeric = Column(Float, nullable=True)
    
    # Video & Media persistence
    video_filename = Column(String(256), nullable=True)
    annotated_video_filename = Column(String(256), nullable=True)
    thumbnail_filename = Column(String(256), nullable=True)
    
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    step = relationship("ExaminationStepRecord", back_populates="submission")
    measurement = relationship("BiomechanicalMeasurement", back_populates="submission", uselist=False, cascade="all, delete-orphan")


class BiomechanicalMeasurement(Base):
    __tablename__ = "biomechanical_measurements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    examination_id = Column(String(36), ForeignKey("examinations.id"), nullable=False)
    submission_id = Column(String(36), ForeignKey("step_submissions.id"), nullable=True)
    
    joint_name = Column(String(64), nullable=False, default="RIGHT_KNEE")
    movement_type = Column(String(64), nullable=False, default="FLEXION_EXTENSION")
    
    # Calculated Kinematic Measurements
    terminal_extension_deg = Column(Float, nullable=True) # ~0 deg is normal, >5 deg is extension lag/deficit
    maximum_flexion_deg = Column(Float, nullable=True)   # normal active knee flexion is 130-145 deg
    range_of_motion_deg = Column(Float, nullable=True)   # max - min
    peak_angular_velocity_dps = Column(Float, nullable=True) # degrees per second
    valgus_varus_deviation_deg = Column(Float, nullable=True) # frontal plane deviation during squat
    
    # Quality & Reliability Metrics
    tracking_confidence_mean = Column(Float, nullable=False, default=0.0)
    frames_total = Column(Integer, default=0)
    frames_tracked = Column(Integer, default=0)
    occlusion_detected = Column(Boolean, default=False)
    quality_rating = Column(String(32), default="ACCEPTABLE") # HIGH, ACCEPTABLE, POOR_OCCLUDED, UNRELIABLE
    
    # Trajectory & Landmark Data for 3D Mesh Overlay
    timeseries_data = Column(JSON, nullable=True) # [{t: float, angle: float, hip: [x,y,z], knee: [x,y,z], ankle: [x,y,z], conf: float}]
    quality_warnings = Column(JSON, nullable=True) # ["Partial occlusion between 1.2s-1.8s", "Non-optimal sagittal angle"]
    
    calculated_at = Column(DateTime, default=datetime.utcnow)
    
    examination = relationship("Examination", back_populates="measurements")
    submission = relationship("StepSubmission", back_populates="measurement")


class ClinicalFinding(Base):
    __tablename__ = "clinical_findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    examination_id = Column(String(36), ForeignKey("examinations.id"), nullable=False)
    
    # Distinct clinical sources as required:
    # 1. PATIENT_REPORTED (symptoms, pain location, onset)
    # 2. CV_OBSERVATION (visual cues, movement rhythm, antalgic hesitation)
    # 3. CALCULATED_MEASUREMENT (joint angles, ROM deficits, kinematic metrics)
    # 4. RED_FLAG_ALERT (Ottawa fracture rule, acute neurovascular, septic sign)
    # 5. CLINICIAN_CONFIRMED (confirmed or overridden during review)
    source_category = Column(String(64), nullable=False)
    
    code = Column(String(64), nullable=False)
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(32), nullable=False, default="NORMAL") # NORMAL, MILD, MODERATE, SEVERE, CRITICAL
    
    # Visual Mesh Coordinates for 3D Pinning
    anatomical_site = Column(String(64), nullable=True) # "RIGHT_KNEE_MEDIAL", "RIGHT_KNEE_PATELLA", etc.
    mesh_anchor = Column(JSON, nullable=True) # {x: float, y: float, z: float}
    
    is_provisional = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    examination = relationship("Examination", back_populates="findings")
