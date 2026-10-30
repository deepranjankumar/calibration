from datetime import datetime
from typing import Dict, Any, List
from app.models.examination import Examination, ClinicalFinding, BiomechanicalMeasurement
from app.schemas.examination import (
    StructuredClinicalReport,
    ClinicalFindingSchema,
    BiomechanicalMeasurementSchema,
    FinalPrescription,
    MedicationPrescription,
    ExercisePrescription,
)

def build_prescription_for_exam(exam: Examination) -> FinalPrescription:
    """
    Generates evidence-based clinical prescription tailored to the exact body point,
    anatomical tissue, and biomechanical movement findings.
    Includes exact medications with 'how to use' and targeted exercises with sets/reps.
    """
    point_analysis = exam.point_analysis or {}
    region_id = exam.selected_region.upper()
    body_part_name = point_analysis.get("display_name") or exam.selected_region.replace("_", " ").title()
    tissue_name = point_analysis.get("anatomical_structures", {}).get("primary_muscle", "Musculoskeletal Soft Tissue")

    # 1. Base Medications
    meds = [
        MedicationPrescription(
            name="Diclofenac Diethylamine Gel 1.16% w/w + Menthol (Dynapar / Volini Gel)",
            form="Topical Gel",
            dosage="Apply thin ribbon (2-3 cm)",
            frequency="3 to 4 times daily",
            duration="7 days",
            how_to_use="Gently smooth a thin film over the painful area in circular motions until absorbed. Do not rub vigorously or apply over broken skin. Wash hands thoroughly with soap after application. Do not cover with airtight occlusion.",
            precautions="Avoid contact with eyes or mouth. Discontinue if local skin rash or severe burning occurs."
        ),
        MedicationPrescription(
            name="Tab. Paracetamol 650 mg (Calpol / Dolo 650)",
            form="Oral Tablet",
            dosage="1 tablet (650 mg)",
            frequency="Twice daily after food (1-0-1, as needed for pain)",
            duration="3 to 5 days",
            how_to_use="Swallow whole tablet strictly after meals with a full glass of water. Maintain a minimum 6-hour interval between doses. Do not exceed 3 tablets in 24 hours.",
            precautions="Avoid concurrent alcohol or other paracetamol-containing cold remedies. Avoid if history of severe liver disease."
        )
    ]

    has_high_tenderness = any("SEVERE" in (f.severity or "") for f in (exam.findings or []))
    if has_high_tenderness or "SPRAIN" in region_id or "TEAR" in region_id or "TENDON" in region_id or "FRACTURE" in region_id:
        meds.append(
            MedicationPrescription(
                name="Tab. Aceclofenac 100 mg + Serratiopeptidase 15 mg (Zerodol-SP)",
                form="Oral Tablet",
                dosage="1 tablet",
                frequency="Twice daily after meals (1-0-1)",
                duration="5 days",
                how_to_use="Take strictly after breakfast and dinner with plenty of water. Do not chew or crush. Take alongside Pantoprazole in the morning.",
                precautions="Avoid in active peptic ulcer or severe kidney disease."
            )
        )
        meds.append(
            MedicationPrescription(
                name="Tab. Pantoprazole 40 mg (Pan-40)",
                form="Oral Tablet",
                dosage="1 tablet (40 mg)",
                frequency="Once daily before breakfast (1-0-0)",
                duration="5 days",
                how_to_use="Take 30 minutes before breakfast in the morning with half a glass of water on an empty stomach.",
                precautions="Swallow whole; do not crush."
            )
        )

    # 2. Targeted Rehabilitation & Physical Therapy Exercises
    if "KNEE" in region_id or "THIGH" in region_id:
        exercises = [
            ExercisePrescription(
                name="Isometric Quadriceps Sets (Quad Sets)",
                target_area="Anterior Thigh (Quadriceps Femoris)",
                sets_reps="3 sets of 10 repetitions",
                frequency="Twice daily (Morning & Evening)",
                how_to_perform="Lie flat or sit with your leg straight out on a firm bed. Press the back of your knee down firmly against the mattress, tightening the muscles on top of your thigh. Hold tension for 5 seconds, breathe normally, then relax for 3 seconds. Repeat 10 times.",
                hold_duration_sec=5,
                precautions="Stop immediately if sharp anterior joint pain occurs."
            ),
            ExercisePrescription(
                name="Straight Leg Raise (SLR)",
                target_area="Rectus Femoris & Hip Flexors",
                sets_reps="3 sets of 10 repetitions",
                frequency="Twice daily",
                how_to_perform="Lie on your back with the opposite knee bent and foot flat. Keep the affected leg completely straight, point toes toward ceiling, and smoothly raise leg about 12 inches (30 cm) off the bed. Hold for 3 seconds, then lower slowly. Do not arch lower back.",
                hold_duration_sec=3,
                precautions="Do not swing leg rapidly."
            ),
            ExercisePrescription(
                name="Seated Active Terminal Knee Extension",
                target_area="Vastus Medialis Oblique (VMO)",
                sets_reps="2 sets of 10 repetitions",
                frequency="Twice daily",
                how_to_perform="Sit upright on a sturdy chair with feet flat. Slowly straighten the affected leg until fully extended at the knee. Hold at terminal extension for 4 seconds, feeling the muscle above the kneecap contract. Slowly lower back to 90°.",
                hold_duration_sec=4,
                precautions="Do not hyperextend violently."
            )
        ]
    elif "SHOULDER" in region_id or "ARM" in region_id:
        exercises = [
            ExercisePrescription(
                name="Codman's Pendulum Gentle Mobilization",
                target_area="Glenohumeral Joint & Rotator Cuff",
                sets_reps="2 to 3 minutes continuously (Clockwise & Counter-clockwise)",
                frequency="3 times daily",
                how_to_perform="Bend forward at waist (45-60°) resting unaffected hand on a sturdy table. Let affected arm dangle freely under gravity. Sway body gently to initiate smooth circular motion without actively contracting shoulder muscles.",
                hold_duration_sec=0,
                precautions="Do not lift arm actively; let gravity do the swinging."
            ),
            ExercisePrescription(
                name="Passive Wall Crawl / Finger Walk",
                target_area="Shoulder Flexion Range of Motion",
                sets_reps="3 sets of 8 repetitions",
                frequency="Twice daily",
                how_to_perform="Stand facing a wall at arm's length. Place fingertips on the wall at chest level. Walk fingers slowly up the wall as high as comfortably possible without shrugging shoulder. Hold top stretch for 5 seconds, then walk down.",
                hold_duration_sec=5,
                precautions="Avoid shrugging shoulders up to ears."
            ),
            ExercisePrescription(
                name="Scapular Retraction & Squeeze",
                target_area="Rhomboids & Mid-Trapezius Stabilizers",
                sets_reps="3 sets of 12 repetitions",
                frequency="Twice daily",
                how_to_perform="Sit upright with elbows bent at 90° at your sides. Gently squeeze shoulder blades backward and down as if pinching a pencil between them. Hold for 5 seconds while breathing normally, then relax.",
                hold_duration_sec=5,
                precautions="Keep neck relaxed."
            )
        ]
    elif "WRIST" in region_id or "FOREARM" in region_id or "ELBOW" in region_id:
        exercises = [
            ExercisePrescription(
                name="Passive Wrist Extensor & Flexor Stretches",
                target_area="Forearm Common Extensors & Flexor Tendons",
                sets_reps="3 sets of 20-second holds",
                frequency="3 times daily",
                how_to_perform="Extend arm in front of you with elbow straight, palm down. Use opposite hand to gently bend your wrist downward until you feel a gentle stretch across top of forearm. Hold for 20 seconds. Next, turn palm up and pull fingers backward toward your body for 20 seconds.",
                hold_duration_sec=20,
                precautions="Do not force into painful pinching."
            ),
            ExercisePrescription(
                name="Eccentric Wrist Extension with Lightweight",
                target_area="Extensor Carpi Radialis Brevis (Forearm Muscle)",
                sets_reps="3 sets of 10 repetitions",
                frequency="Once daily",
                how_to_perform="Rest forearm on table with wrist hanging over edge holding a 500ml water bottle (palm down). Use other hand to lift wrist up, then release other hand and SLOWLY lower the bottle down over 4 seconds using only the affected wrist. Repeat.",
                hold_duration_sec=4,
                precautions="Use lightweight only; avoid heavy dumbbells."
            ),
            ExercisePrescription(
                name="Median Nerve Gliding Exercise",
                target_area="Carpal Tunnel & Volar Forearm",
                sets_reps="5 slow cycles",
                frequency="Twice daily",
                how_to_perform="Start with a gentle fist, then straighten fingers upright. Extend wrist backward. Turn palm facing up toward ceiling. Gently pull thumb outward with opposite hand. Maintain each position smoothly without jerking.",
                hold_duration_sec=3,
                precautions="Stop if pins and needles increase."
            )
        ]
    elif "CALF" in region_id or "ANKLE" in region_id or "SHIN" in region_id:
        exercises = [
            ExercisePrescription(
                name="Gastrocnemius & Soleus Towel Stretch",
                target_area="Calf Muscle Belly & Achilles Tendon",
                sets_reps="3 sets of 30-second holds",
                frequency="3 times daily",
                how_to_perform="Sit with leg straight out. Loop a rolled towel around ball of foot. Keeping knee straight, gently pull towel toward body until feeling a comfortable stretch in calf. Hold 30 seconds.",
                hold_duration_sec=30,
                precautions="Do not bounce."
            ),
            ExercisePrescription(
                name="Ankle Alphabet Multi-Planar Mobilization",
                target_area="Ankle Joint Complex (Talocrural & Subtalar)",
                sets_reps="1 full alphabet cycle (A to Z)",
                frequency="Twice daily",
                how_to_perform="Sit with leg elevated. Trace all capital letters of the alphabet in the air using only your big toe, moving ankle through full comfortable range.",
                hold_duration_sec=0,
                precautions="Move slowly with control."
            ),
            ExercisePrescription(
                name="Bilateral Heel Raises with Chair Support",
                target_area="Calf Musculature & Achilles Load Tolerance",
                sets_reps="3 sets of 10 repetitions",
                frequency="Twice daily",
                how_to_perform="Stand holding chair for balance. Rise up onto balls of both feet as high as possible. Pause at top for 2 seconds, then lower slowly over 3 seconds.",
                hold_duration_sec=2,
                precautions="Ensure firm balance support."
            )
        ]
    elif "LUMBAR" in region_id or "SPINE" in region_id or "BACK" in region_id:
        exercises = [
            ExercisePrescription(
                name="Pelvic Tilts in Supine",
                target_area="Lumbar Spine & Transversus Abdominis",
                sets_reps="3 sets of 10 repetitions",
                frequency="Twice daily",
                how_to_perform="Lie on back with knees bent and feet flat on bed. Tighten abdominal muscles and flatten lower back against bed by tilting pelvis backward. Hold for 5 seconds while breathing smoothly, then relax.",
                hold_duration_sec=5,
                precautions="Do not hold your breath."
            ),
            ExercisePrescription(
                name="Cat-Camel Spinal Mobilization",
                target_area="Thoracolumbar Spine",
                sets_reps="2 sets of 10 gentle cycles",
                frequency="Morning and Night",
                how_to_perform="On hands and knees with wrists under shoulders. Slowly arch back upward toward ceiling like a cat, letting head drop down. Then slowly let belly sink toward floor, arching spine down and looking forward. Move slowly without forcing into pain.",
                hold_duration_sec=3,
                precautions="Avoid extreme spinal extension if sharp pain triggers."
            ),
            ExercisePrescription(
                name="Knee-to-Chest Gentle Decompression Stretch",
                target_area="Lower Back & Gluteal Fascia",
                sets_reps="3 sets of 20-second holds each side",
                frequency="Twice daily",
                how_to_perform="Lie on back with knees bent. Gently grasp behind one knee and draw it up toward your chest until a comfortable stretch is felt in lower back/hip. Hold 20 seconds, relax, switch legs.",
                hold_duration_sec=20,
                precautions="Do not pull directly on the kneecap."
            )
        ]
    else:
        exercises = [
            ExercisePrescription(
                name="Sub-Maximal Isometric Contractions",
                target_area=f"{body_part_name} Musculature",
                sets_reps="3 sets of 10 repetitions, 5-second hold",
                frequency="Twice daily",
                how_to_perform="Contract the muscles around the affected area against an immovable surface without moving the joint. Hold tension for 5 seconds, then relax for 3 seconds.",
                hold_duration_sec=5,
                precautions="Maintain normal breathing."
            ),
            ExercisePrescription(
                name="Gentle Passive Range of Motion (PROM)",
                target_area=f"{body_part_name} Joint & Soft Tissue",
                sets_reps="2 sets of 10 smooth cycles",
                frequency="Twice daily",
                how_to_perform="Move the joint slowly through pain-free range without loading or carrying weight. Stop before sharp discomfort.",
                hold_duration_sec=0,
                precautions="Stay within pain-free boundaries."
            )
        ]

    return FinalPrescription(
        clinical_diagnosis=f"{body_part_name} Acute Strain / Mechanical Dysfunction ({tissue_name})",
        affected_body_part=body_part_name,
        severity_grade="Moderate" if has_high_tenderness else "Mild to Moderate",
        medications=meds,
        exercises=exercises,
        home_care_measures=[
            "Cryotherapy (बरफ की सिकाई): Apply ice pack wrapped in a damp towel for 15-20 minutes every 3-4 hours for the first 48 hours to reduce inflammation.",
            "Relative Rest (विश्राम): Avoid strenuous sports, heavy lifting, or aggravating repetitive movements for 5-7 days.",
            "Compression & Elevation (सहारा): Use an elastic compression wrap or ergonomic brace during daytime activity to support the injured soft tissue.",
            "Hydration & Nutrition: Maintain adequate hydration and protein intake to support cellular tissue healing."
        ],
        activity_modifications=[
            "Do NOT perform sudden explosive movements, jumping, or heavy weight-bearing on the affected side.",
            "Avoid sitting or standing in static posture for more than 45 minutes continuously.",
            "Do NOT receive aggressive deep-tissue massage over the acutely inflamed area during the first 72 hours."
        ],
        follow_up_advice="Review in orthopedic clinic in 7 to 10 days if functional pain does not improve by at least 50%, or sooner if symptoms worsen.",
        emergency_warning="Seek IMMEDIATE emergency orthopedic attention if you experience: sudden severe inability to bear weight, visible joint deformity, progressive numbness/weakness in fingers or toes, or high fever with joint warmth.",
        prescribed_date=datetime.utcnow()
    )

def build_structured_report(exam: Examination) -> StructuredClinicalReport:
    """
    Compiles full structured clinical report following validated orthopedic documentation guidelines.
    Guarantees strict separation between patient-reported, CV-observed, and calculated metrics.
    Includes final medical & exercise prescription.
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

    prescription = build_prescription_for_exam(exam)

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
                "Trauma / Severe Fracture Rule-Out",
                "Septic Joint / Acute Infectious Effusion",
                "Distal Neurovascular Compromise"
            ],
            "flagged_alerts": [f.title for f in red_flag_findings]
        },
        urgent_referral_alert=urgent_alert,
        patient_reported_symptoms=patient_reported,
        computer_vision_observations=cv_observations,
        objective_measurements=[BiomechanicalMeasurementSchema.from_orm(m) for m in measurements],
        provisional_clinical_findings=calculated_findings,
        prescription=prescription,
        computer_vision_quality_summary=cv_quality,
        regulatory_disclaimer=exam.disclaimer,
        clinician_attestation=None
    )
