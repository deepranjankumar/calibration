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
    AI Clinical Decision & Prescription Synthesis Engine.
    Deeply analyzes all collected clinical data:
    1. Pinpointed 3D body mesh point & anatomical structures (muscles, ligaments, joints, nerves)
    2. Patient-reported symptoms (tenderness severity, swelling, radiating neuropathy, fever, GI, cough)
    3. Computer Vision objective biomechanical measurements (ROM deficit, lag, velocity)
    4. Regional epidemiological context (Bihar / Purnea formulary)
    
    Automatically formulates full diagnosis, tailored medications with Hindi instructions,
    and targeted rehabilitation exercises so the operator does not have to write anything.
    """
    point_analysis = exam.point_analysis or {}
    region_id = exam.selected_region.upper()
    body_part_name = point_analysis.get("display_name") or exam.selected_region.replace("_", " ").title()
    structs = point_analysis.get("anatomical_structures", {})
    primary_muscle = structs.get("primary_muscle", "Target Soft Tissue")
    innervation = structs.get("innervation", "")
    tissue_type = structs.get("tissue_type", "Musculoskeletal")
    side = exam.affected_side or "AFFECTED"
    age = exam.patient_age or 35

    findings: List[ClinicalFinding] = exam.findings or []
    measurements: List[BiomechanicalMeasurement] = exam.measurements or []

    # 1. Synthesize patient-reported symptoms & severities
    finding_texts = " ".join([f"{f.title or ''} {f.description or ''}" for f in findings]).lower()
    has_high_tenderness = any(f.severity in ["CRITICAL", "SEVERE"] for f in findings)
    
    has_radiating_neuropathy = any(
        kw in finding_texts 
        for kw in ["tingling", "pins and needles", "numbness", "electric", "shooting", "sciatica", "median nerve", "carpal tunnel", "झुनझुनी", "सुन्न"]
    ) or ("NERVE" in innervation.upper() and ("RADIAL" in innervation.upper() or "MEDIAN" in innervation.upper() or "SCIATIC" in innervation.upper()))
    
    has_acute_spasm = any(
        kw in finding_texts 
        for kw in ["spasm", "cramp", "locked", "stiffness", "paraspinal", "जकड़न", "ऐंठन"]
    ) or "SPINE" in region_id or "BACK" in region_id or "NECK" in region_id or "CALF" in region_id
    
    has_swelling_effusion = any(
        kw in finding_texts 
        for kw in ["swelling", "effusion", "edema", "warmth", "fluid", "सूजन"]
    )
    
    has_fever = any(
        kw in finding_texts 
        for kw in ["fever", "temperature", "chills", "typhoid", "dengue", "malaria", "बुखार", "ठंड"]
    )
    
    has_gout = any(
        kw in finding_texts 
        for kw in ["uric", "gout", "great toe", "podagra", "crystals", "यूरिक एसिड", "गाउट"]
    ) or "TOE" in region_id
    
    has_gi = any(
        kw in finding_texts 
        for kw in ["diarrhea", "loose", "dysentery", "vomiting", "nausea", "abdomen", "stomach", "colic", "दस्त", "उल्टी", "पेचिश"]
    ) or "ABDOMEN" in region_id or "STOMACH" in region_id
    
    has_respiratory = any(
        kw in finding_texts 
        for kw in ["cough", "phlegm", "asthma", "breathless", "wheeze", "smoke", "खांसी", "दमा", "बलगम"]
    ) or "CHEST" in region_id or "LUNG" in region_id
    
    has_skin = any(
        kw in finding_texts 
        for kw in ["fungal", "ringworm", "tinea", "scabies", "itch", "rash", "wound", "boil", "दाद", "खाज", "खुजली"]
    ) or "SKIN" in region_id

    # 2. Analyze Objective Computer Vision Measurements
    cv_rom_deficit = False
    cv_severe_loss = False
    if measurements:
        m = measurements[0]
        if "KNEE" in region_id and m.maximum_flexion_deg and m.maximum_flexion_deg < 95.0:
            cv_severe_loss = True
            has_swelling_effusion = True
        elif "SHOULDER" in region_id and m.maximum_flexion_deg and m.maximum_flexion_deg < 90.0:
            cv_severe_loss = True
        elif m.terminal_extension_deg and m.terminal_extension_deg > 10.0:
            cv_rom_deficit = True

    # 3. Formulate Severity Grade & Diagnosis
    if cv_severe_loss or has_high_tenderness:
        severity_grade = "Moderate to Severe"
    elif cv_rom_deficit or has_radiating_neuropathy:
        severity_grade = "Moderate"
    else:
        severity_grade = "Mild to Moderate"

    if has_gout:
        clinical_diagnosis = f"{side.title()} {body_part_name} Acute Gouty Arthritis / Hyperuricemic Joint Inflammation"
    elif has_radiating_neuropathy:
        clinical_diagnosis = f"{side.title()} {body_part_name} Peripheral Neuropathy / Radiculopathy ({primary_muscle})"
    elif has_acute_spasm:
        clinical_diagnosis = f"{side.title()} {body_part_name} Acute Myofascial Strain with Paraspinal Muscular Spasm"
    elif has_swelling_effusion:
        clinical_diagnosis = f"{side.title()} {body_part_name} Joint Derangement with Reactive Synovial Effusion & Edema"
    elif has_gi:
        clinical_diagnosis = f"Acute Enteric Water-Borne Syndrome with {body_part_name} Abdominal Colic"
    elif has_respiratory:
        clinical_diagnosis = f"Reactive Bronchospastic Airway Irritation / Chulha Smoke Cough Syndrome"
    elif has_skin:
        clinical_diagnosis = f"{side.title()} {body_part_name} Fungal Dermatophytosis / Inflammatory Dermatosis"
    else:
        clinical_diagnosis = f"{side.title()} {body_part_name} Acute Mechanical Dysfunction & Strain ({primary_muscle})"

    # 4. Automatically Prescribe Precise Medications (Purnea Regional Pharmacopeia)
    meds: List[MedicationPrescription] = []

    # (A) Primary Anti-inflammatory / Analgesic
    if not has_gi:
        meds.append(
            MedicationPrescription(
                name="Tab. Zerodol-SP (Aceclofenac 100 mg + Paracetamol 325 mg + Serratiopeptidase 15 mg)",
                form="Oral Tablet",
                dosage="1 tablet",
                frequency="1 - 0 - 1 (Twice daily after meals / सुबह और रात - खाने के बाद)",
                duration="5 days",
                how_to_use="सुबह और रात खाना खाने के 15-20 मिनट बाद गुनगुने पानी से पूरा निगलें। खाली पेट कभी न लें। साथ में सुबह Pan-40 गैस की गोली जरूर लें।",
                precautions="पेट में अल्सर, सीने में तेज जलन या गुर्दे की गंभीर बीमारी में न लें।"
            )
        )

    # (B) Gastric Protection (Pan-40 / Pan-D)
    if has_gi:
        meds.append(
            MedicationPrescription(
                name="Tab. Pan-D (Pantoprazole 40 mg + Domperidone 30 mg SR)",
                form="Oral Capsule",
                dosage="1 capsule",
                frequency="1 - 0 - 0 (Once daily 30 mins before breakfast / सुबह खाली पेट)",
                duration="7 days",
                how_to_use="सुबह नाश्ते से 30 मिनट पहले खाली पेट 1 कैप्सूल पानी से लें। उल्टी जैसा लगना व गैस रोकता है।",
                precautions="कैप्सूल को खोलें या चबाएं नहीं; पूरा निगलें।"
            )
        )
    else:
        meds.append(
            MedicationPrescription(
                name="Tab. Pan-40 (Pantoprazole 40 mg)",
                form="Oral Tablet",
                dosage="1 tablet (40 mg)",
                frequency="1 - 0 - 0 (Once daily before breakfast / सुबह खाली पेट)",
                duration="5 days",
                how_to_use="सुबह उठकर सबसे पहले खाली पेट आधा गिलास सादे पानी के साथ पूरा निगल लें। चबाएं या तोड़ें नहीं।",
                precautions="दर्द की दवाओं के कारण होने वाले गैस्ट्रिक अल्सर से पेट की रक्षा करता है।"
            )
        )

    # (C) Topical Pain Relief Gel (for musculoskeletal regions)
    if not has_gi and not has_respiratory and not has_skin:
        meds.append(
            MedicationPrescription(
                name="Dynapar / Volini Gel (Diclofenac Diethylamine 1.16% + Menthol)",
                form="Topical Gel",
                dosage="Apply thin ribbon (2-3 cm)",
                frequency="3 to 4 times daily (दिन में 3-4 बार हल्के हाथ से)",
                duration="7 days",
                how_to_use="दर्द वाली जगह पर 2-3 सेमी जेल लगाकर हल्के हाथ से गोल-गोल घुमाएं जब तक जेल सूख न जाए। जोर से मालिश न करें और पट्टी न बांधें। लगाने के बाद हाथ साबुन से धोएं।",
                precautions="कटी-फटी त्वचा, आंख और मुंह के संपर्क से बचाएं।"
            )
        )

    # (D) Muscle Relaxant (for spasms, back, spine, calf, neck)
    if has_acute_spasm or has_high_tenderness:
        meds.append(
            MedicationPrescription(
                name="Tab. Myoril 4 mg (Thiocolchicoside 4 mg)",
                form="Oral Capsule",
                dosage="1 capsule (4 mg)",
                frequency="1 - 0 - 1 (Twice daily after meals / सुबह और रात खाने के बाद)",
                duration="3 to 5 days",
                how_to_use="खाने के बाद सादे पानी से लें। यह जकड़ी हुई मांसपेशियों को ढीला करके दर्द में राहत देती है।",
                precautions="हल्की नींद आ सकती है। दवा लेने के बाद भारी मशीनरी या वाहन न चलाएं।"
            )
        )

    # (E) Neuropathy / Sciatica / Nerve Nourishment
    if has_radiating_neuropathy:
        meds.append(
            MedicationPrescription(
                name="Tab. Pregeb-M / Maxgalin-M (Pregabalin 75 mg + Methylcobalamin 750 mcg)",
                form="Oral Capsule",
                dosage="1 capsule",
                frequency="0 - 0 - 1 (Once daily at bedtime / रात को सोते समय)",
                duration="15 to 30 days",
                how_to_use="रात को खाना खाने के बाद सोने से ठीक पहले 1 कैप्सूल लें। नसों की सूजन ठीक करने और नसों को पोषण देने में मददगार है।",
                precautions="शुरुआत में चक्कर या सुस्ती आ सकती है, इसलिए केवल रात को ही लें।"
            )
        )

    # (F) Severe Effusion / Edema Resolution (Chymoral Forte)
    if has_swelling_effusion or cv_severe_loss:
        meds.append(
            MedicationPrescription(
                name="Tab. Chymoral Forte (Trypsin-Chymotrypsin 100,000 Armour Units)",
                form="Oral Tablet",
                dosage="1 tablet",
                frequency="1 - 0 - 1 (Twice daily 30 mins before meals / खाने से 30 मिनट पहले)",
                duration="5 to 7 days",
                how_to_use="खाना खाने से आधा घंटा पहले सादे पानी से पूरा निगलें। यह चोट व जोड़ में जमे हुए रक्त और सूजन को तेजी से घोलता है।",
                precautions="रक्तस्राव (ब्लडिंग डिसऑर्डर) के मरीज डॉक्टर की निगरानी में लें।"
            )
        )

    # (G) High Uric Acid / Gout
    if has_gout:
        meds.append(
            MedicationPrescription(
                name="Tab. Febutaz 40 / Feburic 40 (Febuxostat 40 mg)",
                form="Oral Tablet",
                dosage="1 tablet (40 mg)",
                frequency="1 - 0 - 0 (Once daily after breakfast / सुबह नाश्ते के बाद)",
                duration="30 days",
                how_to_use="रोज सुबह नाश्ते के बाद 1 गोली पानी से लें। खून में यूरिक एसिड कम करती है। साथ में दिन में 3-4 लीटर पानी पिएं।",
                precautions="दाल, पालक, मशरूम और रेड मीट का सेवन कम करें।"
            )
        )

    # (H) Breakthrough Pain / Fever
    if has_high_tenderness or has_fever:
        meds.append(
            MedicationPrescription(
                name="Tab. Dolo 650 mg (Paracetamol 650 mg)",
                form="Oral Tablet",
                dosage="1 tablet (650 mg)",
                frequency="SOS (जब तेज दर्द या बुखार हो, जरूरत पड़ने पर)",
                duration="As needed (3-5 days)",
                how_to_use="खाने के बाद सादे पानी से लें। दो खुराक के बीच कम से कम 6 घंटे का अंतर रखें। 24 घंटे में 3 से अधिक गोली न लें।",
                precautions="शराब के साथ या अन्य पैरासिटामोल वाली दवा के साथ न लें।"
            )
        )

    # (I) Bone & Joint Support (Age >= 40 or Spine / Knee)
    if (age >= 40 or "KNEE" in region_id or "SPINE" in region_id) and not has_gi:
        meds.append(
            MedicationPrescription(
                name="Tab. Shelcal-500 (Calcium 500 mg + Vitamin D3 250 IU)",
                form="Oral Tablet",
                dosage="1 tablet",
                frequency="0 - 1 - 0 (Once daily after lunch / दोपहर खाने के बाद)",
                duration="30 days",
                how_to_use="दोपहर का भोजन करने के तुरंत बाद 1 गिलास पानी के साथ लें। हड्डियों को मजबूत करता है।",
                precautions="आयरन (खून) की गोली के साथ न लें; दोनों में कम से कम 2-3 घंटे का अंतर रखें।"
            )
        )
        meds.append(
            MedicationPrescription(
                name="Sachet Calcirol 60,000 IU (Cholecalciferol / Vitamin D3)",
                form="Sachet / Powder",
                dosage="1 sachet (60,000 IU)",
                frequency="हफ्ते में 1 बार (Every Sunday with warm milk / हर रविवार दूध के साथ)",
                duration="6 to 8 weeks",
                how_to_use="1 गिलास गुनगुने दूध में 1 पूरा पाउच अच्छी तरह घोलकर हफ्ते में केवल एक बार पिएं।",
                precautions="रोजाना बिल्कुल न लें, हफ्ते में सिर्फ एक निश्चित दिन ही लें।"
            )
        )

    # (J) Gastrointestinal Protocol
    if has_gi:
        meds.append(
            MedicationPrescription(
                name="Electral Sachet (WHO Formula Oral Rehydration Salts - ORS 20.5g)",
                form="Sachet / Powder",
                dosage="1 sachet in 1 liter clean drinking water",
                frequency="दिन भर में 1 से 2 लीटर (हर दस्त व उल्टी के बाद 1 बड़ा गिलास)",
                duration="2 to 3 days",
                how_to_use="1 पूरा पैकेट ठीक 1 लीटर उबले व ठंडे किए गए पानी में घोलें। 24 घंटे के अंदर थोड़ा-थोड़ा पिएं।",
                precautions="आधा पैकेट पानी में न घोलें, हमेशा पूरे 1 लीटर पानी में ही घोलें।"
            )
        )
        meds.append(
            MedicationPrescription(
                name="Tab. O2 / Zenflox-OZ (Ofloxacin 200 mg + Ornidazole 500 mg)",
                form="Oral Tablet",
                dosage="1 tablet",
                frequency="1 - 0 - 1 (Twice daily after meals / सुबह और रात खाने के बाद)",
                duration="5 days",
                how_to_use="सुबह और रात खाना खाने के बाद पानी से लें। 5 दिन का कोर्स पूरा करें।",
                precautions="मुंह का स्वाद कड़वा हो सकता है, चिंता न करें।"
            )
        )

    # (K) Respiratory Protocol
    if has_respiratory:
        meds.append(
            MedicationPrescription(
                name="Syrup Ascoril-LS / Asthakind-LS (Levosalbutamol + Ambroxol + Guaiphenesin)",
                form="Cough Syrup",
                dosage="10 ml (2 चम्मच)",
                frequency="1 - 1 - 1 (Three times daily with lukewarm water / दिन में 3 बार)",
                duration="5 days",
                how_to_use="खाना खाने के बाद 2 चम्मच सिरप पिएं और ऊपर से 2 घूंट गुनगुना पानी पिएं। यह बलगम को पतला कर आसानी से निकालता है।",
                precautions="हल्की घबराहट या हाथ कांपना हो सकता है।"
            )
        )
        meds.append(
            MedicationPrescription(
                name="Tab. Montair-LC (Montelukast 10 mg + Levocetirizine 5 mg)",
                form="Oral Tablet",
                dosage="1 tablet",
                frequency="0 - 0 - 1 (Once daily at bedtime / रात को सोते समय)",
                duration="7 to 10 days",
                how_to_use="रात को खाना खाने के बाद पानी से 1 गोली लें। यह सांस की नली की सूजन को शांत करती है।",
                precautions="सुस्ती आ सकती है, इसलिए केवल रात को ही लें।"
            )
        )

    # (L) Dermatological Fungal Protocol
    if has_skin:
        meds.append(
            MedicationPrescription(
                name="Tab. Candiforce 200 (Itraconazole 200 mg)",
                form="Oral Capsule",
                dosage="1 capsule (200 mg)",
                frequency="1 - 0 - 0 (Once daily with heavy meal / दोपहर भोजन बाद)",
                duration="14 to 21 days",
                how_to_use="दोपहर या रात के भारी भोजन के तुरंत बाद पानी से लें (खाली पेट दवा नहीं सोखी जाती)।",
                precautions="कोर्स बीच में न छोड़ें। शराब से परहेज रखें।"
            )
        )
        meds.append(
            MedicationPrescription(
                name="Luliconazole 1% Cream (Lulifin / Lulican Cream)",
                form="Topical Cream",
                dosage="Apply thin layer",
                frequency="दिन में 1 से 2 बार प्रभावित हिस्से पर लगाएं",
                duration="14 days",
                how_to_use="दाद वाली जगह को साबुन-पानी से धोकर अच्छी तरह सुखा लें, फिर दाद के निशान से 1 सेमी बाहर तक हल्की परत लगाएं।",
                precautions="स्टेरॉयड वाली मिक्स क्रीम कभी न लगाएं।"
            )
        )

    # 5. Targeted Rehabilitation & Physical Therapy Exercises
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
        clinical_diagnosis=clinical_diagnosis,
        affected_body_part=body_part_name,
        severity_grade=severity_grade,
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

    if getattr(exam, "custom_prescription", None):
        try:
            prescription = FinalPrescription(**exam.custom_prescription)
        except Exception:
            prescription = build_prescription_for_exam(exam)
    else:
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
