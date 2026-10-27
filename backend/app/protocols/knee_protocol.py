from typing import List
from app.protocols.base import ProtocolStepDef

KNEE_EXAMINATION_PROTOCOL: List[ProtocolStepDef] = [
    # --- PHASE 1: RED FLAG SCREENING ---
    ProtocolStepDef(
        step_id="RED_FLAG_TRAUMA",
        phase="RED_FLAGS",
        title="Ottawa Knee Rule: Acute Trauma & Weight-Bearing Assessment",
        operator_instruction="Ask the patient if acute severe trauma or fall occurred, and whether they can take 4 full steps right now without assistance. Inspect for visible deformity or patellar dislocation.",
        patient_question="Did you suffer an acute impact/injury, and are you completely unable to bear weight for at least 4 steps both immediately after and right now?",
        action_type="QUESTION_BOOLEAN",
        input_config={
            "guidance": "A positive response indicates Ottawa Knee Rule threshold for prospective fracture. Immediate referral for diagnostic radiography is indicated.",
            "choices": [{"value": "false", "label": "No (Able to bear weight / No acute fracture signs)"}, {"value": "true", "label": "Yes (Acute Trauma & Inability to bear weight 4 steps)"}]
        },
        is_red_flag=True,
        abort_on_true=True,
        red_flag_alert_reason="Ottawa Knee Rule criteria met: Acute high-energy trauma with inability to bear weight. Possible tibial plateau, patellar, or femoral condyle fracture.",
        urgency_level="EMERGENCY_IMMEDIATE"
    ),
    ProtocolStepDef(
        step_id="RED_FLAG_SEPTIC",
        phase="RED_FLAGS",
        title="Infection & Septic Joint Screen",
        operator_instruction="Palpate the knee warmth relative to contralateral knee. Inquire regarding systemic fever, chills, rapid joint effusion (<4h), or immunosuppressive medications.",
        patient_question="Is the knee burning hot to the touch, swollen rapidly within hours, or do you have a fever, chills, or sudden unexplained severe pain?",
        action_type="QUESTION_BOOLEAN",
        input_config={
            "guidance": "Rapid painful effusion accompanied by localized erythema/hyperthermia and fever strongly suggests septic arthritis or acute crystal arthropathy.",
            "choices": [{"value": "false", "label": "No (No fever, joint not acutely hot)"}, {"value": "true", "label": "Yes (Fever, acute heat, rapid effusion)"}]
        },
        is_red_flag=True,
        abort_on_true=True,
        red_flag_alert_reason="Systemic infectious markers present with acute hot swollen knee. High risk for septic arthritis requiring urgent arthrocentesis and orthopedic evaluation.",
        urgency_level="EMERGENCY_IMMEDIATE"
    ),
    ProtocolStepDef(
        step_id="RED_FLAG_NEUROVASCULAR",
        phase="RED_FLAGS",
        title="Distal Neurovascular & Perfusion Integrity",
        operator_instruction="Check dorsalis pedis / posterior tibial pulses and check active ankle dorsiflexion/plantarflexion for peroneal nerve injury.",
        patient_question="Do you feel any foot numbness, tingling, coldness/pallor in the toes, or weakness lifting the foot (foot drop)?",
        action_type="QUESTION_BOOLEAN",
        input_config={
            "guidance": "Distal pulse deficit or acute common peroneal palsy indicates vascular compromise or acute compartment syndrome.",
            "choices": [{"value": "false", "label": "No (Sensory and pulses intact)"}, {"value": "true", "label": "Yes (Numbness, cold foot, or weakness)"}]
        },
        is_red_flag=True,
        abort_on_true=True,
        red_flag_alert_reason="Distal neurovascular compromise detected (peroneal nerve deficit or reduced arterial perfusion). Immediate medical evaluation required.",
        urgency_level="EMERGENCY_IMMEDIATE"
    ),

    # --- PHASE 2: LOCALIZATION & SYMPTOM PROFILE ---
    ProtocolStepDef(
        step_id="SYMPTOM_LOCALIZATION",
        phase="LOCALIZATION",
        title="Anatomical Sub-zone Epicenter Localization",
        operator_instruction="Instruct the patient to point with ONE single finger to where the knee pain is most severe and focused. Correlate with the 3D anatomical wireframe mesh.",
        patient_question="If you had to point with just one finger to the exact center of your pain, where is it located?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "ANTERIOR_PATELLA", "label": "Anterior / Front (Patella, Quadriceps or Patellar Tendon)", "zone": "ANTERIOR_PATELLA", "mesh_pin": {"x": 0.22, "y": -0.15, "z": 0.12}},
                {"value": "MEDIAL_JOINT_LINE", "label": "Medial / Inner Side (Medial Meniscus, MCL, Pes Anserine)", "zone": "MEDIAL_JOINT_LINE", "mesh_pin": {"x": 0.16, "y": -0.16, "z": 0.05}},
                {"value": "LATERAL_JOINT_LINE", "label": "Lateral / Outer Side (Lateral Meniscus, LCL, IT Band)", "zone": "LATERAL_JOINT_LINE", "mesh_pin": {"x": 0.28, "y": -0.16, "z": 0.05}},
                {"value": "POSTERIOR_POPLITEAL", "label": "Posterior / Back of Knee (Baker's Cyst, Hamstring Tendon)", "zone": "POSTERIOR_POPLITEAL", "mesh_pin": {"x": 0.22, "y": -0.15, "z": -0.10}},
                {"value": "DIFFUSE_DEEP", "label": "Diffuse / Deep Inside the Joint (Generalized Osteoarthritis or Synovitis)", "zone": "DIFFUSE_DEEP", "mesh_pin": {"x": 0.22, "y": -0.15, "z": 0.0}}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="MECHANICAL_SYMPTOMS",
        phase="LOCALIZATION",
        title="Mechanical Symptoms (Locking & Giving Way)",
        operator_instruction="Differentiate between true mechanical block (inability to fully straighten due to torn meniscal fragment) versus pain inhibition or giving way (ligamentous insufficiency).",
        patient_question="Does the knee ever physically jam or catch so you cannot fully straighten it, or does it buckle and give way under you?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "NONE", "label": "None (No true locking or giving way)"},
                {"value": "TRUE_LOCKING", "label": "True Mechanical Locking (Knee locks rigidly, cannot straighten)"},
                {"value": "GIVING_WAY", "label": "Giving Way / Instability (Knee buckles unpredictably)"},
                {"value": "BOTH_LOCKING_AND_BUCKLING", "label": "Both Locking and Giving Way"}
            ]
        }
    ),

    # --- PHASE 3: COMPUTER VISION ACTIVE RANGE OF MOTION (AROM) ---
    ProtocolStepDef(
        step_id="AROM_FLEXION_EXTENSION",
        phase="ACTIVE_ROM",
        title="Active Knee Range of Motion (Sagittal Kinematic Analysis)",
        operator_instruction="Position the camera strictly in a 90° SAGITTAL (side-profile) view of the patient's affected leg, approximately 1.8 - 2.5 meters away. Have the patient seated upright on an examination bench or stable chair. Instruct patient to extend leg fully forward to 0°, hold for 1 second, then flex knee back underneath the chair as far as possible. Record video for 6 to 10 seconds.",
        patient_question="Please sit up straight sideways to the camera. Slowly straighten your affected leg all the way out, pause for a moment, then bend it back beneath you as far as you comfortably can.",
        action_type="VIDEO_MOVEMENT",
        input_config={
            "plane": "SAGITTAL",
            "target_joint": "KNEE",
            "camera_guidance": "Side-profile view. Ensure hip, knee, and ankle joints are visible without clothing obstruction.",
            "target_duration_sec": 8,
            "normal_ranges": {
                "terminal_extension_deg": 0.0,
                "maximum_flexion_deg": 135.0,
                "minimal_functional_rom": 110.0
            },
            "sample_clip_available": True
        }
    ),

    # --- PHASE 4: PROVOCATIVE / FUNCTIONAL BIOMECHANICS ---
    ProtocolStepDef(
        step_id="FUNCTIONAL_SQUAT",
        phase="FUNCTIONAL_TEST",
        title="Functional Weight-Bearing Biomechanics (Squat / Sit-to-Stand)",
        operator_instruction="Position camera in FRONTAL (coronal) view facing patient. Instruct patient to perform a controlled partial squat (or sit-to-stand from chair). MediaPipe analyzes medial dynamic knee valgus collapse, pelvic tilt asymmetry, and trunk compensation.",
        patient_question="Now stand facing the camera with feet shoulder-width apart. Perform a slow, controlled shallow squat to a comfortable depth, then stand back up.",
        action_type="VIDEO_MOVEMENT",
        input_config={
            "plane": "CORONAL",
            "target_joint": "KNEE_VALGUS",
            "camera_guidance": "Frontal view. Keep feet and torso in frame. Evaluate coronal alignment and dynamic valgus.",
            "target_duration_sec": 8,
            "normal_ranges": {
                "valgus_deviation_limit_deg": 8.0
            },
            "sample_clip_available": True
        }
    ),

    # --- PHASE 5: TARGETED PALPATION & TENDERNESS ---
    ProtocolStepDef(
        step_id="PALPATION_TENDERNESS",
        phase="PALPATION",
        title="Targeted Joint Palpation & Provocation Scoring",
        operator_instruction="Firmly palpate the patient's symptomatic zone (medial joint line, lateral joint line, or inferior patellar pole). Ask patient to rate pain on Numeric Rating Scale (0 to 10) and record any palpable swelling/crepitus.",
        patient_question="When that exact spot is pressed, how severe is the pain on a scale from 0 (no pain) to 10 (worst imaginable pain)?",
        action_type="PALPATION_SCORE",
        input_config={
            "min_value": 0,
            "max_value": 10,
            "unit": "NRS (0-10)",
            "severity_brackets": [
                {"range": [0, 2], "label": "Mild or Minimal tenderness"},
                {"range": [3, 6], "label": "Moderate focal tenderness"},
                {"range": [7, 10], "label": "Severe focal tenderness / Antalgic withdrawal"}
            ]
        }
    )
]
