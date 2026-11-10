# -*- coding: utf-8 -*-
"""
Enrich all 10 anatomical classification methods in point_intelligence.py
with built-in offline differential diagnoses and clinical pearls.
"""

import sys

def apply_point_intelligence_upgrade():
    path = 'backend/app/services/point_intelligence.py'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update _classify_thigh:
    # Look for the return of _classify_thigh
    old_thigh_ret = 'return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx)'
    
    # We will replace _classify_thigh block with enriched differentials & pearl
    s_thigh = content.find('def _classify_thigh(')
    e_thigh = content.find('def _classify_leg_calf_shin(')
    
    new_thigh_func = '''def _classify_thigh(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        if aspect == "ANTERIOR":
            region_id = f"{side}_ANTERIOR_THIGH"
            display_name = f"{side_str} Anterior Thigh (Quadriceps Femoris / Rectus Femoris)"
            muscle = "Quadriceps Femoris (Rectus Femoris, Vastus Medialis, Vastus Lateralis)"
            nerve = "Femoral Nerve (L2, L3, L4)"
            tissue = "Skeletal Muscle Belly & Tendinous Insertion"
            action = "Knee extension and hip flexion"

            rf_en = "Did you hear or feel an explosive 'pop' or snap in the front of your thigh, is there a visible sunken dent/gap, or are you completely unable to bear weight?"
            rf_hi = "क्या जांघ के आगे तेज पटाखे जैसी आवाज या झटका महसूस हुआ, क्या मांसपेशी में गड्ढा दिख रहा है या पैर पर बिल्कुल वजन नहीं रख पा रहे हैं?"
            rf_cond = "Acute High-Grade Quadriceps Tear / Avulsion / Femoral Neck Fracture"

            dq = [
                {"id": "Q_MECHANISM", "prompt_en": "Did this pain start suddenly while sprinting, kicking, or jumping, or after a direct blunt impact (contusion)?", "prompt_hi": "क्या यह दर्द दौड़ते, किक मारते समय अचानक हुआ, या किसी चीज की तेज टक्कर लगने से?"},
                {"id": "Q_PAIN_BEHAVIOR", "prompt_en": "Does bending your knee backwards (stretching the front of your thigh) sharply aggravate the pain?", "prompt_hi": "क्या घुटने को पीछे मोड़कर जांघ को खींचने पर तेज दर्द महसूस होता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_ACTIVE_SLR",
                    "title": "Active Straight Leg Raise & Resisted Knee Extension",
                    "instruction_en": "Sit or lie supine. Lift the leg straight up with knee fully extended, then extend against gentle resistance.",
                    "instruction_hi": "सीधे बैठकर या लेटकर घुटने को बिना मोड़े पैर को ऊपर सीधा उठाएं।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "KNEE"
                },
                {
                    "test_id": "TEST_PRONE_ELY",
                    "title": "Ely's Rectus Femoris Passive Stretch Test",
                    "instruction_en": "In prone position, gently flex the patient's knee towards the buttock to assess quadriceps tightness and pain reproduction.",
                    "instruction_hi": "पेट के बल लेटकर घुटने को पीछे कूल्हे की तरफ मोड़ने पर खिंचाव और दर्द की जांच करें।",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_PALPATION_QUAD",
                    "title": "Focal Quadriceps Belly Palpation",
                    "instruction_en": "Palpate along the anterior thigh muscle fibers. Check for focal tenderness, muscle spasm, or a palpable defect.",
                    "instruction_hi": "जांघ की उस मांसपेशी पर सीधे उंगली से दबाकर देखें कि कितना दर्द या सूजन है।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "POLICE protocol: Avoid painful stretching. Apply cold packs for 15-20 min every 3 hours. Use compressive elastic wrap.",
                "phase2_rehab": "Sub-maximal isometric quadriceps sets (quad sets), progression to straight leg raises and seated active knee extensions once pain-free.",
                "phase3_medical": "Diagnostic musculoskeletal ultrasound if focal defect or large hematoma suspected. Gradual return to sports over 2-6 weeks depending on tear grade.",
                "recovery_timeline": "Mild Strain: 1-2 weeks; Moderate Partial Tear: 3-6 weeks."
            }

            differentials = [
                "Quadriceps Muscle Strain / Contusion (जांघ के आगे की मांसपेशी में खिंचाव)",
                "Rectus Femoris Tendinopathy",
                "Femoral Nerve Compression / L3-L4 Radiculopathy",
                "Meralgia Paresthetica (Anterolateral Burning)"
            ]
            pearl = "Inability to perform straight leg raise or localized defect in rectus femoris indicates high-grade quadriceps tear; burning over anterolateral thigh indicates meralgia paresthetica."

        elif aspect == "POSTERIOR":
            region_id = f"{side}_POSTERIOR_THIGH"
            display_name = f"{side_str} Posterior Thigh (Hamstring Muscle Complex)"
            muscle = "Hamstrings (Biceps Femoris long & short heads, Semitendinosus, Semimembranosus)"
            nerve = "Sciatic Nerve (Tibial & Common Peroneal divisions L5, S1, S2)"
            tissue = "Muscle Belly & Proximal Ischial Tendon"
            action = "Knee flexion and hip extension"

            rf_en = "Did you experience sudden tearing pain at top speed, extreme bruising spreading down the back of your knee, or inability to walk without severe limp?"
            rf_hi = "क्या तेज दौड़ते समय जांघ के पीछे तेज खिंचाव या फटने जैसा दर्द हुआ, क्या पीछे नीला निशान पड़ गया है या चलने में भारी लंगड़ाहट है?"
            rf_cond = "Acute High-Grade Hamstring Avulsion / Rupture"

            dq = [
                {"id": "Q_HAMSTRING_SIT", "prompt_en": "Does prolonged sitting on hard chairs or bending forward to touch your toes trigger sharp pain in the back of your thigh?", "prompt_hi": "क्या सख्त कुर्सी पर बैठने से या आगे झुकने पर जांघ के पीछे तेज दर्द उठता है?"},
                {"id": "Q_HAMSTRING_POP", "prompt_en": "Did you feel an audible pop or snap during deceleration or high kicking?", "prompt_hi": "क्या दौड़ते समय रुकते हुए या पैर ऊपर उठाते समय कोई चटकने की आवाज आई?"}
            ]

            tests = [
                {
                    "test_id": "TEST_RESISTED_KNEE_FLEXION",
                    "title": "Resisted Knee Flexion (Hamstring Activation)",
                    "instruction_en": "Lie prone or sit. Flex knee against manual resistance at 30°, 60°, and 90° to isolate biceps femoris and semitendinosus.",
                    "instruction_hi": "पेट के बल लेटकर घुटने को मोड़ें और दबाव के खिलाफ खींचें।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "KNEE"
                },
                {
                    "test_id": "TEST_SLUMP_SCIATIC",
                    "title": "Slump Test (Sciatic Nerve vs Hamstring Differentiation)",
                    "instruction_en": "Assess whether seated slump with ankle dorsiflexion reproduces the pain to distinguish neural tension from muscular strain.",
                    "instruction_hi": "बैठकर गर्दन और पीठ झुकाकर पैर सीधा करने पर क्या करंट जैसा दर्द दौड़ता है?",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_PALPATION_HAMSTRING",
                    "title": "Targeted Hamstring Palpation & Defect Check",
                    "instruction_en": "Systematically palpate the hamstring muscle bellies and proximal origin at the ischial tuberosity.",
                    "instruction_hi": "जांघ के पीछे की नस और कूल्हे की हड्डी के पास दबाकर दर्द का स्तर मापें।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Immediate relative rest; avoid aggressive straight-leg stretching. Ice packs for 20 mins. Compressive thigh sleeve.",
                "phase2_rehab": "Progress from prone isometric knee flexion to Nordic hamstring curls and Romanian deadlifts with light resistance.",
                "phase3_medical": "MRI indicated if suspected proximal ischial tendon avulsion (>2cm retraction requires surgical repair).",
                "recovery_timeline": "Grade 1: 2-3 weeks; Grade 2: 4-8 weeks; Complete Avulsion: surgical consult."
            }

            differentials = [
                "Sciatic Nerve Radicular Radiation Track (L4-S1 सायटिका का जांघ के पीछे उतरना)",
                "Hamstring Tendon / Muscle Strain (जांघ के पीछे खिंचाव)",
                "Deep Sciatic Neural Adhesion / Entrapment",
                "Ischial Tuberosity Enthesopathy"
            ]
            pearl = "Radiating posterior thigh pain that shoots past the knee without local muscle tenderness on palpation is referred Sciatica from lumbar or piriformis origin."

        else: # Lateral or Medial Thigh (ITB or Adductors)
            is_lateral = aspect == "LATERAL" or (x < 0 and nx < -0.3) or (x > 0 and nx > 0.3)
            sub_name = "Iliotibial Band (ITB) / Tensor Fasciae Latae" if is_lateral else "Adductor Longus / Groin Muscle Bed"
            region_id = f"{side}_LATERAL_THIGH" if is_lateral else f"{side}_MEDIAL_THIGH"
            display_name = f"{side_str} {sub_name}"
            muscle = "Iliotibial Tract & Tensor Fasciae Latae" if is_lateral else "Adductor Longus, Adductor Magnus, Gracilis"
            nerve = "Superior Gluteal Nerve (L4-S1)" if is_lateral else "Obturator Nerve (L2-L4)"
            tissue = "Dense Fascial Band / Muscle Tendon"
            action = "Hip abduction & pelvic stability" if is_lateral else "Hip adduction & stabilization"

            rf_en = "Do you have sudden severe groin swelling, inability to move the hip in any direction, or fever with warm tender mass?"
            rf_hi = "क्या ग्रोइन या जांघ में अचानक भारी सूजन आई है, पैर किसी भी दिशा में नहीं हिल रहा है, या तेज बुखार है?"
            rf_cond = "Acute Adductor Avulsion / Septic Joint / Inguinal Hernia"

            dq = [
                {"id": "Q_SIDE_PAIN", "prompt_en": "Does squeezing a ball between your knees or running on hard surfaces provoke the pain?", "prompt_hi": "क्या दोनों घुटनों के बीच तकिया दबाने पर या दौड़ने पर यह दर्द उभरता है?"}
            ]
            tests = [
                {
                    "test_id": "TEST_OBER_ITB",
                    "title": "Ober's Test (IT Band Tightness) or Squeeze Test (Adductors)",
                    "instruction_en": "Side-lying Ober test for lateral thigh or supine isometric adductor squeeze at 0° and 45° knee flexion.",
                    "instruction_hi": "करवट लेटकर पैर को पीछे खींचकर देखें कि जांघ के किनारे कितना खिंचाव है।",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_PALPATION_THIGH_BORDER",
                    "title": "Focal ITB / Adductor Origin Palpation",
                    "instruction_en": "Palpate the IT band along lateral femoral condyle and Gerdy's tubercle, or adductor longus origin at pubic tubercle.",
                    "instruction_hi": "जांघ के बाहरी किनारे या भीतरी जोड़ पर दबाकर दर्द की जांच करें।",
                    "action_type": "PALPATION_SCORE"
                }
            ]
            rx = {
                "phase1_acute": "Foam rolling / soft tissue release to ITB/TFL or adductors. Avoid aggressive cutting/sprinting.",
                "phase2_rehab": "Side-planks, clamshells, Copenhagen adductor planks (isometric hold progression).",
                "phase3_medical": "Pelvic/Hip X-ray if persistent groin pain to rule out femoral acetabular impingement (FAI) or sports hernia.",
                "recovery_timeline": "2-4 weeks with consistent load management."
            }

            differentials = [
                "Iliotibial Band (ITB) Friction Syndrome (बाहरी जांघ में खिंचाव)",
                "Adductor Muscle / Groin Strain (भीतरी जांघ में खिंचाव)",
                "Tensor Fasciae Latae Strain",
                "Greater Trochanteric Referral"
            ]
            pearl = "Lateral thigh aching exacerbated by prolonged walking or running points to ITB tightness, while pain on squeezing knees together indicates adductor strain."

        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx, differentials, pearl)

    '''

    content = content[:s_thigh] + new_thigh_func + content[e_thigh:]

    # 2. Update _classify_leg_calf_shin
    s_calf = content.find('def _classify_leg_calf_shin(')
    e_calf = content.find('def _classify_thorax_chest_back(')

    new_calf_func = '''def _classify_leg_calf_shin(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        if aspect == "POSTERIOR":
            region_id = f"{side}_CALF_POSTERIOR"
            display_name = f"{side_str} Posterior Calf (Gastrocnemius / Soleus / Achilles)"
            muscle = "Gastrocnemius (Medial & Lateral heads), Soleus, Plantaris"
            nerve = "Tibial Nerve (S1, S2)"
            tissue = "Triceps Surae Muscle Belly & Musculotendinous Junction"
            action = "Plantarflexion of the ankle and knee flexion assist"

            rf_en = "Did you feel an intense gunshot/kick sensation behind your ankle, is your calf hot, visibly swollen and tender to touch, or can you not push off on your toes?"
            rf_hi = "क्या पिंडली के पीछे ऐसा लगा जैसे किसी ने पत्थर मारा हो, क्या पिंडली में तेज गर्मी, सूजन और छूने पर तेज दर्द है (खून का थक्का/DVT), या पंजे पर खड़े नहीं हो पा रहे हैं?"
            rf_cond = "Achilles Tendon Complete Rupture / Deep Vein Thrombosis (DVT) Risk"

            dq = [
                {"id": "Q_CALF_ONSET", "prompt_en": "Did the calf pain start during push-off or jumping (tennis/running), or does it cramp mostly at night in bed?", "prompt_hi": "क्या दौड़ते या कूदते समय झटका लगा, या रात को सोते समय पिंडली में नस चढ़ने जैसा दर्द होता है?"},
                {"id": "Q_CALF_STRETCH", "prompt_en": "Does pulling your toes up towards your shin produce a sharp pulling pain in the calf muscle?", "prompt_hi": "क्या पैर के पंजे को ऊपर अपनी तरफ खींचने पर पिंडली की नस में तेज खिंचाव होता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_THOMPSON_ACHILLES",
                    "title": "Thompson Calf Squeeze Test (Achilles Integrity)",
                    "instruction_en": "Patient prone with feet hanging off edge. Squeeze calf belly firmly. Absence of passive plantarflexion confirms complete Achilles rupture.",
                    "instruction_hi": "पेट के बल लेटें। डॉक्टर पिंडली को दबाकर देखेंगे कि पंजा हिलता है या नस टूट गई है।",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_SINGLE_HEEL_RAISE",
                    "title": "Active Single-Leg Heel Raise & Calf Endurance",
                    "instruction_en": "Instruct patient to perform single-leg calf raise standing. Monitor for pain, weakness, or inability to achieve full height.",
                    "instruction_hi": "सिर्फ एक पैर के पंजे पर ऊपर उठें और देखें कि पिंडली में दर्द या कमजोरी तो नहीं है।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "ANKLE"
                },
                {
                    "test_id": "TEST_PALPATION_CALF",
                    "title": "Targeted Gastrocnemius Musculotendinous Junction Palpation",
                    "instruction_en": "Palpate the medial gastrocnemius belly and proximal Achilles tendon for gap, swelling, or focal tenderness.",
                    "instruction_hi": "पिंडली की नस पर हाथ से दबाकर दर्द और सूजन की जांच करें।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Temporary heel lift (1-1.5cm) in shoe to reduce Achilles/calf tension. RICE protocol. Compression stocking if DVT excluded.",
                "phase2_rehab": "Alfredson eccentric heel drops on a step (3x15 reps twice daily), progressing to weighted calf raises.",
                "phase3_medical": "Venous Doppler ultrasound immediately if calf swelling/DVT suspected. Orthopedic consult if positive Thompson test.",
                "recovery_timeline": "Medial Gastrocnemius Strain: 2-4 weeks; Achilles Tendinopathy: 6-12 weeks."
            }

            differentials = [
                "Sciatica L5-S1 Radicular Radiation into Calf & Foot (पिंडली व पंजे तक नस का दर्द)",
                "Gastrocnemius Nocturnal Muscle Cramps & Venous Stasis (पिंडलियों में रात की ऐंठन व भारीपन)",
                "Medial Gastrocnemius Muscle Strain (Tennis Leg)",
                "Diabetic / Nutritional (B12 Deficiency) Peripheral Neuropathy (पैरों व तलवों में जलन, सुन्नपन व झुनझुनी)"
            ]
            pearl = "Symmetrical bilateral burning/tingling in the soles worse at night indicates metabolic/nutritional neuropathy (Vitamin B12 deficiency/diabetes), whereas unilateral shooting electric pain from back/buttock is root Sciatica."

        else: # Anterior / Lateral (Tibia Shin / Tibialis Anterior)
            region_id = f"{side}_SHIN_ANTERIOR"
            display_name = f"{side_str} Anterior Leg & Shin (Tibialis Anterior / Tibial Shaft)"
            muscle = "Tibialis Anterior, Extensor Digitorum Longus, Periosteum of Tibia"
            nerve = "Deep Peroneal Nerve (L4, L5)"
            tissue = "Periosteum & Anterior Muscle Compartment"
            action = "Ankle dorsiflexion and foot inversion"

            rf_en = "Is your shin numb, do your toes feel cold, or is there extreme tightness/pain out of proportion to injury that is worsening hourly?"
            rf_hi = "क्या पैर का पंजा ऊपर नहीं उठ रहा (ड्रॉप फुट), पैर की उंगलियां सुन्न और ठंडी हैं, या पिंडली में पत्थर जैसी सख्त सूजन और असहनीय दर्द है (कंपार्टमेंट सिंड्रोम)?"
            rf_cond = "Acute Anterior Compartment Syndrome / Tibial Stress Fracture"

            dq = [
                {"id": "Q_SHIN_PAIN", "prompt_en": "Is the pain located along the inner edge of the shin bone after running/walking, and does it ache even at rest?", "prompt_hi": "क्या दौड़ने या तेज चलने के बाद पिंडली की हड्डी पर दर्द होता है, और क्या आराम करते समय भी मीठा-मीठा दर्द रहता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_ACTIVE_DORSIFLEXION",
                    "title": "Active Resisted Ankle Dorsiflexion & Heel Walk",
                    "instruction_en": "Have patient walk on heels for 6 steps and dorsiflex against firm resistance. Assess tibialis anterior strength and pain reproduction.",
                    "instruction_hi": "एड़ियों के बल चलकर दिखाएं और पंजे को पूरी ताकत से ऊपर उठाएं।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "ANKLE"
                },
                {
                    "test_id": "TEST_PALPATION_SHIN",
                    "title": "Tibial Periosteal Palpation (Shin Splints Screen)",
                    "instruction_en": "Palpate the posteromedial border of the tibia over a 5cm span to assess Medial Tibial Stress Syndrome (MTSS).",
                    "instruction_hi": "पिंडली की आगे वाली हड्डी पर उंगली दबाकर दर्द की जांच करें।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "De-load running and high-impact activities. Cross-train with swimming or cycling. Ice massage over tibial border.",
                "phase2_rehab": "Strengthen tibialis anterior and intrinsic foot muscles; calf flexibility drills; supportive footwear / orthotics.",
                "phase3_medical": "Order bone scan or MRI if focal pinpoint bone tenderness suggests tibial stress fracture (tuning fork / percussion test).",
                "recovery_timeline": "Medial Tibial Stress Syndrome: 3-8 weeks with activity modification."
            }

            differentials = [
                "Medial Tibial Stress Syndrome (Shin Splints from hard field walking - पिंडली के आगे की हड्डी में दर्द)",
                "Tibialis Anterior Muscle Strain / Tendinopathy",
                "Tibial Stress Fracture (हड्डी में हेयरलाइन क्रैक)",
                "Exertional Anterior Compartment Syndrome"
            ]
            pearl = "Diffuse tenderness along the lower third of the posteromedial tibial border represents shin splints (MTSS), while sharp focal pinpoint bone tenderness <2cm warrants stress fracture rule-out."

        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx, differentials, pearl)

    '''

    content = content[:s_calf] + new_calf_func + content[e_calf:]

    # 3. Update _classify_thorax_chest_back
    s_thorax = content.find('def _classify_thorax_chest_back(')
    e_thorax = content.find('def _classify_abdomen_lumbar(')

    new_thorax_func = '''def _classify_thorax_chest_back(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        if aspect == "ANTERIOR":
            region_id = f"{side}_CHEST_THORACIC"
            display_name = f"{side_str} Thoracic Wall & Pectoralis Region"
            muscle = "Pectoralis Major, Pectoralis Minor, Intercostal Muscles"
            nerve = "Medial & Lateral Pectoral Nerves (C5-T1), Intercostal Nerves"
            tissue = "Chest Wall Musculature, Costochondral Junction & Ribs"
            action = "Arm adduction, internal rotation, and chest wall expansion"

            rf_en = "Are you experiencing crushing central chest pressure, pain radiating to your jaw/left arm, shortness of breath, dizziness, or cold sweating?"
            rf_hi = "क्या सीने में भारी दबाव, घुटन या जकड़न महसूस हो रही है, क्या दर्द बाएं हाथ या जबड़े तक फैल रहा है, या सांस फूलने के साथ ठंडा पसीना आ रहा है (हार्ट अटैक का खतरा)?"
            rf_cond = "Cardiovascular Emergency (Acute Coronary Syndrome) / Tension Pneumothorax / Pulmonary Embolism"

            dq = [
                {"id": "Q_CHEST_BREATH", "prompt_en": "Does taking a deep breath, coughing, or pressing directly with your finger on the tender rib cartilage recreate the exact pain?", "prompt_hi": "क्या गहरी सांस लेने, खांसने या सीने की हड्डी पर उंगली से दबाने पर ही यह दर्द होता है?"},
                {"id": "Q_CHEST_LIFT", "prompt_en": "Did the pain start after heavy bench press, push-ups, or a blunt collision?", "prompt_hi": "क्या जिम में वजन उठाने, पुश-अप्स लगाने या सीने पर कोई झटका लगने के बाद यह दर्द हुआ?"}
            ]

            tests = [
                {
                    "test_id": "TEST_CHEST_EXPANSION_COUGH",
                    "title": "Deep Inspiration & Rib Cage Expansion Challenge",
                    "instruction_en": "Instruct patient to take a maximum deep inspiration and hold for 3 seconds. Check for pleuritic/costochondral reproduction.",
                    "instruction_hi": "गहरी सांस अंदर खींचें और 3 सेकंड रोकें। क्या सीने की हड्डी में चुभन होती है?",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "SPINE"
                },
                {
                    "test_id": "TEST_PALPATION_COSTOCHONDRAL",
                    "title": "Focal Costochondral / Pectoralis Palpation",
                    "instruction_en": "Firmly palpate the costochondral junctions (Costochondritis / Tietze syndrome) and pectoralis tendon insertion.",
                    "instruction_hi": "सीने की उस पसली या हड्डी पर दबाकर 0 से 10 तक दर्द का स्तर बताएं।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Rule out cardiac/pulmonary etiologies first (ECG/Troponin if indicated). Reassurance; relative rest from heavy chest pressing.",
                "phase2_rehab": "Gentle doorway pectoral stretching, thoracic spine extension exercises over foam roller, diaphragmatic breathing.",
                "phase3_medical": "Topical or oral NSAIDs for costochondritis. Chest X-Ray if history of blunt trauma to exclude rib fracture/pneumothorax.",
                "recovery_timeline": "Muscular strain / Costochondritis: 1-4 weeks."
            }

            differentials = [
                "Costochondritis / Tietze Syndrome (सीने की पसली की सूजन)",
                "Pectoralis Major Muscle Strain (सीने की मांसपेशी का खिंचाव)",
                "Intercostal Neuralgia / Musculoskeletal Chest Wall Pain",
                "Rule-out Angina / Cardiovascular Origin"
            ]
            pearl = "Chest wall pain that is sharply tender to local palpation on costochondral cartilage and reproduces on trunk twisting is costochondritis, not cardiac ischemia."

        else: # Posterior (Upper & Mid Back / Scapula / Rhomboid)
            region_id = f"{side}_THORACIC_POSTERIOR"
            display_name = f"{side_str} Thoracic Spine & Periscapular Region"
            muscle = "Rhomboid Major/Minor, Trapezius (Middle/Lower fibers), Erector Spinae, Latissimus Dorsi"
            nerve = "Dorsal Scapular Nerve (C5), Spinal Accessory Nerve (CN XI), Thoracic Spinal Nerves"
            tissue = "Periscapular Musculature & Thoracic Facet Joints"
            action = "Scapular retraction, thoracic extension & stabilization"

            rf_en = "Do you have sudden unprovoked severe mid-back pain radiating around your ribs like a tight band, fever, unexplained weight loss, or difficulty walking?"
            rf_hi = "क्या पीठ के बीच में असहनीय दर्द है जो पसलियों के चारों ओर शिकंजे की तरह जकड़ रहा है, बुखार है या पैरों में कमजोरी महसूस हो रही है?"
            rf_cond = "Thoracic Disc Herniation / Spinal Infection / Compression Fracture"

            dq = [
                {"id": "Q_SCAPULAR_POSTURE", "prompt_en": "Does sitting at a computer or driving for long hours cause burning or knot-like tightness between your shoulder blade and spine?", "prompt_hi": "क्या कुर्सी पर देर तक बैठने या मोबाइल चलाने पर कंधे की पीछे वाली हड्डी के पास जलन या गांठ जैसा दर्द होता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_THORACIC_ROTATION",
                    "title": "Seated Thoracic Trunk Rotation Kinematics",
                    "instruction_en": "Sit upright with arms crossed over chest. Rotate trunk smoothly to left and right (normal: ~45°). MediaPipe tracks shoulder rotation.",
                    "instruction_hi": "छाती पर हाथ बांधकर सीधे बैठें और धीरे-धीरे दोनों तरफ पीठ को घुमाएं।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "SPINE"
                },
                {
                    "test_id": "TEST_PALPATION_RHOMBOID",
                    "title": "Periscapular Myofascial Trigger Point Palpation",
                    "instruction_en": "Palpate the medial scapular border and paraspinal muscles for hyperirritable taut bands and focal tender nodules.",
                    "instruction_hi": "कंधे के पीछे वाली हड्डी और रीढ़ की हड्डी के बीच दबाकर दर्द का स्तर मापें।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Ergonomic desk setup adjustments; frequent posture breaks every 45 mins. Moist heat or ice to rhomboid bed.",
                "phase2_rehab": "Scapular retractions ('W' to 'Y' exercises), prone 'cobra' thoracic extensions, and pec minor doorway stretches.",
                "phase3_medical": "Myofascial release, dry needling, or trigger point therapy. Thoracic X-ray if osteoporotic patient with acute onset.",
                "recovery_timeline": "Postural Myofascial Pain: 1-3 weeks with ergonomic modification."
            }

            differentials = [
                "Axial Postural Kinetic Chain Strain (सिर पर भारी बोझ उठाने से गर्दन से पीठ तक खिंचाव)",
                "Thoracic Kyphotic Postural Fatigue & Rhomboid Spasm (कंधों के बीच दर्द)",
                "Costovertebral Joint Dysfunction (पसली का खिंचाव)",
                "Thoracic Spondylosis"
            ]
            pearl = "Mid-back paraspinal aching is almost always compensatory to occupational head-loading or stooping in fields. Cat-Camel mobilizations and thoracic extension unloading provide immediate pain relief."

        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx, differentials, pearl)

    '''

    content = content[:s_thorax] + new_thorax_func + content[e_thorax:]

    # 4. Update _classify_abdomen_lumbar
    s_lumbar = content.find('def _classify_abdomen_lumbar(')
    e_lumbar = content.find('def _classify_pelvis_hip_gluteal(')

    new_lumbar_func = '''def _classify_abdomen_lumbar(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        if aspect == "ANTERIOR":
            region_id = f"{side}_ABDOMINAL_WALL"
            display_name = f"{side_str} Abdominal Wall & Core"
            muscle = "Rectus Abdominis, External/Internal Obliques, Transversus Abdominis"
            nerve = "Thoracoabdominal Nerves (T7-T11), Subcostal Nerve (T12)"
            tissue = "Myofascial Abdominal Wall & Aponeurosis"
            action = "Trunk flexion, lateral rotation, intra-abdominal pressure generation"

            rf_en = "Do you have sudden excruciating abdominal pain, persistent vomiting, high fever, rigid board-like belly, or blood in your stool/urine?"
            rf_hi = "क्या पेट में अचानक बहुत तेज असहनीय दर्द उठा है, लगातार उल्टियां हो रही हैं, पेट पत्थर की तरह कड़ा हो गया है या पेशाब/शौच में खून आ रहा है (अपेंडिक्स या आंतरिक आपातकाल)?"
            rf_cond = "Acute Surgical Abdomen (Appendicitis / Perforated Viscus / Diverticulitis / Ruptured AAA)"

            dq = [
                {"id": "Q_CARNETT", "prompt_en": "When you tense your stomach muscles (like starting a sit-up) and press the tender spot, does the pain become more severe (abdominal wall) or decrease (internal organ)?", "prompt_hi": "जब आप पेट को कड़ा करके (सिट-अप की तरह) उस जगह को दबाते हैं, तो क्या दर्द बढ़ जाता है (मांसपेशी का दर्द) या कम होता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_CARNETT_TEST",
                    "title": "Carnett's Test (Abdominal Wall vs Visceral Distinction)",
                    "instruction_en": "Identify tender point while relaxed. Have patient raise head/shoulders off table to contract rectus. Increased pain indicates abdominal wall etiology (positive Carnett's).",
                    "instruction_hi": "सिर को थोड़ा ऊपर उठाकर पेट की मांसपेशी को कड़ा करें, फिर दर्द की जांच करें।",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_PALPATION_ABDOMEN",
                    "title": "Focal Abdominal Wall & Inguinal Palpation",
                    "instruction_en": "Gently palpate the rectus muscle belly and inguinal rings. Check for reducible hernia or localized tenderness.",
                    "instruction_hi": "पेट की उस खास जगह पर उंगली से हल्का दबाकर दर्द का स्तर बताएं।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Rule out intra-abdominal surgical emergencies first. Avoid aggressive sit-ups or heavy lifting.",
                "phase2_rehab": "Gentle core stabilization (transversus abdominis drawing-in maneuver, pelvic tilts, bird-dog).",
                "phase3_medical": "Abdominal wall trigger point injection or ultrasound if suspected anterior cutaneous nerve entrapment (ACNES).",
                "recovery_timeline": "Abdominal muscle strain: 2-4 weeks."
            }

            differentials = [
                "Rectus Abdominis Muscle Strain (पेट की मांसपेशी में खिंचाव)",
                "Anterior Cutaneous Nerve Entrapment Syndrome (ACNES - पेट की नस दबना)",
                "Incipient Inguinal / Umbilical Hernia (हर्निया का शुरुआती उभार)",
                "Referred Visceral Colic (आंतों या पथरी का दर्द)"
            ]
            pearl = "Positive Carnett's test (increased pain on head raise) confirms abdominal wall myofascial origin rather than intra-abdominal visceral emergency."

        else: # Posterior (Lumbar Spine & Paraspinal Musculature)
            region_id = f"{side}_LUMBAR_PARASPINAL"
            display_name = f"{side_str} Lumbar Paraspinal & Low Back Musculature"
            muscle = "Erector Spinae (Longissimus, Iliocostalis), Multifidus, Quadratus Lumborum"
            nerve = "Dorsal rami of Lumbar Spinal Nerves (L1-L5)"
            tissue = "Paraspinal Muscle Bed & Thoracolumbar Fascia"
            action = "Spine extension, lateral bending, posture stabilization"

            rf_en = "Do you have sudden numbness in your groin/saddle area, loss of bowel or bladder control, or progressive bilateral foot drop/weakness?"
            rf_hi = "क्या आपके जांघों के बीच या शौच वाली जगह पर सुन्नपन है, पेशाब-पाखाने पर नियंत्रण छूट रहा है, या दोनों पैरों में भारी कमजोरी है (कौडा इक्विना सिंड्रोम)?"
            rf_cond = "Cauda Equina Syndrome / Severe Spinal Canal Stenosis"

            dq = [
                {"id": "Q_LUMBAR_RADIATION", "prompt_en": "Does the pain shoot down past your knee into your calf or foot like an electric shock (sciatica), or stay in your low back?", "prompt_hi": "क्या दर्द केवल कमर में रहता है, या करंट की तरह नीचे पैर, पिंडली और पंजे तक दौड़ता है?"},
                {"id": "Q_LUMBAR_EXTENSION", "prompt_en": "Does standing up straight or leaning backwards make the pain better or worse?", "prompt_hi": "क्या सीधे खड़े होने या पीछे झुकने से दर्द में आराम मिलता है या दर्द बढ़ता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_LUMBAR_ACTIVE_ROM",
                    "title": "Active Lumbar Forward Flexion & Return (Toe Touch)",
                    "instruction_en": "Stand upright with knees straight. Smoothly bend forward towards toes to assess lumbar flexion ROM and aberrant movement.",
                    "instruction_hi": "घुटने सीधे रखकर धीरे-धीरे नीचे झुकें और पैर के अंगूठे को छूने की कोशिश करें।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "SPINE"
                },
                {
                    "test_id": "TEST_STRAIGHT_LEG_RAISE",
                    "title": "Passive Straight Leg Raise (Lasegue's Test)",
                    "instruction_en": "Assess for radicular pain reproduction between 35° and 70° of passive straight leg elevation.",
                    "instruction_hi": "सीधे लेटकर पैर को सीधा ऊपर उठाने पर क्या कमर से पैर तक बिजली जैसा दर्द दौड़ता है?",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_PALPATION_LUMBAR",
                    "title": "Lumbar Paraspinal & SI Joint Palpation",
                    "instruction_en": "Palpate bilateral lumbar erector spinae, quadratus lumborum, and PSIS / sacroiliac joints.",
                    "instruction_hi": "कमर की रीढ़ की हड्डी और दोनों तरफ की मांसपेशियों पर दबाकर 0 से 10 तक दर्द बताएं।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Maintain relative movement; avoid prolonged bed rest (>48h). Short walking sessions. Heat therapy for muscle spasm.",
                "phase2_rehab": "McKenzie directional preference exercises (prone press-ups), bird-dog, side-bridges, and hip mobility drills.",
                "phase3_medical": "Short course of NSAIDs/muscle relaxant. Lumbar MRI indicated if severe radiating deficit or unresponsive after 6 weeks.",
                "recovery_timeline": "Acute Mechanical Low Back Strain: 2-6 weeks."
            }

            differentials = [
                "L4-L5 / L5-S1 Lumbar Disc Herniation with Sciatica (सायटिका - कमर से पैर तक नस दबने का तेज दर्द)",
                "Piriformis Syndrome / Deep Gluteal Sciatic Entrapment (कूल्हे की नस में दबाव)",
                "Lumbar Spinal Canal Stenosis (न्यूरोजेनिक क्लॉडिकेशन - चलने पर पैरों में भारीपन)",
                "Lumbar Spondylosis & Acute Paraspinal Muscular Spasm (कमर की रीढ़ का घिसाव व ऐंठन)"
            ]
            pearl = "Straight Leg Raise (SLR / Lasegue's) test between 30°-70° differentiates true disc root sciatica from tight hamstrings. McKenzie prone press-ups push the disc anteriorly away from the nerve root to centralize pain out of the leg."

        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx, differentials, pearl)

    '''

    content = content[:s_lumbar] + new_lumbar_func + content[e_lumbar:]

    # 5. Update _classify_pelvis_hip_gluteal
    s_pelvis = content.find('def _classify_pelvis_hip_gluteal(')
    e_pelvis = content.find('def _classify_upper_limb(')

    new_pelvis_func = '''def _classify_pelvis_hip_gluteal(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        if aspect == "POSTERIOR":
            region_id = f"{side}_GLUTEAL_PIRIFORMIS"
            display_name = f"{side_str} Gluteal Region & Piriformis"
            muscle = "Gluteus Maximus, Gluteus Medius, Piriformis, Deep Hip Rotators"
            nerve = "Superior & Inferior Gluteal Nerves, Nerve to Piriformis, Sciatic Nerve"
            tissue = "Deep Gluteal Musculature & Sciatic Nerve Interface"
            action = "Hip extension, abduction, external rotation"

            rf_en = "Do you have sudden numbness in your saddle area, unexplained progressive leg paralysis, or severe night pain unaffected by body position?"
            rf_hi = "क्या नितंब या जांघ के बीच सुन्नपन है, पैर में गंभीर कमजोरी है, या रात में सोते समय असहनीय दर्द उठता है?"
            rf_cond = "Cauda Equina / Pelvic Malignancy / Septic Sacroiliitis"

            dq = [
                {"id": "Q_PIRIFORMIS_SIT", "prompt_en": "Does sitting on a hard chair, wallet in pocket, or driving trigger a deep ache in your buttock that shoots down your thigh?", "prompt_hi": "क्या कठोर कुर्सी पर बैठने से या गाड़ी चलाने पर कूल्हे में गहरा दर्द होता है जो जांघ के पीछे उतरता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_FAIR_TEST",
                    "title": "FAIR Test (Flexion, Adduction, Internal Rotation for Piriformis)",
                    "instruction_en": "In side-lying, place hip in 60° flexion, adduction, and internal rotation to stretch piriformis against sciatic nerve.",
                    "instruction_hi": "करवट लेटकर घुटने को मोड़कर अंदर की तरफ घुमाने पर दर्द की जांच करें।",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_TRENDELENBURG",
                    "title": "Single-Leg Balance (Trendelenburg Gluteus Medius Screen)",
                    "instruction_en": "Patient stands on symptomatic leg for 10-15 seconds. Observe for contralateral pelvic drop.",
                    "instruction_hi": "बिना सहारा लिए सिर्फ अपने दर्द वाले पैर पर 10 सेकंड तक संतुलन बनाकर खड़े रहें।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "HIP"
                },
                {
                    "test_id": "TEST_PALPATION_GLUTEAL",
                    "title": "Targeted Piriformis & Sciatic Notch Palpation",
                    "instruction_en": "Palpate midway between PSIS and greater trochanter along piriformis belly and greater sciatic notch.",
                    "instruction_hi": "कूल्हे की गहरी नस पर दबाकर देखें कि कितना दर्द होता है।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Avoid sitting on hard surfaces or thick wallets. Soft cushion. Ice/heat to gluteal region.",
                "phase2_rehab": "Piriformis figure-4 stretches, nerve flossing, gluteus medius strengthening (side-lying clams, bridges).",
                "phase3_medical": "Ultrasound-guided piriformis injection or deep dry needling if recalcitrant after 4-6 weeks.",
                "recovery_timeline": "Piriformis Syndrome: 3-8 weeks."
            }

            differentials = [
                "Piriformis Syndrome / Deep Gluteal Space Sciatica (पिरिफोर्मिस सिंड्रोम - कूल्हे की नस में दबाव)",
                "L4-S1 Lumbar Radiculopathy referring to Buttock (कमर से कूल्हे में उतरने वाला सायटिका)",
                "Sacroiliac Joint Dysfunction (SI Joint Strain - कमर व कूल्हे का जोड़)",
                "Gluteus Medius Tendinopathy & Ischial Bursitis"
            ]
            pearl = "Deep buttock aching aggravated by sitting on a hard chair, wallet in back pocket, or driving, with positive FAIR test but NO midline lumbar spine tenderness, strongly confirms Piriformis Syndrome over spinal disc herniation."

        else: # Anterior or Lateral Hip (Greater Trochanter / Hip Flexor)
            region_id = f"{side}_HIP_TROCHANTER"
            display_name = f"{side_str} Lateral Hip & Greater Trochanteric Region"
            muscle = "Gluteus Medius & Minimus tendons, Iliopsoas, Pectineus"
            nerve = "Femoral Nerve, Superior Gluteal Nerve"
            tissue = "Trochanteric Bursa / Tendon Enthesis / Hip Capsule"
            action = "Hip abduction or hip flexion"

            rf_en = "Did you fall directly onto your hip, are you unable to bear any weight on this leg, or does the leg appear shortened and rotated outward?"
            rf_hi = "क्या आप कूल्हे के बल गिरे थे, क्या पैर पर बिल्कुल वजन नहीं रख पा रहे हैं या पैर छोटा और बाहर मुड़ा हुआ दिख रहा है (कूल्हे की हड्डी टूटना)?"
            rf_cond = "Acute Femoral Neck / Intertrochanteric Hip Fracture"

            dq = [
                {"id": "Q_TROCHANTER_SIDE_SLEEP", "prompt_en": "Can you lie on that side in bed at night, or does direct pressure on the hip bone awaken you with throbbing pain?", "prompt_hi": "क्या रात को उस करवट सोने पर कूल्हे की उभरी हड्डी में तेज टीस या दर्द होता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_HIP_FABER",
                    "title": "FABER (Patrick's) Test (Flexion, Abduction, External Rotation)",
                    "instruction_en": "Place foot of symptomatic leg on opposite knee ('figure 4'). Gently press knee downward. Pain indicates intra-articular hip pathology or SI joint.",
                    "instruction_hi": "पैर को मोड़कर दूसरे घुटने पर रखें और घुटने को नीचे दबाकर देखें कि कूल्हे में दर्द होता है या नहीं।",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_PALPATION_TROCHANTER",
                    "title": "Greater Trochanter Direct Point Palpation",
                    "instruction_en": "Firmly palpate the lateral prominence of the greater trochanter and posterosuperior facet.",
                    "instruction_hi": "कूल्हे की बाहर वाली उभरी हुई हड्डी पर उंगली से सीधा दबाव देकर दर्द बताएं।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Avoid lying directly on affected side; place pillow between knees when sleeping. Relative rest from stairs/hills.",
                "phase2_rehab": "Isometric hip abductor loading in standing, progressing to side-lying abduction and pelvic drop corrections.",
                "phase3_medical": "Trochanteric bursa corticosteroid injection or shockwave therapy for chronic gluteal tendinopathy.",
                "recovery_timeline": "Greater Trochanteric Syndrome: 4-8 weeks."
            }

            differentials = [
                "Greater Trochanteric Pain Syndrome (GTPS / Gluteal Tendinopathy)",
                "Hip Joint Osteoarthritis (कूल्हे के जोड़ का घिसाव)",
                "Iliopsoas Bursitis & Tendinopathy",
                "Meralgia Paresthetica"
            ]
            pearl = "Pain localized precisely over the bony prominence of the greater trochanter that prevents sleeping on that side indicates GTPS rather than internal hip joint pathology."

        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx, differentials, pearl)

    '''

    content = content[:s_pelvis] + new_pelvis_func + content[e_pelvis:]

    # 6. Update _classify_neck_cervical
    s_neck = content.find('def _classify_neck_cervical(')
    e_neck = content.find('def _classify_head_cranium(')

    new_neck_func = '''def _classify_neck_cervical(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        region_id = "CERVICAL_SPINE"
        display_name = f"{side_str} Cervical Spine & Neck Girdle"
        muscle = "Upper Trapezius, Levator Scapulae, Sternocleidomastoid, Cervical Paraspinals"
        nerve = "Cervical Spinal Nerves (C1-C8), Spinal Accessory Nerve (CN XI)"
        tissue = "Cervical Facet Joints, Discs, Paraspinal Muscles"
        action = "Head flexion, extension, lateral tilt, rotation"

        rf_en = "Are you dropping objects, having difficulty buttoning your shirt, experiencing stumbling/gait instability, or sharp shooting shocks down your arms (Lhermitte's)?"
        rf_hi = "क्या हाथों से चीजें छूट रही हैं, शर्ट का बटन लगाने में दिक्कत हो रही है, या चलने में संतुलन लड़खड़ा रहा है (सर्वाइकल मायलोपैथी)?"
        rf_cond = "Cervical Spondylotic Myelopathy / Vertebral Artery Dissection"

        dq = [
            {"id": "Q_NECK_RADICULAR", "prompt_en": "Does tilting your head towards your painful side cause shooting electrical pain or numbness down into your fingers (Spurling's sign)?", "prompt_hi": "गर्दन को दर्द वाली तरफ थोड़ा झुकाने पर क्या बाजू में करंट या झनझनाहट जैसी तेज पीड़ा होती है?"}
        ]
        tests = [
            {
                "test_id": "TEST_CERVICAL_AROM",
                "title": "Active Cervical Flexion & Rotation Kinematics",
                "instruction_en": "Tuck chin to chest (50°), tilt head back to ceiling (60°), and rotate chin to each shoulder (80°).",
                "instruction_hi": "ठुड्डी को नीचे छाती से लगाएं, फिर ऊपर देखें, और दोनों तरफ गर्दन घुमाकर देखें।",
                "action_type": "VIDEO_MOVEMENT",
                "target_joint": "CERVICAL"
            },
            {
                "test_id": "TEST_PALPATION_CERVICAL",
                "title": "Cervical Paraspinal & Trapezius Palpation",
                "instruction_en": "Palpate cervical spinous processes (C2-C7), suboccipital notch, and levator scapulae trigger points.",
                "instruction_hi": "गर्दन की उस नस या हड्डी पर उंगली से दबाने पर 0 से 10 तक कितना दर्द होता है?",
                "action_type": "PALPATION_SCORE"
            }
        ]
        rx = {
            "phase1_acute": "Avoid prolonged static neck flexion (text neck). Use cervical ergonomic support pillow. Gentle heat.",
            "phase2_rehab": "Chin tucks (cervical retraction), deep neck flexor activation, upper trapezius stretches.",
            "phase3_medical": "Cervical spine MRI if radicular weakness; physical therapy for postural restoration.",
            "recovery_timeline": "Acute Cervical Strain / Torticollis: 1-3 weeks."
        }

        differentials = [
            "Cervical Spondylosis with Radiculopathy (गर्दन की नस दबना - हाथ में झुनझुनी व दर्द)",
            "Axial Cervico-Thoraco-Lumbar Kinetic Chain Strain (सिर पर भारी बोझ उठाने व झुककर काम करने से संपूर्ण रीढ़ में खिंचाव)",
            "Upper Trapezius & Levator Scapulae Myofascial Spasm (गर्दन व कंधे की जकड़न)",
            "Cervical Facet Syndrome & Text-Neck Postural Strain"
        ]
        pearl = "Carrying heavy loads on the head compresses the cervical spine and radiates compensatory myofascial spasm through thoracic erectors down to the lumbar and sacroiliac joints. McKenzie Chin Tucks and thoracic unloading break the entire kinetic chain spasm."

        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx, differentials, pearl)

    '''

    content = content[:s_neck] + new_neck_func + content[e_neck:]

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: point_intelligence.py upgraded with targeted offline differentials & pearls!")

if __name__ == '__main__':
    apply_point_intelligence_upgrade()

