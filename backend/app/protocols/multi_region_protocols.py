from typing import List, Dict
from app.protocols.base import ProtocolStepDef
from app.protocols.knee_protocol import KNEE_EXAMINATION_PROTOCOL

# --- SHOULDER PROTOCOL (Rotator Cuff, Impingement, AROM) ---
SHOULDER_EXAMINATION_PROTOCOL: List[ProtocolStepDef] = [
    ProtocolStepDef(
        step_id="RED_FLAG_SHOULDER_TRAUMA",
        phase="RED_FLAGS",
        title="Shoulder Acute Dislocation & Neurovascular Screen",
        operator_instruction="Inspect for prominent acromion shelf or 'squared-off' shoulder indicative of anterior dislocation. Check axillary nerve sensation over lateral deltoid badge area and radial pulse.",
        patient_question="Did you have a high-impact fall or yank injury, is your shoulder visibly popped out of place, or do you have numbness over the outside of your shoulder?",
        patient_question_hi="क्या आपको कंधे पर कोई तेज चोट या झटका लगा है, कंधा अपनी जगह से उतर गया है या बाजू के बाहर सुन्नपन लग रहा है?",
        action_type="QUESTION_BOOLEAN",
        input_config={"guidance": "Gross deformity or deltoid sensory loss indicates acute glenohumeral dislocation or axillary neuropraxia."},
        is_red_flag=True,
        abort_on_true=True,
        red_flag_alert_reason="Suspected acute shoulder dislocation or axillary nerve neuropraxia. Urgent orthopedic reduction required.",
        urgency_level="EMERGENCY_IMMEDIATE"
    ),
    ProtocolStepDef(
        step_id="SHOULDER_LOCALIZATION",
        phase="LOCALIZATION",
        title="Shoulder Pain Epicenter Localization",
        operator_instruction="Instruct patient to point to where the shoulder pain originates.",
        patient_question="Where is the shoulder pain most intense? (Top of shoulder, deep anterior groove, outside deltoid, or behind scapula)?",
        patient_question_hi="कंधे में सबसे तेज दर्द कहां महसूस होता है? (कंधे के ऊपर, आगे वाली नस में, बाजू के बाहर, या पीछे की हड्डी पर)?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "SUBACROMIAL_DELTOID", "label": "Subacromial / Anterolateral Deltoid (Rotator Cuff / Subacromial Bursitis)", "zone": "SUBACROMIAL", "mesh_pin": {"x": 0.95, "y": 1.15, "z": 0.05}},
                {"value": "AC_JOINT_SUPERIOR", "label": "Top of Shoulder / AC Joint (Acromioclavicular Joint Arthrosis / Separation)", "zone": "AC_JOINT", "mesh_pin": {"x": 0.85, "y": 1.25, "z": 0.0}},
                {"value": "BICIPITAL_GROOVE", "label": "Front Anterior Groove (Biceps Long Head Tendinopathy)", "zone": "BICIPITAL_GROOVE", "mesh_pin": {"x": 0.90, "y": 1.10, "z": 0.10}},
                {"value": "POSTERIOR_SCAPULAR", "label": "Posterior / Periscapular (Infraspinatus / Myofascial Trigger)", "zone": "POSTERIOR_SCAPULAR", "mesh_pin": {"x": 0.90, "y": 1.15, "z": -0.10}}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="AROM_SHOULDER_FLEXION",
        phase="ACTIVE_ROM",
        title="Active Shoulder Flexion & Abduction Kinematics",
        operator_instruction="Position camera 2 meters away in coronal/sagittal view. Instruct patient to raise affected arm forward and upwards toward ceiling (0° to 180°), then lower smoothly. MediaPipe tracks Hip-Shoulder-Elbow angle.",
        patient_question="Please raise your affected arm all the way forward and up towards the sky as high as you comfortably can, hold for 1 second, then lower it slowly.",
        patient_question_hi="कृपया अपने दर्द वाले हाथ को आगे से ऊपर आसमान की तरफ जितना हो सके पूरा उठाएं, एक सेकंड रोकें, फिर धीरे-धीरे नीचे लाएं।",
        action_type="VIDEO_MOVEMENT",
        input_config={
            "plane": "CORONAL_SAGITTAL",
            "target_joint": "SHOULDER",
            "normal_ranges": {"maximum_elevation_deg": 180.0, "normal_abduction_deg": 170.0},
            "target_duration_sec": 8,
            "sample_clip_available": True
        }
    ),
    ProtocolStepDef(
        step_id="SHOULDER_IMPINGEMENT_TEST",
        phase="FUNCTIONAL_TEST",
        title="Subacromial Impingement Screen (Painful Arc)",
        operator_instruction="Assess if patient experienced sharp pain specifically between 60° and 120° of abduction (painful arc) or sudden arm drop (rotator cuff full-thickness tear).",
        patient_question="Did your shoulder catch or feel sharp pain in the mid-range of lifting your arm (around shoulder height), or did the arm give way and drop?",
        patient_question_hi="हाथ ऊपर उठाते समय क्या कंधे की ऊंचाई पर बीच में तेज झटका या दर्द होता है, या हाथ कमजोरी से अचानक नीचे गिर जाता है?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "NO_PAINFUL_ARC", "label": "No (Smooth movement without mid-arc pain)"},
                {"value": "POSITIVE_PAINFUL_ARC_60_120", "label": "Yes: Classic Painful Arc (Sharp pain between 60° and 120°)"},
                {"value": "DROP_ARM_POSITIVE", "label": "Yes: Drop Arm Sign (Arm falls uncontrollably, cannot hold)"}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="SHOULDER_PALPATION",
        phase="PALPATION",
        title="Targeted Shoulder Palpation (AC Joint & Biceps Groove)",
        operator_instruction="Firmly palpate the subacromial space, bicipital groove, and acromioclavicular (AC) joint. Record pain on 0-10 NRS scale.",
        patient_question="When that exact spot on your shoulder is pressed, how severe is the pain from 0 to 10?",
        patient_question_hi="जब कंधे के उस खास दर्द वाले बिंदु पर उंगली से दबाया जाता है, तो 0 से 10 तक कितना दर्द होता है?",
        action_type="PALPATION_SCORE",
        input_config={"min_value": 0, "max_value": 10, "unit": "NRS (0-10)"}
    )
]

# --- ELBOW PROTOCOL (Tennis/Golfer's Elbow, Flexion/Extension) ---
ELBOW_EXAMINATION_PROTOCOL: List[ProtocolStepDef] = [
    ProtocolStepDef(
        step_id="RED_FLAG_ELBOW_TRAUMA",
        phase="RED_FLAGS",
        title="Elbow Supracondylar Fracture & Ischemia Screen",
        operator_instruction="Check for gross joint dislocation, marked rapid hematoma, cold fingers, or absent radial pulse (Volkmann's ischemic contracture risk).",
        patient_question="Did you have severe trauma, is your elbow deformed, or do your fingers feel cold, numb, or turning pale?",
        patient_question_hi="क्या कोहनी में कोई गंभीर चोट लगी है, कोहनी मुड़ गई है, या हाथ की उंगलियां ठंडी, सुन्न और सफेद पड़ रही हैं?",
        action_type="QUESTION_BOOLEAN",
        input_config={"guidance": "Elbow trauma with distal pulse absence requires emergency surgical assessment."},
        is_red_flag=True,
        abort_on_true=True,
        red_flag_alert_reason="Suspected acute elbow fracture/dislocation with potential brachial artery compromise.",
        urgency_level="EMERGENCY_IMMEDIATE"
    ),
    ProtocolStepDef(
        step_id="ELBOW_LOCALIZATION",
        phase="LOCALIZATION",
        title="Elbow Pain Epicenter Localization",
        operator_instruction="Instruct patient to point to epicenter of elbow pain.",
        patient_question="Is the pain located on the outside bone, inside bone, or the tip of the elbow?",
        patient_question_hi="दर्द कोहनी की बाहर वाली हड्डी पर है, अंदर की हड्डी पर, या कोहनी की पीछे वाली नोक पर?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "LATERAL_EPICONDYLE", "label": "Lateral / Outside Bone (Tennis Elbow - Lateral Epicondylalgia)", "zone": "LATERAL_EPICONDYLE", "mesh_pin": {"x": 0.88, "y": 0.50, "z": 0.05}},
                {"value": "MEDIAL_EPICONDYLE", "label": "Medial / Inside Bone (Golfer's Elbow - Medial Epicondylalgia)", "zone": "MEDIAL_EPICONDYLE", "mesh_pin": {"x": 0.82, "y": 0.50, "z": 0.05}},
                {"value": "POSTERIOR_OLECRANON", "label": "Posterior Tip (Olecranon Bursitis / Triceps Tendon)", "zone": "OLECRANON", "mesh_pin": {"x": 0.85, "y": 0.50, "z": -0.08}}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="AROM_ELBOW_FLEXION",
        phase="ACTIVE_ROM",
        title="Active Elbow Flexion & Extension Kinematics",
        operator_instruction="Position camera in sagittal view of affected arm. Have patient fully straighten elbow to 0°, then bend completely to touch shoulder (~145°). MediaPipe tracks Shoulder-Elbow-Wrist angle.",
        patient_question="Please straighten your arm completely out in front of you, then bend your elbow and touch your hand to your shoulder.",
        patient_question_hi="कृपया अपने हाथ को पूरा सीधा आगे फैलाएं, फिर कोहनी को मोड़कर अपने हाथ से कंधे को छूने की कोशिश करें।",
        action_type="VIDEO_MOVEMENT",
        input_config={
            "plane": "SAGITTAL",
            "target_joint": "ELBOW",
            "normal_ranges": {"terminal_extension_deg": 0.0, "maximum_flexion_deg": 145.0},
            "target_duration_sec": 8,
            "sample_clip_available": True
        }
    ),
    ProtocolStepDef(
        step_id="ELBOW_RESISTED_TEST",
        phase="FUNCTIONAL_TEST",
        title="Resisted Wrist Extension Test (Cozen's Sign for Tennis Elbow)",
        operator_instruction="Have patient make a fist, extend wrist upward, and resist operator downward pressure. Ask if sharp pain shoots to lateral epicondyle.",
        patient_question="When you make a fist, bend your wrist backwards, and push up against resistance, does pain shoot into your elbow?",
        patient_question_hi="जब आप मुट्ठी बांधकर कलाई को पीछे की तरफ मोड़ते हैं, तो क्या कोहनी की हड्डी में तेज दर्द का झटका लगता है?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "NEGATIVE", "label": "No (No localized elbow pain on resisted wrist extension)"},
                {"value": "POSITIVE_LATERAL_PAIN", "label": "Yes (Sharp localized pain over lateral epicondyle - Positive Tennis Elbow)"},
                {"value": "POSITIVE_MEDIAL_PAIN", "label": "Yes (Pain over medial epicondyle on resisted flexion - Positive Golfer's Elbow)"}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="ELBOW_PALPATION",
        phase="PALPATION",
        title="Targeted Epicondylar Palpation",
        operator_instruction="Directly palpate 1-2 cm distal to lateral or medial epicondyle. Rate tenderness on 0-10 NRS scale.",
        patient_question="On a scale from 0 to 10, how tender is that exact elbow bone when pressed?",
        patient_question_hi="कोहनी की उस हड्डी या जोड़ को दबाने पर 0 से 10 के बीच कितना दर्द महसूस होता है?",
        action_type="PALPATION_SCORE",
        input_config={"min_value": 0, "max_value": 10, "unit": "NRS (0-10)"}
    )
]

# --- WRIST & HAND PROTOCOL (Carpal Tunnel, Sprain, De Quervain's) ---
WRIST_EXAMINATION_PROTOCOL: List[ProtocolStepDef] = [
    ProtocolStepDef(
        step_id="RED_FLAG_WRIST_TRAUMA",
        phase="RED_FLAGS",
        title="Scaphoid Fracture & Acute Carpal Deformity Screen",
        operator_instruction="Check for FOOSH injury (fall onto outstretched hand), acute anatomical snuffbox tenderness, or wrist 'dinner-fork' deformity (Colles' fracture).",
        patient_question="Did you have a hard fall onto your outstretched hand, is your wrist visibly crooked, or is it agonizing to press the hollow space below your thumb?",
        patient_question_hi="क्या आप हाथ के बल जमीन पर गिरे थे, कलाई टेढ़ी दिख रही है, या अंगूठे के नीचे वाले गड्ढे में तेज असहनीय दर्द है?",
        action_type="QUESTION_BOOLEAN",
        input_config={"guidance": "High risk for occult scaphoid fracture with avascular necrosis risk. Radiographs required."},
        is_red_flag=True,
        abort_on_true=True,
        red_flag_alert_reason="High index of suspicion for scaphoid or distal radius fracture following FOOSH trauma.",
        urgency_level="EMERGENCY_IMMEDIATE"
    ),
    ProtocolStepDef(
        step_id="WRIST_LOCALIZATION",
        phase="LOCALIZATION",
        title="Wrist / Hand Symptom Epicenter Localization",
        operator_instruction="Have patient identify primary discomfort zone.",
        patient_question="Where is the pain or numbness located in your wrist or hand?",
        patient_question_hi="कलाई या हाथ में दर्द और सुन्नपन कहां पर है? (हथेली और उंगलियों में, अंगूठे की जड़ में, या छोटी उंगली की तरफ)?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "VOLAR_CARPAL_TUNNEL", "label": "Palm Side / Fingers 1-3 (Carpal Tunnel - Median Nerve)", "zone": "CARPAL_TUNNEL", "mesh_pin": {"x": 0.85, "y": 0.10, "z": 0.05}},
                {"value": "RADIAL_STYLOID", "label": "Base of Thumb / Radial Styloid (De Quervain's Tenosynovitis)", "zone": "RADIAL_STYLOID", "mesh_pin": {"x": 0.88, "y": 0.12, "z": 0.02}},
                {"value": "ULNAR_TFCC", "label": "Pinky Side / Ulnar Wrist (TFCC Tear / Ulnar Impaction)", "zone": "ULNAR_TFCC", "mesh_pin": {"x": 0.80, "y": 0.10, "z": 0.02}}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="AROM_WRIST_FLEXION",
        phase="ACTIVE_ROM",
        title="Active Wrist Flexion & Extension Kinematics",
        operator_instruction="Position camera to capture lateral view of wrist and hand. Instruct patient to bend wrist downward (flexion: ~80°) and upward (extension: ~70°).",
        patient_question="Please hold your arm steady, bend your wrist all the way down, then bend it all the way up.",
        patient_question_hi="कृपया अपनी कलाई को पहले पूरा नीचे की तरफ मोड़ें, फिर पूरा ऊपर आसमान की तरफ मोड़ें।",
        action_type="VIDEO_MOVEMENT",
        input_config={
            "plane": "SAGITTAL",
            "target_joint": "WRIST",
            "normal_ranges": {"flexion_deg": 80.0, "extension_deg": 70.0},
            "target_duration_sec": 8,
            "sample_clip_available": True
        }
    ),
    ProtocolStepDef(
        step_id="WRIST_PHALENS_TEST",
        phase="FUNCTIONAL_TEST",
        title="Phalen's Maneuver (Carpal Tunnel Provocation)",
        operator_instruction="Instruct patient to place backs of both hands together with wrists flexed at 90° for 60 seconds. Note tingling or burning in thumb, index, or middle finger.",
        patient_question="When you hold the backs of your hands together with wrists bent down for 30-60 seconds, do your fingers tingle or go numb?",
        patient_question_hi="जब दोनों हाथों के पिछले हिस्सों को मिलाकर कलाई को 30 से 60 सेकंड मोड़कर रखते हैं, तो क्या उंगलियों में झनझनाहट या सुन्नपन आता है?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "NEGATIVE", "label": "No (No tingling or paresthesia)"},
                {"value": "POSITIVE_MEDIAN_TINGLING", "label": "Yes (Tingling / numbness in thumb, index, and middle finger - Positive Phalen's)"}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="WRIST_PALPATION",
        phase="PALPATION",
        title="Targeted Palpation & Grip Tenderness",
        operator_instruction="Palpate carpal tunnel, radial styloid, or snuffbox. Rate tenderness on 0-10 scale.",
        patient_question="Rate the pain when that specific tendon or wrist point is pressed from 0 to 10.",
        patient_question_hi="कलाई के उस खास बिंदु या नस पर दबाने पर 0 से 10 तक कितना दर्द होता है?",
        action_type="PALPATION_SCORE",
        input_config={"min_value": 0, "max_value": 10, "unit": "NRS (0-10)"}
    )
]

# --- HIP PROTOCOL (Labral Tear, Impingement, Osteoarthritis, Gait Walk) ---
HIP_EXAMINATION_PROTOCOL: List[ProtocolStepDef] = [
    ProtocolStepDef(
        step_id="RED_FLAG_HIP_TRAUMA",
        phase="RED_FLAGS",
        title="Hip Femoral Neck Fracture & Avascular Necrosis Screen",
        operator_instruction="Assess for acute fall, completely unable to bear weight, or shortened and externally rotated leg (classic femoral neck fracture presentation).",
        patient_question="Did you suffer a fall, are you unable to stand on this leg, or does the leg turn outward and look shorter?",
        patient_question_hi="क्या आप गिर गए थे, क्या आप इस पैर पर बिल्कुल खड़े नहीं हो पा रहे हैं, या पैर बाहर की तरफ घूमकर छोटा लग रहा है?",
        action_type="QUESTION_BOOLEAN",
        input_config={"guidance": "Elderly fall with inability to bear weight is a femoral neck fracture until proven otherwise."},
        is_red_flag=True,
        abort_on_true=True,
        red_flag_alert_reason="Suspected acute femoral neck / intertrochanteric fracture. Emergency radiographic triage required.",
        urgency_level="EMERGENCY_IMMEDIATE"
    ),
    ProtocolStepDef(
        step_id="HIP_LOCALIZATION",
        phase="LOCALIZATION",
        title="Hip Pain Epicenter Localization (C-Sign vs. Lateral)",
        operator_instruction="Ask patient to cup their hip with thumb and fingers (classic 'C-sign' for deep intra-articular hip pathology) vs. pointing to lateral greater trochanter.",
        patient_question="Do you feel deep groin pain cupped in the front/inside of your hip, or is it on the outside side bone when lying in bed?",
        patient_question_hi="क्या आपको जांघ के आगे अंदरूनी हिस्से (ग्रोइन) में गहरा दर्द है, या रात में करवट लेते समय बाहर कूल्हे की हड्डी पर?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "ANTERIOR_GROIN_C_SIGN", "label": "Deep Anterior Groin / 'C-Sign' (Hip Labral Tear / Femoroacetabular Impingement / OA)", "zone": "ANTERIOR_HIP", "mesh_pin": {"x": 0.45, "y": 0.15, "z": 0.08}},
                {"value": "LATERAL_TROCHANTERIC", "label": "Lateral Outside Bone (Greater Trochanteric Pain Syndrome / Gluteal Tendinopathy)", "zone": "LATERAL_TROCHANTER", "mesh_pin": {"x": 0.52, "y": 0.12, "z": 0.0}},
                {"value": "POSTERIOR_BUTTOCK", "label": "Deep Buttock / Sacroiliac (Piriformis Syndrome / Lumbar Radiculopathy)", "zone": "POSTERIOR_HIP", "mesh_pin": {"x": 0.45, "y": 0.15, "z": -0.10}}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="AROM_HIP_FLEXION",
        phase="ACTIVE_ROM",
        title="Active Hip Flexion & Abduction Kinematics",
        operator_instruction="Position camera in sagittal view. Have patient lift knee toward chest as high as possible while seated or standing. MediaPipe tracks Shoulder-Hip-Knee angle.",
        patient_question="Please stand or sit up straight and lift your affected knee straight up toward your chest as high as comfortable.",
        patient_question_hi="कृपया सीधे खड़े होकर या बैठकर अपने दर्द वाले घुटने को ऊपर छाती की तरफ जितना हो सके ऊंचा उठाएं।",
        action_type="VIDEO_MOVEMENT",
        input_config={
            "plane": "SAGITTAL",
            "target_joint": "HIP",
            "normal_ranges": {"maximum_flexion_deg": 120.0},
            "target_duration_sec": 8,
            "sample_clip_available": True
        }
    ),
    ProtocolStepDef(
        step_id="HIP_TRENDELENBURG_TEST",
        phase="FUNCTIONAL_TEST",
        title="Trendelenburg Single-Leg Stance Test (Abductor Weakness)",
        operator_instruction="Have patient stand on affected leg alone for 10 seconds. Observe whether the contralateral pelvis drops downwards (gluteus medius abductor weakness).",
        patient_question="Can you balance safely on only your painful leg for 10 seconds without your hips dropping or holding on?",
        patient_question_hi="क्या आप बिना सहारा लिए सिर्फ अपने दर्द वाले पैर पर 10 सेकंड तक संतुलन बनाकर खड़े रह सकते हैं?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "NORMAL_STABLE", "label": "Normal (Pelvis remains level and stable)"},
                {"value": "POSITIVE_PELVIC_DROP", "label": "Positive Trendelenburg (Contralateral pelvis drops downward / Gluteus medius deficit)"}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="HIP_GAIT_WALK_ANALYSIS",
        phase="FUNCTIONAL_TEST",
        title="Dynamic Functional Gait & Walking Kinematics",
        operator_instruction="Position camera 2.5-3.0 meters away. Instruct patient to walk 4-6 paces forward towards the camera and back. MediaPipe tracks bilateral pelvic obliquity, step symmetry, and antalgic hesitation.",
        patient_question="Please walk 4 to 6 steps forward naturally toward the camera, turn around smoothly, and walk back.",
        patient_question_hi="कृपया कैमरे की तरफ सामान्य रूप से 4 से 6 कदम चलकर आगे आएं, फिर आराम से घूमकर वापस जाएं।",
        action_type="VIDEO_MOVEMENT",
        input_config={
            "plane": "CORONAL",
            "target_joint": "HIP_GAIT",
            "normal_ranges": {"pelvic_tilt_asymmetry_deg": 4.0},
            "target_duration_sec": 8,
            "sample_clip_available": True
        }
    ),
    ProtocolStepDef(
        step_id="HIP_PALPATION",
        phase="PALPATION",
        title="Targeted Greater Trochanteric Palpation",
        operator_instruction="Palpate direct lateral prominence of greater trochanter. Rate tenderness on 0-10 scale.",
        patient_question="When direct firm pressure is applied to that outside hip bone, what is the pain score from 0 to 10?",
        patient_question_hi="जब कूल्हे की बाहर वाली उभरी हुई हड्डी पर सीधा दबाव दिया जाता है, तो 0 से 10 तक कितना दर्द होता है?",
        action_type="PALPATION_SCORE",
        input_config={"min_value": 0, "max_value": 10, "unit": "NRS (0-10)"}
    )
]

# --- ANKLE & FOOT PROTOCOL (Ottawa Ankle Rules, Sprain, Achilles) ---
ANKLE_EXAMINATION_PROTOCOL: List[ProtocolStepDef] = [
    ProtocolStepDef(
        step_id="RED_FLAG_ANKLE_OTTAWA",
        phase="RED_FLAGS",
        title="Ottawa Ankle Rules: Acute Malleolar Fracture Screen",
        operator_instruction="Apply Ottawa Ankle Rules: Bone tenderness along posterior 6cm of lateral or medial malleolus AND complete inability to bear weight for 4 steps.",
        patient_question="Did you roll/injure your ankle, is bone tender along the back of the ankle bone, and are you completely unable to take 4 steps?",
        patient_question_hi="क्या टखना मुड़ गया है, टखने की हड्डी पर तेज दर्द है और क्या आप इस पैर पर 4 कदम भी नहीं चल पा रहे हैं?",
        action_type="QUESTION_BOOLEAN",
        input_config={"guidance": "Ottawa Ankle Rule positive indicates high likelihood of malleolar or syndesmotic fracture. X-rays mandated."},
        is_red_flag=True,
        abort_on_true=True,
        red_flag_alert_reason="Ottawa Ankle Rule positive: Bone tenderness with weight-bearing inability. Malleolar fracture triage required.",
        urgency_level="EMERGENCY_IMMEDIATE"
    ),
    ProtocolStepDef(
        step_id="ANKLE_LOCALIZATION",
        phase="LOCALIZATION",
        title="Ankle / Foot Symptom Epicenter Localization",
        operator_instruction="Have patient indicate exact pain location.",
        patient_question="Where is the ankle pain worst? (Outside ligament, inside, back Achilles tendon, or bottom heel)?",
        patient_question_hi="टखने में सबसे ज्यादा दर्द कहां है? (बाहर की तरफ, अंदर की तरफ, पीछे एड़ी की नस में, या पैर के तलवे में)?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "LATERAL_ATFL", "label": "Anterolateral (Anterior Talofibular Ligament - Inversion Ankle Sprain)", "zone": "ATFL", "mesh_pin": {"x": 0.48, "y": -1.55, "z": 0.12}},
                {"value": "MEDIAL_DELTOID", "label": "Medial Deltoid Ligament (Eversion Sprain)", "zone": "DELTOID", "mesh_pin": {"x": 0.40, "y": -1.55, "z": 0.10}},
                {"value": "POSTERIOR_ACHILLES", "label": "Posterior Heel / Achilles Tendon (Achilles Tendinopathy / Partial Tear)", "zone": "ACHILLES", "mesh_pin": {"x": 0.45, "y": -1.50, "z": -0.05}},
                {"value": "PLANTAR_HEEL", "label": "Bottom of Heel (Plantar Fasciitis)", "zone": "PLANTAR", "mesh_pin": {"x": 0.45, "y": -1.60, "z": 0.05}}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="AROM_ANKLE_DORSIFLEXION",
        phase="ACTIVE_ROM",
        title="Active Ankle Dorsiflexion & Plantarflexion Kinematics",
        operator_instruction="Position camera at ankle level in sagittal view. Have patient point toes up toward ceiling (dorsiflexion: ~20°), then point toes down like pressing gas pedal (plantarflexion: ~50°). MediaPipe tracks Knee-Ankle-FootIndex angle.",
        patient_question="Please point your toes up toward your nose as far as possible, then point them all the way down toward the floor.",
        patient_question_hi="कृपया अपने पंजे को पूरा ऊपर अपने मुंह की तरफ उठाएं, फिर पूरा नीचे फर्श की तरफ तानें।",
        action_type="VIDEO_MOVEMENT",
        input_config={
            "plane": "SAGITTAL",
            "target_joint": "ANKLE",
            "normal_ranges": {"dorsiflexion_deg": 20.0, "plantarflexion_deg": 50.0},
            "target_duration_sec": 8,
            "sample_clip_available": True
        }
    ),
    ProtocolStepDef(
        step_id="ANKLE_THOMPSON_TEST",
        phase="FUNCTIONAL_TEST",
        title="Achilles Integrity / Thompson Squeeze Screen",
        operator_instruction="Inquire if patient heard an audible 'snap/pop' like getting kicked in the calf, or if they cannot perform a single-leg heel raise.",
        patient_question="Did you feel a sudden pop like being kicked in the back of the calf, and are you unable to push up onto your tiptoes on this foot?",
        patient_question_hi="क्या पीछे पिंडली में अचानक जोर से चटकने की आवाज आई थी और क्या आप पंजे के बल खड़े होने में असमर्थ हैं?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "NEGATIVE_HEEL_RAISE_NORMAL", "label": "No (Can perform heel raise, Achilles intact)"},
                {"value": "POSITIVE_ACHILLES_TEAR_SUSPICION", "label": "Yes (Audible pop, inability to push off into plantarflexion - Suspected Achilles Rupture)"}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="ANKLE_PALPATION",
        phase="PALPATION",
        title="Targeted Ligamentous Palpation",
        operator_instruction="Palpate ATFL, CFL, and Achilles insertion. Rate tenderness on 0-10 NRS scale.",
        patient_question="On a scale from 0 to 10, how painful is firm pressure over that ligament?",
        patient_question_hi="टखने के उस खास जोड़ या नस पर दबाने पर 0 से 10 के बीच कितना दर्द है?",
        action_type="PALPATION_SCORE",
        input_config={"min_value": 0, "max_value": 10, "unit": "NRS (0-10)"}
    )
]

# --- LUMBAR SPINE PROTOCOL (Cauda Equina Red Flag, Sciatica, Radiculopathy, Bending) ---
LUMBAR_SPINE_EXAMINATION_PROTOCOL: List[ProtocolStepDef] = [
    ProtocolStepDef(
        step_id="RED_FLAG_CAUDA_EQUINA",
        phase="RED_FLAGS",
        title="Cauda Equina Syndrome & Cord Compression Emergency Screen",
        operator_instruction="URGENT: Ask about saddle anesthesia (numbness in groin, perianal, or inner thighs), recent bowel or bladder incontinence, or acute bilateral leg weakness.",
        patient_question="Do you have numbness around your groin or buttocks (where you sit on a saddle), loss of control of your bowel/bladder, or severe weakness in both legs?",
        patient_question_hi="क्या आपके जांघों के बीच या शौच वाली जगह पर सुन्नपन है, पेशाब-पाखाने पर से नियंत्रण छूट रहा है, या दोनों पैरों में भारी कमजोरी है?",
        action_type="QUESTION_BOOLEAN",
        input_config={"guidance": "Saddle anesthesia or bowel/bladder sphincter disturbance represents a neurosurgical emergency (Cauda Equina Syndrome)."},
        is_red_flag=True,
        abort_on_true=True,
        red_flag_alert_reason="Cauda Equina Syndrome signs present (saddle anesthesia / bowel/bladder sphincter dysfunction). Urgent emergent neurosurgical decompression needed within 24h.",
        urgency_level="EMERGENCY_IMMEDIATE"
    ),
    ProtocolStepDef(
        step_id="LUMBAR_LOCALIZATION",
        phase="LOCALIZATION",
        title="Spine Pain Distribution & Radiation",
        operator_instruction="Differentiate axial mechanical back pain from radicular pain radiating below the knee (sciatica).",
        patient_question="Does the pain stay in your low back, or does sharp electric shooting pain travel down your leg past the knee?",
        patient_question_hi="क्या दर्द केवल कमर के निचले हिस्से में रहता है, या करंट की तरह नीचे पैर और घुटने से नीचे तक दौड़ता है?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "AXIAL_LOW_BACK", "label": "Axial Lower Back Only (Musculoskeletal / Facet Arthropathy / Spondylosis)", "zone": "LUMBAR_AXIAL", "mesh_pin": {"x": 0.0, "y": 0.45, "z": -0.05}},
                {"value": "RADICULAR_SCIATICA_BELOW_KNEE", "label": "Radicular Shooting Down Leg Below Knee (L4/L5/S1 Nerve Root Impingement / Herniated Disc)", "zone": "SCIATIC_RADICULAR", "mesh_pin": {"x": 0.15, "y": 0.40, "z": -0.05}},
                {"value": "SACROILIAC_JOINT", "label": "Sacroiliac (SI) Joint Epicenter (Sacroiliitis / Pelvic Torsion)", "zone": "SI_JOINT", "mesh_pin": {"x": -0.15, "y": 0.35, "z": -0.05}}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="AROM_LUMBAR_FLEXION",
        phase="ACTIVE_ROM",
        title="Active Lumbar Flexion & Spinal Range of Motion",
        operator_instruction="Position camera in sagittal view. Have patient stand with knees straight, bend forward smoothly to touch toes as far as comfortable, then return upright. MediaPipe tracks trunk inclination angle.",
        patient_question="Please stand with your knees straight and bend forward toward your toes as far as you comfortably can, then stand back up.",
        patient_question_hi="कृपया दोनों घुटनों को सीधा रखकर धीरे-धीरे नीचे झुकें और अपने पैर के अंगूठे को छूने की कोशिश करें, फिर धीरे से वापस सीधे खड़े हो जाएं।",
        action_type="VIDEO_MOVEMENT",
        input_config={
            "plane": "SAGITTAL",
            "target_joint": "SPINE",
            "normal_ranges": {"flexion_deg": 60.0},
            "target_duration_sec": 8,
            "sample_clip_available": True
        }
    ),
    ProtocolStepDef(
        step_id="LUMBAR_STRAIGHT_LEG_RAISE",
        phase="FUNCTIONAL_TEST",
        title="Straight Leg Raise (Lasegue's Test for Sciatic Nerve Tension)",
        operator_instruction="In supine position, passively raise affected leg with knee straight. Positive if sharp shooting radicular pain reproduced between 30° and 70°.",
        patient_question="When the leg is lifted straight up while lying down, does sharp electric pain shoot past your knee into your foot?",
        patient_question_hi="जब सीधे लेटकर पैर को बिना मोड़े ऊपर उठाया जाता है, तो क्या कमर से पैर तक बिजली जैसा तेज दर्द दौड़ता है?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "NEGATIVE_NO_RADIATION", "label": "Negative (Only tight hamstrings, no electric shooting pain down leg)"},
                {"value": "POSITIVE_RADICULAR_REPRODUCTION", "label": "Positive Lasegue (Sharp radicular electric pain shoots down leg past knee between 30°-70°)"}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="LUMBAR_PALPATION",
        phase="PALPATION",
        title="Paraspinal & Spinous Process Palpation",
        operator_instruction="Palpate midline spinous processes for focal bone tenderness and paraspinal muscles for spasm. Rate tenderness on 0-10 scale.",
        patient_question="When firm pressure is applied to the spine and muscles in your lower back, what is the pain score from 0 to 10?",
        patient_question_hi="जब कमर की रीढ़ की हड्डी और मांसपेशियों को दबाया जाता है, तो 0 से 10 तक कितना दर्द महसूस होता है?",
        action_type="PALPATION_SCORE",
        input_config={"min_value": 0, "max_value": 10, "unit": "NRS (0-10)"}
    )
]

# --- CERVICAL SPINE PROTOCOL (Cervical Radiculopathy, Myelopathy, Neck Pain) ---
CERVICAL_SPINE_EXAMINATION_PROTOCOL: List[ProtocolStepDef] = [
    ProtocolStepDef(
        step_id="RED_FLAG_CERVICAL_MYELOPATHY",
        phase="RED_FLAGS",
        title="Cervical Spondylotic Myelopathy & Cord Compression Screen",
        operator_instruction="Assess for upper motor neuron signs: progressive loss of hand dexterity (difficulty buttoning shirts/dropping keys), gait unsteadiness/ataxia, or electric shock sensation down spine on neck flexion (Lhermitte's sign).",
        patient_question="Do you have severe clumsiness in your hands, trouble walking steadily, or an electric shock shooting down your back when bending your neck?",
        patient_question_hi="क्या आपके हाथों से चीजें छूट रही हैं, शर्ट का बटन लगाने में दिक्कत हो रही है, या चलने में संतुलन लड़खड़ा रहा है?",
        action_type="QUESTION_BOOLEAN",
        input_config={"guidance": "Gait ataxia or hand clumsiness indicates spinal cord compression (cervical myelopathy). Immediate neurosurgical referral."},
        is_red_flag=True,
        abort_on_true=True,
        red_flag_alert_reason="Cervical myelopathy / spinal cord compression signs detected (ataxia, progressive upper limb dexterity loss). Urgent neurosurgical decompression consultation required.",
        urgency_level="EMERGENCY_IMMEDIATE"
    ),
    ProtocolStepDef(
        step_id="CERVICAL_LOCALIZATION",
        phase="LOCALIZATION",
        title="Neck & Radiation Epicenter Localization",
        operator_instruction="Determine if pain is axial neck / trapezial muscle strain vs. radicular dermatomal shooting pain down arm/hand.",
        patient_question="Does the pain stay in your neck and shoulder blades, or does sharp numbness or electric shooting pain travel down your arm into your fingers?",
        patient_question_hi="क्या दर्द केवल गर्दन और कंधों में रहता है, या करंट और सुन्नपन की तरह हाथ से होकर उंगलियों तक जाता है?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "AXIAL_CERVICAL", "label": "Axial Neck / Upper Trapezius (Muscular Strain / Facet Arthropathy)", "zone": "CERVICAL_AXIAL", "mesh_pin": {"x": 0.0, "y": 0.70, "z": -0.05}},
                {"value": "RADICULAR_BRACHIAL_ARM", "label": "Radicular Shooting Down Arm to Fingers (C6/C7 Nerve Root Impingement / Disc Herniation)", "zone": "CERVICAL_RADICULAR", "mesh_pin": {"x": 0.20, "y": 0.60, "z": -0.02}},
                {"value": "SUBOCCIPITAL_HEADACHE", "label": "Base of Skull / Suboccipital (Cervicogenic Headache / Greater Occipital Nerve)", "zone": "SUBOCCIPITAL", "mesh_pin": {"x": 0.0, "y": 0.85, "z": -0.08}}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="AROM_CERVICAL_FLEXION_ROTATION",
        phase="ACTIVE_ROM",
        title="Active Cervical Flexion & Rotation Kinematics",
        operator_instruction="Position camera at head level in sagittal/coronal view. Instruct patient to slowly tuck chin down to chest (flexion: ~50°), tilt head back to look at ceiling (extension: ~60°), and rotate chin to each shoulder (~80°).",
        patient_question="Please sit up straight, gently bring your chin all the way down to touch your chest, look back up to the ceiling, then turn your head smoothly to look over each shoulder.",
        patient_question_hi="कृपया अपनी ठुड्डी को नीचे छाती से लगाएं, फिर ऊपर छत की तरफ देखें, और फिर धीरे-धीरे दोनों तरफ गर्दन घुमाकर देखें।",
        action_type="VIDEO_MOVEMENT",
        input_config={
            "plane": "SAGITTAL",
            "target_joint": "CERVICAL",
            "normal_ranges": {"flexion_deg": 50.0, "extension_deg": 60.0, "rotation_deg": 80.0},
            "target_duration_sec": 8,
            "sample_clip_available": True
        }
    ),
    ProtocolStepDef(
        step_id="CERVICAL_SPURLING_TEST",
        phase="FUNCTIONAL_TEST",
        title="Spurling's Maneuver (Cervical Foraminal Compression)",
        operator_instruction="Instruct patient to gently tilt head laterally toward the symptomatic side with slight extension. Inquire if this reproduces sharp radiating pain down the ipsilateral arm.",
        patient_question="When you tilt your head sideways toward your painful shoulder and look slightly back, does sharp pain or tingling shoot down your arm?",
        patient_question_hi="गर्दन को दर्द वाले कंधे की तरफ थोड़ा झुकाने पर क्या बाजू में करंट या झनझनाहट जैसी तेज पीड़ा होती है?",
        action_type="QUESTION_CHOICE",
        input_config={
            "choices": [
                {"value": "NEGATIVE_LOCAL_STIFFNESS", "label": "No (Only mild local neck tightness, no shooting arm pain)"},
                {"value": "POSITIVE_RADICULAR_SHOOTING", "label": "Yes: Positive Spurling's Sign (Sharp electric pain / numbness shoots down arm)"}
            ]
        }
    ),
    ProtocolStepDef(
        step_id="CERVICAL_PALPATION",
        phase="PALPATION",
        title="Targeted Cervical Paraspinal & Trapezius Palpation",
        operator_instruction="Palpate cervical spinous processes (C2-C7), suboccipital notch, and levator scapulae / upper trapezius trigger points. Rate tenderness on 0-10 scale.",
        patient_question="When that exact tender spot in your neck or upper shoulder muscle is pressed firmly, what is the pain score from 0 to 10?",
        patient_question_hi="गर्दन की उस नस या हड्डी पर उंगली से दबाने पर 0 से 10 तक कितना दर्द होता है?",
        action_type="PALPATION_SCORE",
        input_config={"min_value": 0, "max_value": 10, "unit": "NRS (0-10)"}
    )
]

# --- REGISTRY MAP ---
def get_protocol_for_region(region_id: str) -> List[ProtocolStepDef]:
    """Returns the validated clinical protocol matching the selected anatomical region."""
    reg = region_id.upper()
    if "KNEE" in reg:
        return KNEE_EXAMINATION_PROTOCOL
    elif "SHOULDER" in reg:
        return SHOULDER_EXAMINATION_PROTOCOL
    elif "ELBOW" in reg:
        return ELBOW_EXAMINATION_PROTOCOL
    elif "WRIST" in reg or "HAND" in reg:
        return WRIST_EXAMINATION_PROTOCOL
    elif "HIP" in reg or "PELVIS" in reg:
        return HIP_EXAMINATION_PROTOCOL
    elif "ANKLE" in reg or "FOOT" in reg:
        return ANKLE_EXAMINATION_PROTOCOL
    elif "CERVICAL" in reg or "NECK" in reg:
        return CERVICAL_SPINE_EXAMINATION_PROTOCOL
    elif "SPINE" in reg or "LUMBAR" in reg or "BACK" in reg:
        return LUMBAR_SPINE_EXAMINATION_PROTOCOL
    # Default fallback to Knee
    return KNEE_EXAMINATION_PROTOCOL
