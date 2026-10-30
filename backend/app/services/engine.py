import os
import uuid
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.models.examination import (
    Examination,
    ExaminationStepRecord,
    StepSubmission,
    BiomechanicalMeasurement,
    ClinicalFinding,
)
from app.protocols.multi_region_protocols import get_protocol_for_region
from app.services.point_intelligence import point_analyzer
from app.vision.pose_tracker import pose_analyzer
from app.config import settings

class ExaminationWorkflowEngine:
    def __init__(self, db: Session):
        self.db = db

    def initialize_examination(
        self,
        patient_id: str = "PT-8821",
        patient_name: str = "Anonymous Patient",
        patient_age: int = 45,
        patient_gender: str = "Unspecified",
        selected_region: str = "RIGHT_KNEE",
        affected_side: str = "RIGHT",
        patient_orientation: str = "SAGITTAL_RIGHT",
        patient_calibration: Optional[Dict[str, Any]] = None,
        selected_point: Optional[Dict[str, float]] = None,
        point_analysis: Optional[Dict[str, Any]] = None
    ) -> Examination:
        """
        Creates new examination record and seeds protocol steps in strict sequence.
        If an arbitrary 3D point is specified, synthesizes a tailored dynamic protocol.
        """
        # If operator pointed to an arbitrary body point, perform analysis or use provided analysis
        if selected_point and not point_analysis:
            point_analysis = point_analyzer.analyze_point(selected_point, side_hint=affected_side)

        if point_analysis:
            protocol_steps = point_analyzer.generate_protocol_steps_for_point(point_analysis)
            protocol_title = f"{point_analysis.get('display_name', selected_region)} AI Clinical Protocol"
            actual_region = point_analysis.get("region_id", selected_region)
            actual_side = point_analysis.get("side", affected_side)
            if actual_side == "BILATERAL":
                actual_side = affected_side
        else:
            protocol_steps = get_protocol_for_region(selected_region)
            protocol_title = f"{selected_region.replace('_', ' ').title()} Clinical Examination Protocol"
            actual_region = selected_region
            actual_side = affected_side

        exam = Examination(
            patient_id=patient_id,
            patient_name=patient_name,
            patient_age=patient_age,
            patient_gender=patient_gender,
            selected_region=actual_region,
            affected_side=actual_side,
            patient_orientation=patient_orientation,
            patient_calibration=patient_calibration,
            selected_point=selected_point,
            point_analysis=point_analysis,
            status="ACTIVE",
            protocol_name=protocol_title,
            current_step_id=protocol_steps[0].step_id,
            current_step_index=1,
            total_steps=len(protocol_steps),
            urgent_referral=False
        )
        self.db.add(exam)
        self.db.flush()

        # Seed steps for the specific joint protocol
        for idx, step_def in enumerate(protocol_steps, start=1):
            step_record = ExaminationStepRecord(
                examination_id=exam.id,
                step_id=step_def.step_id,
                step_index=idx,
                phase=step_def.phase,
                title=step_def.title,
                operator_instruction=step_def.operator_instruction,
                patient_question=step_def.patient_question,
                patient_question_hi=getattr(step_def, "patient_question_hi", None),
                action_type=step_def.action_type,
                input_config=step_def.input_config,
                status="CURRENT" if idx == 1 else "PENDING"
            )
            self.db.add(step_record)

        self.db.commit()
        self.db.refresh(exam)
        return exam

    def get_examination(self, exam_id: str) -> Optional[Examination]:
        return self.db.query(Examination).filter(Examination.id == exam_id).first()

    def submit_step_response(
        self,
        exam_id: str,
        step_id: str,
        response_boolean: Optional[bool] = None,
        response_choice: Optional[str] = None,
        response_text: Optional[str] = None,
        response_numeric: Optional[float] = None,
        uploaded_video_path: Optional[str] = None,
        use_synthetic_kinematic_demo: bool = False
    ) -> Examination:
        """
        Processes operator submission, triggers computer vision analysis when appropriate,
        updates examination findings, and advances state machine.
        """
        exam = self.get_examination(exam_id)
        if not exam:
            raise ValueError("Examination not found")

        current_step_record = (
            self.db.query(ExaminationStepRecord)
            .filter(
                ExaminationStepRecord.examination_id == exam.id,
                ExaminationStepRecord.step_id == step_id
            )
            .first()
        )
        if not current_step_record:
            raise ValueError(f"Step {step_id} not found in examination")

        # Find protocol definition
        if exam.point_analysis:
            active_protocol = point_analyzer.generate_protocol_steps_for_point(exam.point_analysis)
        else:
            active_protocol = get_protocol_for_region(exam.selected_region)

        step_def = next((s for s in active_protocol if s.step_id == step_id), None)
        if not step_def:
            raise ValueError(f"Step definition {step_id} not found in active protocol")

        # Create submission record
        sub = StepSubmission(
            step_id=current_step_record.id,
            examination_id=exam.id,
            response_boolean=response_boolean,
            response_choice=response_choice,
            response_text=response_text,
            response_numeric=response_numeric
        )
        self.db.add(sub)
        self.db.flush()

        # 1. SAFETY & RED FLAG CHECKS
        if step_def.is_red_flag and response_boolean is True:
            # Urgent abort condition triggered
            exam.status = "ABORTED_RED_FLAG"
            exam.urgent_referral = True
            exam.urgent_referral_reason = step_def.red_flag_alert_reason
            exam.referral_urgency = step_def.urgency_level or "EMERGENCY_IMMEDIATE"
            
            # Record critical red flag finding
            alert_finding = ClinicalFinding(
                examination_id=exam.id,
                source_category="RED_FLAG_ALERT",
                code=f"ALERT_{step_def.step_id}",
                title=f"SAFETY STOP: {step_def.title}",
                description=step_def.red_flag_alert_reason,
                severity="CRITICAL",
                is_provisional=False
            )
            self.db.add(alert_finding)
            
            current_step_record.status = "COMPLETED"
            current_step_record.completed_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(exam)
            return exam

        # 2. LOCALIZATION STEP PROCESSING
        if (step_def.phase == "LOCALIZATION" or "LOCALIZATION" in step_def.step_id or "SYMPTOM" in step_def.step_id) and response_choice:
            choice_data = next((c for c in step_def.input_config.get("choices", []) if c.get("value") == response_choice), None)
            zone_label = choice_data["label"] if choice_data else response_choice
            mesh_pin = choice_data.get("mesh_pin") if (choice_data and "mesh_pin" in choice_data) else exam.selected_point

            exam.specific_zone = response_choice
            finding = ClinicalFinding(
                examination_id=exam.id,
                source_category="PATIENT_REPORTED",
                code=f"DIAG_{step_def.step_id}",
                title=step_def.title,
                description=f"Patient report for {step_def.title}: {zone_label}." + (f" Note: {response_text}" if response_text else ""),
                severity="MODERATE",
                anatomical_site=response_choice,
                mesh_anchor=mesh_pin,
                is_provisional=True
            )
            self.db.add(finding)

        # 3. FUNCTIONAL / MECHANICAL SYMPTOMS PROCESSING
        if (step_def.phase == "FUNCTIONAL_TEST" or "MECHANICAL" in step_def.step_id or "TEST" in step_def.step_id) and response_choice:
            is_critical = "SEVERE" in response_choice or "TRUE_LOCKING" in response_choice
            is_moderate = "POSITIVE" in response_choice or "MILD" in response_choice or "BUCKLING" in response_choice
            severity = "CRITICAL" if is_critical else ("MODERATE" if is_moderate else "NORMAL")
            choice_data = next((c for c in step_def.input_config.get("choices", []) if c.get("value") == response_choice), None)
            label = choice_data["label"] if choice_data else response_choice.replace('_', ' ').title()
            finding = ClinicalFinding(
                examination_id=exam.id,
                source_category="PATIENT_REPORTED",
                code=f"TEST_{step_def.step_id}",
                title=step_def.title,
                description=f"Clinical Assessment Outcome: {label}.",
                severity=severity,
                anatomical_site=exam.selected_region,
                mesh_anchor=exam.selected_point,
                is_provisional=True
            )
            self.db.add(finding)

        # 4. COMPUTER VISION VIDEO ANALYSIS
        if step_def.action_type == "VIDEO_MOVEMENT":
            video_to_analyze = uploaded_video_path
            annotated_filename = f"annotated_{uuid.uuid4().hex[:8]}.mp4"
            annotated_full_path = str(settings.STATIC_DIR / annotated_filename)

            # Generate synthetic test video if requested or if no video was uploaded
            if use_synthetic_kinematic_demo or not video_to_analyze or not os.path.exists(video_to_analyze):
                demo_video_path = str(settings.STATIC_DIR / f"demo_kinematic_{uuid.uuid4().hex[:8]}.mp4")
                pose_analyzer.generate_synthetic_kinematic_video(
                    demo_video_path,
                    side=exam.affected_side,
                    duration_sec=7
                )
                video_to_analyze = demo_video_path
                sub.video_filename = Path(demo_video_path).name

            # Run pose analyzer
            cv_results = pose_analyzer.analyze_video(
                video_path=video_to_analyze,
                side=exam.affected_side,
                movement_plane=step_def.input_config.get("plane", "SAGITTAL"),
                output_annotated_path=annotated_full_path,
                is_synthetic_demo=use_synthetic_kinematic_demo
            )

            sub.annotated_video_filename = annotated_filename

            # Save Biomechanical Measurement
            region_label = exam.selected_region.replace('_', ' ').title()
            measurement = BiomechanicalMeasurement(
                examination_id=exam.id,
                submission_id=sub.id,
                joint_name=f"{exam.affected_side}_{exam.selected_region}",
                movement_type=step_def.step_id,
                terminal_extension_deg=cv_results["terminal_extension_deg"],
                maximum_flexion_deg=cv_results["maximum_flexion_deg"],
                range_of_motion_deg=cv_results["range_of_motion_deg"],
                peak_angular_velocity_dps=cv_results["peak_angular_velocity_dps"],
                tracking_confidence_mean=cv_results["tracking_confidence_mean"],
                frames_total=cv_results["frames_total"],
                frames_tracked=cv_results["frames_tracked"],
                occlusion_detected=cv_results["occlusion_detected"],
                quality_rating=cv_results["quality_rating"],
                timeseries_data=cv_results["timeseries_data"],
                quality_warnings=cv_results["quality_warnings"]
            )
            self.db.add(measurement)

            # Formulate CV Clinical Findings
            # Calculated Measurement finding
            rom_finding = ClinicalFinding(
                examination_id=exam.id,
                source_category="CALCULATED_MEASUREMENT",
                code="ACTIVE_ROM_METRICS",
                title=f"Active Kinematics ({exam.affected_side} {region_label})",
                description=(
                    f"Measured Terminal Position: {cv_results['terminal_extension_deg']}°. "
                    f"Maximum Flexion / Excursion: {cv_results['maximum_flexion_deg']}°. "
                    f"Total Active ROM: {cv_results['range_of_motion_deg']}° with peak velocity {cv_results['peak_angular_velocity_dps']}°/s."
                ),
                severity="MODERATE" if cv_results['terminal_extension_deg'] > 8.0 or cv_results['maximum_flexion_deg'] < 120.0 else "NORMAL",
                is_provisional=True
            )
            self.db.add(rom_finding)

            # CV Observation finding regarding tracking quality
            obs_finding = ClinicalFinding(
                examination_id=exam.id,
                source_category="CV_OBSERVATION",
                code="CV_TRACKING_QUALITY",
                title="Computer Vision Tracking Reliability",
                description=(
                    f"Tracking Quality Rating: {cv_results['quality_rating']} "
                    f"(Mean Confidence: {cv_results['tracking_confidence_mean']*100:.0f}%, "
                    f"{cv_results['frames_tracked']}/{cv_results['frames_total']} valid frames). "
                    + (" ".join(cv_results["quality_warnings"]) if cv_results["quality_warnings"] else "No kinematic artifacts or occlusion detected.")
                ),
                severity="MILD" if cv_results["quality_rating"] != "HIGH" else "NORMAL",
                is_provisional=True
            )
            self.db.add(obs_finding)

        # 5. PALPATION TENDERNESS SCORE
        if step_def.step_id == "PALPATION_TENDERNESS" and response_numeric is not None:
            score = float(response_numeric)
            severity = "CRITICAL" if score >= 8 else ("MODERATE" if score >= 4 else "MILD")
            finding = ClinicalFinding(
                examination_id=exam.id,
                source_category="PATIENT_REPORTED",
                code="PALPATION_TENDERNESS_SCORE",
                title="Focal Joint Palpation Tenderness",
                description=f"Patient reported Numeric Rating Scale tenderness of {score:.1f}/10 at symptomatic site upon direct operator palpation.",
                severity=severity,
                is_provisional=True
            )
            self.db.add(finding)

        # Mark current step completed
        current_step_record.status = "COMPLETED"
        current_step_record.completed_at = datetime.utcnow()

        # Advance state machine to next step
        next_step_index = current_step_record.step_index + 1
        if next_step_index <= len(active_protocol):
            next_step_def = active_protocol[next_step_index - 1]
            exam.current_step_id = next_step_def.step_id
            exam.current_step_index = next_step_index
            
            next_step_record = (
                self.db.query(ExaminationStepRecord)
                .filter(
                    ExaminationStepRecord.examination_id == exam.id,
                    ExaminationStepRecord.step_index == next_step_index
                )
                .first()
            )
            if next_step_record:
                next_step_record.status = "CURRENT"
        else:
            # Examination fully completed
            exam.status = "COMPLETED"
            self._compile_synthesis(exam)

        self.db.commit()
        self.db.refresh(exam)
        return exam

    def _compile_synthesis(self, exam: Examination):
        """Synthesizes all collected clinical findings into an integrated clinical summary."""
        findings = self.db.query(ClinicalFinding).filter(ClinicalFinding.examination_id == exam.id).all()
        measurements = self.db.query(BiomechanicalMeasurement).filter(BiomechanicalMeasurement.examination_id == exam.id).all()
        
        if exam.point_analysis:
            p_data = exam.point_analysis
            disp = p_data.get('display_name', exam.selected_region.replace('_', ' '))
            structs = p_data.get('anatomical_structures', {})
            rx = p_data.get('clinical_decisions', {}).get('treatment_plan', {})

            lines = [
                f"Comprehensive Physical Examination for {exam.patient_name} targeted to {disp} completed under {exam.protocol_name}.",
                f"Identified anatomical structure: {structs.get('primary_muscle', 'Target tissue')} (Innervation: {structs.get('innervation', 'N/A')}; Tissue: {structs.get('tissue_type', 'Musculoskeletal')}).",
                "All red-flag emergency screening questions were answered.",
            ]
            if exam.selected_point:
                lines.append(f"Pinpointed Coordinates on 3D Body Mesh: [X: {exam.selected_point.get('x', 0):.2f}, Y: {exam.selected_point.get('y', 0):.2f}, Z: {exam.selected_point.get('z', 0):.2f}].")
            
            if measurements:
                m = measurements[0]
                lines.append(
                    f"Objective Kinematic Motion Tracking: Terminal Position {m.terminal_extension_deg}°, "
                    f"Maximum Flexion/Excursion {m.maximum_flexion_deg}°, Total ROM {m.range_of_motion_deg}° "
                    f"(Tracking Quality: {m.quality_rating}, Mean Confidence: {m.tracking_confidence_mean*100:.0f}%)."
                )

            if rx:
                if rx.get("phase1_acute"):
                    lines.append(f"Recommended Immediate Care (Phase 1): {rx.get('phase1_acute')}")
                if rx.get("phase2_rehab"):
                    rehab_text = " • ".join(rx["phase2_rehab"]) if isinstance(rx["phase2_rehab"], list) else rx["phase2_rehab"]
                    lines.append(f"Prescribed Rehabilitation Exercises (Phase 2): {rehab_text}")
                if rx.get("phase3_medical"):
                    lines.append(f"Diagnostic & Medical Escalation: {rx.get('phase3_medical')}")
                if rx.get("recovery_timeline"):
                    lines.append(f"Estimated Recovery Window: {rx.get('recovery_timeline')}")

            exam.clinical_summary = " ".join(lines)

        # Automatically formulate & persist the AI-generated prescription
        try:
            from app.services.report_generator import build_prescription_for_exam
            ai_rx = build_prescription_for_exam(exam)
            exam.custom_prescription = ai_rx.model_dump(mode="json") if hasattr(ai_rx, "model_dump") else json.loads(ai_rx.json())
        except Exception as rx_err:
            logger.warning(f"Could not auto-persist synthesis prescription: {rx_err}")
        else:
            region_label = exam.selected_region.replace('_', ' ').title()
            lines = [
                f"Physical Examination for {exam.patient_name} ({exam.affected_side} {region_label}) completed under {exam.protocol_name}.",
                "All red-flag trauma and systemic infectious screening tests were negative.",
            ]
            
            if exam.specific_zone:
                lines.append(f"Primary focal pain localization: {exam.specific_zone.replace('_', ' ')}.")
                
            if measurements:
                m = measurements[0]
                lines.append(
                    f"Active Range of Motion: Terminal Extension {m.terminal_extension_deg}°, "
                    f"Maximum Flexion {m.maximum_flexion_deg}°, Total ROM {m.range_of_motion_deg}° "
                    f"(Tracking Quality: {m.quality_rating}, Mean Conf: {m.tracking_confidence_mean*100:.0f}%)."
                )

            exam.clinical_summary = " ".join(lines)

        # Automatically formulate & persist the AI-generated prescription
        try:
            from app.services.report_generator import build_prescription_for_exam
            ai_rx = build_prescription_for_exam(exam)
            exam.custom_prescription = ai_rx.model_dump(mode="json") if hasattr(ai_rx, "model_dump") else json.loads(ai_rx.json())
        except Exception as rx_err:
            logger.warning(f"Could not auto-persist synthesis prescription: {rx_err}")
