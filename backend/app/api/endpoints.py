import os
import uuid
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from pathlib import Path

from app.database import get_db
from app.schemas.examination import (
    ExaminationCreate,
    ExaminationDetailResponse,
    ExaminationStepSchema,
    StepSubmissionRequest,
    StructuredClinicalReport,
    ClinicianSignOffRequest,
    PatientCalibrationResponse
)
from app.services.engine import ExaminationWorkflowEngine
from app.services.report_generator import build_structured_report
from app.protocols.knee_protocol import KNEE_EXAMINATION_PROTOCOL
from app.vision.pose_tracker import pose_analyzer
from app.config import settings

router = APIRouter(prefix="/examinations", tags=["examinations"])

def _format_exam_response(exam) -> dict:
    current_step_obj = next((s for s in exam.steps if s.step_id == exam.current_step_id), None)
    return {
        "id": exam.id,
        "patient_id": exam.patient_id,
        "patient_name": exam.patient_name,
        "patient_age": exam.patient_age,
        "patient_gender": exam.patient_gender,
        "selected_region": exam.selected_region,
        "specific_zone": exam.specific_zone,
        "affected_side": exam.affected_side,
        "patient_orientation": exam.patient_orientation,
        "patient_calibration": getattr(exam, "patient_calibration", None),
        "status": exam.status,
        "protocol_name": exam.protocol_name,
        "current_step_id": exam.current_step_id,
        "current_step_index": exam.current_step_index,
        "total_steps": exam.total_steps,
        "urgent_referral": exam.urgent_referral,
        "urgent_referral_reason": exam.urgent_referral_reason,
        "referral_urgency": exam.referral_urgency,
        "clinical_summary": exam.clinical_summary,
        "disclaimer": exam.disclaimer,
        "created_at": exam.created_at,
        "updated_at": exam.updated_at,
        "current_step": ExaminationStepSchema.from_orm(current_step_obj) if current_step_obj else None,
        "steps": [ExaminationStepSchema.from_orm(s) for s in exam.steps],
        "findings": exam.findings,
        "measurements": exam.measurements
    }

@router.post("/calibrate-patient-mesh", response_model=PatientCalibrationResponse)
async def calibrate_patient_mesh(
    photo: Optional[UploadFile] = File(None),
    is_demo: Optional[bool] = Form(False)
):
    """
    Step 0 of Workflow: Analyzes patient photo via MediaPipe Pose 3D,
    extracts exact body dimensions, skeletal proportions, and 3D landmarks,
    and returns the calibration model to render the patient-specific 3D body mesh.
    """
    image_path = None
    annotated_filename = None
    annotated_path = None

    if photo and photo.filename:
        ext = Path(photo.filename).suffix or ".jpg"
        saved_filename = f"patient_photo_{uuid.uuid4().hex[:8]}{ext}"
        saved_path = settings.UPLOAD_DIR / saved_filename
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        image_path = str(saved_path)

        annotated_filename = f"calib_{uuid.uuid4().hex[:8]}.jpg"
        annotated_path = str(settings.STATIC_DIR / annotated_filename)

    calibration_result = pose_analyzer.calibrate_patient_from_image(
        image_path=image_path,
        output_annotated_path=annotated_path,
        is_demo=bool(is_demo)
    )

    calibrated_glb_url = None
    if calibration_result.get("is_calibrated") and calibration_result.get("landmarks_3d"):
        try:
            from app.vision.smpl_fitter import smpl_mesh_fitter
            mesh_filename = f"calib_mesh_{uuid.uuid4().hex[:8]}.glb"
            glb_out_path = str(settings.STATIC_DIR / mesh_filename)
            fit_res = smpl_mesh_fitter.fit_and_export_glb(
                landmarks=calibration_result["landmarks_3d"],
                output_glb_path=glb_out_path,
                body_proportions=calibration_result.get("body_proportions")
            )
            if fit_res and "key_joint_positions" in fit_res:
                calibrated_glb_url = f"/static/{mesh_filename}"
                calibration_result["key_joint_positions"] = fit_res["key_joint_positions"]
        except Exception as e:
            print(f"[calibrate_patient_mesh] Error fitting SMPL mesh: {e}")

    photo_url = f"/uploads/{Path(image_path).name}" if image_path else None
    annotated_url = f"/static/{annotated_filename}" if annotated_filename else None

    return {
        "status": calibration_result["status"],
        "is_calibrated": calibration_result["is_calibrated"],
        "landmarks_3d": calibration_result["landmarks_3d"],
        "key_joint_positions": calibration_result["key_joint_positions"],
        "body_proportions": calibration_result["body_proportions"],
        "annotated_image_url": annotated_url,
        "photo_url": photo_url,
        "calibrated_mesh_url": calibrated_glb_url,
        "detected_body_part": calibration_result.get("detected_body_part")
    }

@router.post("", response_model=ExaminationDetailResponse)
def create_examination(payload: ExaminationCreate, db: Session = Depends(get_db)):
    """
    Step 1 of Workflow: Initiates an AI-controlled physical examination session
    with the selected painful anatomical region (e.g., RIGHT_KNEE, LEFT_KNEE).
    """
    engine = ExaminationWorkflowEngine(db)
    exam = engine.initialize_examination(
        patient_id=payload.patient_id or "PT-8821",
        patient_name=payload.patient_name or "Anonymous Patient",
        patient_age=payload.patient_age or 45,
        patient_gender=payload.patient_gender or "Unspecified",
        selected_region=payload.selected_region,
        affected_side=payload.affected_side,
        patient_orientation=payload.patient_orientation,
        patient_calibration=payload.patient_calibration
    )
    return _format_exam_response(exam)

@router.get("/{exam_id}", response_model=ExaminationDetailResponse)
def get_examination(exam_id: str, db: Session = Depends(get_db)):
    engine = ExaminationWorkflowEngine(db)
    exam = engine.get_examination(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Examination not found")
    return _format_exam_response(exam)

@router.post("/{exam_id}/steps/{step_id}/submit", response_model=ExaminationDetailResponse)
async def submit_step(
    exam_id: str,
    step_id: str,
    response_boolean: Optional[bool] = Form(None),
    response_choice: Optional[str] = Form(None),
    response_text: Optional[str] = Form(None),
    response_numeric: Optional[float] = Form(None),
    use_synthetic_kinematic_demo: Optional[bool] = Form(False),
    video: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Operator submits response/video for the active AI step.
    The AI analyzes the submission (running CV for movements), updates examination state,
    and returns the updated 3D mesh metrics and next step directive.
    """
    engine = ExaminationWorkflowEngine(db)
    uploaded_video_path = None

    if video and video.filename:
        # Save video to upload directory
        ext = Path(video.filename).suffix or ".mp4"
        saved_filename = f"upload_{uuid.uuid4().hex[:8]}{ext}"
        saved_path = settings.UPLOAD_DIR / saved_filename
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        uploaded_video_path = str(saved_path)

    try:
        updated_exam = engine.submit_step_response(
            exam_id=exam_id,
            step_id=step_id,
            response_boolean=response_boolean,
            response_choice=response_choice,
            response_text=response_text,
            response_numeric=response_numeric,
            uploaded_video_path=uploaded_video_path,
            use_synthetic_kinematic_demo=bool(use_synthetic_kinematic_demo)
        )
        return _format_exam_response(updated_exam)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{exam_id}/steps/{step_id}/submit-json", response_model=ExaminationDetailResponse)
def submit_step_json(
    exam_id: str,
    step_id: str,
    payload: StepSubmissionRequest,
    db: Session = Depends(get_db)
):
    """JSON variant for submitting questions without file upload."""
    engine = ExaminationWorkflowEngine(db)
    try:
        updated_exam = engine.submit_step_response(
            exam_id=exam_id,
            step_id=step_id,
            response_boolean=payload.response_boolean,
            response_choice=payload.response_choice,
            response_text=payload.response_text,
            response_numeric=payload.response_numeric,
            uploaded_video_path=None,
            use_synthetic_kinematic_demo=payload.use_synthetic_kinematic_demo or False
        )
        return _format_exam_response(updated_exam)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{exam_id}/report", response_model=StructuredClinicalReport)
def get_structured_report(exam_id: str, db: Session = Depends(get_db)):
    """Generates the structured clinical report for clinician review."""
    engine = ExaminationWorkflowEngine(db)
    exam = engine.get_examination(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Examination not found")
    return build_structured_report(exam)

@router.post("/{exam_id}/sign-off")
def clinician_sign_off(
    exam_id: str,
    payload: ClinicianSignOffRequest,
    db: Session = Depends(get_db)
):
    """Records clinician review, diagnostic confirmation, and sign-off."""
    engine = ExaminationWorkflowEngine(db)
    exam = engine.get_examination(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Examination not found")
    
    # Add clinician-confirmed finding
    db.add(exam)
    exam.clinical_summary = (
        f"{exam.clinical_summary or ''}\n\n"
        f"[CLINICIAN SIGN-OFF] Reviewed by {payload.clinician_name} (Lic: {payload.clinician_license}). "
        f"Impression: {payload.diagnostic_impression}. Plan: {payload.recommended_plan}."
    )
    db.commit()
    return {
        "status": "SIGNED_OFF",
        "clinician": payload.clinician_name,
        "license": payload.clinician_license,
        "timestamp": exam.updated_at
    }
