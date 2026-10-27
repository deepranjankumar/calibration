from datetime import datetime
from typing import Dict, Any, List
from app.models.examination import Examination, ClinicalFinding, BiomechanicalMeasurement
from app.schemas.examination import StructuredClinicalReport, ClinicalFindingSchema, BiomechanicalMeasurementSchema

def build_structured_report(exam: Examination) -> StructuredClinicalReport:
    """
    Compiles full structured clinical report following validated orthopedic documentation guidelines.
    Guarantees strict separation between patient-reported, CV-observed, and calculated metrics.
    """
    findings: List[ClinicalFinding] = exam.findings or []
    measurements: List[BiomechanicalMeasurement] = exam.measurements or []

    patient_reported = [
        ClinicalFindingSchema.from_orm(f) 
        for f in findings if f.source_category == "PATIENT_REPORTED"
    ]
    cv_observations = [
        ClinicalFindingSchema.from_orm(f) 
        for f in findings if f.source_category == "CV_OBSERVATION"
    ]
    calculated_findings = [
        ClinicalFindingSchema.from_orm(f) 
        for f in findings if f.source_category == "CALCULATED_MEASUREMENT"
    ]
    red_flag_findings = [
        ClinicalFindingSchema.from_orm(f) 
        for f in findings if f.source_category == "RED_FLAG_ALERT"
    ]

    # Overall CV Quality
    if measurements:
        m = measurements[0]
        cv_quality = {
            "overall_status": m.quality_rating,
            "mean_tracking_confidence": f"{m.tracking_confidence_mean * 100:.1f}%",
            "frames_analyzed": m.frames_total,
            "valid_tracking_frames": m.frames_tracked,
            "occlusion_detected": m.occlusion_detected,
            "quality_warnings": m.quality_warnings or []
        }
    else:
        cv_quality = {
            "overall_status": "NOT_PERFORMED",
            "mean_tracking_confidence": "N/A",
            "frames_analyzed": 0,
            "valid_tracking_frames": 0,
            "occlusion_detected": False,
            "quality_warnings": []
        }

    urgent_alert = None
    if exam.urgent_referral:
        urgent_alert = {
            "triggered": True,
            "urgency": exam.referral_urgency or "EMERGENCY_IMMEDIATE",
            "reason": exam.urgent_referral_reason,
            "directive": "IMMEDIATE CLINICIAN ESCALATION MANDATED. Halt provocative active movements. Arrange emergency imaging/specialist consultation."
        }

    return StructuredClinicalReport(
        examination_id=exam.id,
        generated_at=datetime.utcnow(),
        patient_demographics={
            "patient_id": exam.patient_id,
            "patient_name": exam.patient_name,
            "patient_age": exam.patient_age,
            "patient_gender": exam.patient_gender,
            "affected_side": exam.affected_side,
            "selected_region": exam.selected_region,
            "specific_zone": exam.specific_zone
        },
        protocol_administered=exam.protocol_name,
        examination_status=exam.status,
        red_flag_evaluation={
            "red_flags_cleared": not exam.urgent_referral,
            "screened_conditions": [
                "Ottawa Knee Rule (Trauma / Weight-bearing inability)",
                "Septic Joint / Acute Infectious Effusion",
                "Distal Neurovascular / Peroneal Nerve Compromise"
            ],
            "flagged_alerts": [f.title for f in red_flag_findings]
        },
        urgent_referral_alert=urgent_alert,
        patient_reported_symptoms=patient_reported,
        computer_vision_observations=cv_observations,
        objective_measurements=[BiomechanicalMeasurementSchema.from_orm(m) for m in measurements],
        provisional_clinical_findings=calculated_findings,
        computer_vision_quality_summary=cv_quality,
        regulatory_disclaimer=exam.disclaimer,
        clinician_attestation=None
    )
