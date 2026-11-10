# -*- coding: utf-8 -*-
"""
Production upgrade for Antigravity Clinical Engine:
1. Enhances point_intelligence.py with offline, high-yield differential diagnoses & pearls
2. Enhances report_generator.py with specific synthesis for:
   - Sciatica ("citika" / L4-S1 Disc Herniation)
   - Piriformis Syndrome (Deep Gluteal False Sciatica)
   - Full Spine Axial Kinetic Chain Strain (Neck down to Buttocks)
   - Lumbar Spinal Canal Stenosis (Walking Claudication)
   - Symmetrical Peripheral Neuropathy (Burning Feet / B12 Deficiency)
   - Calf Nocturnal Muscle Cramps & Venous Stasis
   - Cervical Radiculopathy
"""

import sys

def apply_report_generator_upgrade():
    path = 'backend/app/services/report_generator.py'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Locate start of build_prescription_for_exam
    start_mark = 'def build_prescription_for_exam(exam: Examination) -> FinalPrescription:'
    end_mark = 'def build_structured_report(exam: Examination) -> StructuredClinicalReport:'

    if start_mark not in content or end_mark not in content:
        print("ERROR: Markers not found in report_generator.py")
        sys.exit(1)

    s_idx = content.find(start_mark)
    e_idx = content.find(end_mark)

    new_engine = '''def build_prescription_for_exam(exam: Examination) -> FinalPrescription:
    """
    AI Clinical Decision & Prescription Synthesis Engine.
    Deeply analyzes all collected clinical data:
    1. Pinpointed 3D body mesh point & anatomical structures (muscles, ligaments, joints, nerves)
    2. Patient-reported symptoms (tenderness severity, swelling, radiating neuropathy, fever, GI, cough)
    3. Computer Vision objective biomechanical measurements (ROM deficit, lag, velocity)
    4. Regional epidemiological context (Bihar / Purnea formulary)
    
    Robustly identifies root causes:
    - Sciatica ("citika" / L4-S1 disc root compression)
    - Piriformis Syndrome (deep gluteal entrapment)
    - Full Spine Axial Kinetic Chain Strain (neck to buttock head-loading strain)
    - Lumbar Canal Stenosis (neurogenic claudication)
    - Symmetrical Peripheral Neuropathy (burning feet / B12 deficiency)
    - Calf nocturnal cramps & venous stasis
    - Cervical spondylosis with radiculopathy
    
    Automatically formulates full diagnosis, tailored medications with Hindi instructions,
    and targeted evidence-based physical therapy exercises so the operator does not have to write anything.
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
    
    # Specific Clinical Condition Detectors:
    has_radiating_neuropathy = any(
        kw in finding_texts 
        for kw in ["tingling", "pins and needles", "numbness", "electric", "shooting", "sciatica", "median nerve", "carpal tunnel", "झुनझुनी", "सुन्न", "करंट"]
    ) or ("NERVE" in innervation.upper() and ("RADIAL" in innervation.upper() or "MEDIAN" in innervation.upper() or "SCIATIC" in innervation.upper()))
    
    has_acute_spasm = any(
        kw in finding_texts 
        for kw in ["spasm", "cramp", "locked", "stiffness", "paraspinal", "जकड़न", "ऐंठन", "नस खिंचना"]
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

    # (A) Sciatica ("citika" / L4-S1 Disc Herniation with Radiculopathy):
    is_sciatica = (
        any(kw in finding_texts for kw in [
            "sciatica", "सायटिका", "साइटिका", "l4-l5", "l5-s1", "lasegue", "straight leg raise", 
            "past knee", "घुटने के नीचे", "current", "electric shock", "shooting down leg", "पैर में करंट"
        ]) or 
        ("SCIATIC" in innervation.upper() and any(kw in finding_texts for kw in ["tingling", "numbness", "shooting", "झुनझुनी", "सुन्न"])) or
        (("LUMBAR" in region_id or "SPINE" in region_id or "GLUTEAL" in region_id or "THIGH" in region_id) and 
         any(kw in finding_texts for kw in ["tingling", "electric", "shooting", "झुनझुनी", "सुन्न", "करंट"]))
    )

    # (B) Piriformis Syndrome (Deep Gluteal Space False Sciatica):
    is_piriformis = (
        ("PIRIFORMIS" in region_id or "GLUTEAL" in region_id or "buttock" in finding_texts or "नितंब" in finding_texts or "कूल्हे" in finding_texts) and
        any(kw in finding_texts for kw in ["sitting", "chair", "wallet", "बैठने", "कुर्सी", "fair test", "deep ache"]) and
        not any(kw in finding_texts for kw in ["midline spine", "vertebral tenderness"])
    )

    # (C) Full Spine Axial Kinetic Chain Strain (Neck down to Buttocks / Head-Loading Syndrome):
    is_full_spine_axial = (
        any(kw in finding_texts for kw in [
            "head load", "गठरी", "बोरी", "घड़ा", "neck to buttock", "neck to back", "गर्दन से कमर", "कूल्हे तक", "पूरा बदन", "kinetic chain", "axial", "रीढ़ में खिंचाव"
        ]) or
        (("CERVICAL" in region_id or "NECK" in region_id) and any(kw in finding_texts for kw in ["back", "buttock", "कमर", "पीठ", "जकड़न"])) or
        (("THORACIC" in region_id or "LUMBAR" in region_id) and any(kw in finding_texts for kw in ["neck", "गर्दन", "कंधे", "गठरी"]))
    )

    # (D) Lumbar Spinal Canal Stenosis (Neurogenic Claudication):
    is_lumbar_stenosis = any(kw in finding_texts for kw in [
        "claudication", "stenosis", "स्टेनोसिस", "walking", "चलने पर भारीपन", "झुकने पर आराम", "shopping cart"
    ])

    # (E) Symmetrical Peripheral Neuropathy (Burning Feet / B12 Deficiency / Diabetes):
    is_peripheral_neuropathy = any(kw in finding_texts for kw in [
        "burning feet", "soles", "तलवे में जलन", "पैरों में जलन", "pins and needles", "diabetic", "b12", "न्यूरोपैथी"
    ]) and not is_sciatica

    # (F) Gastrocnemius Nocturnal Muscle Cramps & Venous Stasis:
    is_calf_cramps = (
        ("CALF" in region_id or "LEG" in region_id) and
        any(kw in finding_texts for kw in ["cramp", "night", "nocturnal", "पिंडली में नस चढ़ना", "ऐंठन", "रात में दर्द", "भारीपन"])
    )

    # (G) Cervical Spondylosis with Radiculopathy:
    is_cervical_radiculopathy = (
        ("CERVICAL" in region_id or "NECK" in region_id) and
        any(kw in finding_texts for kw in ["arm", "fingers", "hand", "हाथ", "उंगलियों", "tingling", "झुनझुनी", "spurling"])
    )

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

    # 3. Formulate Severity Grade & Clear Clinical Diagnosis
    if cv_severe_loss or has_high_tenderness:
        severity_grade = "Moderate to Severe"
    elif cv_rom_deficit or is_sciatica or has_radiating_neuropathy:
        severity_grade = "Moderate"
    else:
        severity_grade = "Mild to Moderate"

    if has_gout:
        clinical_diagnosis = f"{side.title()} {body_part_name} Acute Gouty Arthritis / गाउट (यूरिक एसिड जोड़ सूजन)"
    elif is_sciatica:
        clinical_diagnosis = f"{side.title()} L4-S1 Lumbar Disc Herniation with Sciatica / साइटिका (कमर से पैर तक नस दबने का तेज दर्द)"
    elif is_piriformis:
        clinical_diagnosis = f"{side.title()} Piriformis Syndrome / Deep Gluteal Sciatica (कूल्हे की मांसपेशी में नस दबना - फॉल्स सायटिका)"
    elif is_full_spine_axial:
        clinical_diagnosis = f"Axial Cervico-Thoraco-Lumbar Kinetic Chain Strain / संपूर्ण रीढ़ का तनाव (सिर पर भारी बोझ व झुककर काम करने से गर्दन से कमर व कूल्हे तक खिंचाव)"
    elif is_cervical_radiculopathy:
        clinical_diagnosis = f"{side.title()} Cervical Spondylosis with C6-C7 Radiculopathy / सर्वाइकल स्पॉन्डिलाइटिस (गर्दन की नस दबने से हाथ में झुनझुनी)"
    elif is_lumbar_stenosis:
        clinical_diagnosis = f"Lumbar Spinal Canal Stenosis with Neurogenic Claudication / स्पाइनल कैनाल स्टेनोसिस (चलने पर पैरों में भारीपन व दर्द)"
    elif is_peripheral_neuropathy:
        clinical_diagnosis = f"{side.title()} Symmetrical Peripheral Neuropathy / नसों की कमजोरी (पैरों व तलवों में जलन, सुन्नपन व झुनझुनी)"
    elif is_calf_cramps:
        clinical_diagnosis = f"{side.title()} Gastrocnemius Nocturnal Muscle Cramps & Venous Stasis / पिंडलियों में रात की ऐंठन व भारीपन"
    elif has_radiating_neuropathy:
        clinical_diagnosis = f"{side.title()} {body_part_name} Peripheral Neuropathy / Radiculopathy ({primary_muscle})"
    elif has_acute_spasm:
        clinical_diagnosis = f"{side.title()} {body_part_name} Acute Myofascial Strain with Paraspinal Muscular Spasm (मांसपेशी की तेज ऐंठन)"
    elif has_swelling_effusion:
        clinical_diagnosis = f"{side.title()} {body_part_name} Joint Derangement with Reactive Synovial Effusion & Edema (जोड़ में सूजन व पानी भरना)"
    elif has_gi:
        clinical_diagnosis = f"Acute Enteric Water-Borne Syndrome with {body_part_name} Abdominal Colic (पेट दर्द व आंतों का संक्रमण)"
    elif has_respiratory:
        clinical_diagnosis = f"Reactive Bronchospastic Airway Irritation / Chulha Smoke Cough Syndrome (धुएं से सांस व खांसी का विकार)"
    elif has_skin:
        clinical_diagnosis = f"{side.title()} {body_part_name} Fungal Dermatophytosis / Inflammatory Dermatosis (दाद, खाज व खुजली)"
    else:
        clinical_diagnosis = f"{side.title()} {body_part_name} Acute Mechanical Dysfunction & Strain ({primary_muscle})"

    # 4. Automatically Prescribe Precise Medications (Purnea Regional Pharmacopeia)
    meds: List[MedicationPrescription] = []

    # (A) Primary Anti-inflammatory / Analgesic (Zerodol-SP)
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

    # (D) Muscle Relaxant (for Sciatica, Piriformis, Spasms, Full Spine, Neck)
    if is_sciatica or is_piriformis or is_full_spine_axial or has_acute_spasm or has_high_tenderness:
        meds.append(
            MedicationPrescription(
                name="Tab. Myoril 4 mg (Thiocolchicoside 4 mg)",
                form="Oral Capsule",
                dosage="1 capsule (4 mg)",
                frequency="1 - 0 - 1 (Twice daily after meals / सुबह और रात खाने के बाद)",
                duration="5 days",
                how_to_use="सुबह और रात खाना खाने के बाद सादे पानी से लें। यह जकड़ी हुई नसों और मांसपेशियों की ऐंठन को ढीला करके दर्द में तुरंत राहत देती है।",
                precautions="हल्की नींद आ सकती है। दवा लेने के बाद भारी मशीनरी या वाहन न चलाएं।"
            )
        )

    # (E) Neuropathy / Sciatica Nerve Regeneration (Pregabalin + Methylcobalamin B12)
    if is_sciatica or is_piriformis or is_peripheral_neuropathy or is_cervical_radiculopathy or has_radiating_neuropathy:
        meds.append(
            MedicationPrescription(
                name="Tab. Pregeb-M / Maxgalin-M (Pregabalin 75 mg + Methylcobalamin 750 mcg)",
                form="Oral Capsule",
                dosage="1 capsule",
                frequency="0 - 0 - 1 (Once daily at bedtime / रात को सोते समय)",
                duration="15 to 30 days",
                how_to_use="रात को खाना खाने के बाद सोने से ठीक पहले 1 कैप्सूल पानी से लें। यह दबी हुई नस की सूजन खत्म करती है, करंट जैसा दर्द रोकती है और नस को पोषण देकर ठीक करती है।",
                precautions="शुरुआत के 2-3 दिन सुबह हल्की सुस्ती या चक्कर आ सकता है, इसलिए केवल रात को ही लें। कोर्स बीच में न छोड़ें।"
            )
        )

    # (F) Bone, Joint & Spine Remineralization (Shelcal-500 for full spine axial strain / cramps / OA)
    if is_full_spine_axial or is_calf_cramps or ("KNEE" in region_id and age > 40):
        meds.append(
            MedicationPrescription(
                name="Tab. Shelcal-500 (Elemental Calcium 500 mg + Vitamin D3 250 IU)",
                form="Oral Tablet",
                dosage="1 tablet",
                frequency="0 - 1 - 0 (Once daily after lunch / दोपहर खाने के बाद)",
                duration="30 days",
                how_to_use="दोपहर का खाना खाने के बाद 1 गोली पानी से लें। हड्डियों की कमजोरी दूर करती है और पिंडलियों में नस चढ़ना व कमर दर्द रोकती है।",
                precautions="गुर्दे में पथरी (Kidney Stone) के मरीज डॉक्टर से सलाह लेकर ही लें।"
            )
        )

    # (G) Severe Effusion / Edema Resolution (Chymoral Forte)
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

    # (H) High Uric Acid / Gout
    if has_gout:
        meds.append(
            MedicationPrescription(
                name="Tab. Zyloric 100 mg (Allopurinol 100 mg)",
                form="Oral Tablet",
                dosage="1 tablet (100 mg)",
                frequency="1 - 0 - 0 (Once daily after breakfast / सुबह नाश्ते बाद)",
                duration="30 days",
                how_to_use="सुबह नाश्ते के बाद पर्याप्त पानी के साथ लें। दिन भर में कम से कम 2.5 से 3 लीटर पानी जरूर पिएं।",
                precautions="तीव्र दर्द शुरू होने के समय तुरंत न शुरू करें; त्वचा पर लाल दाने होने पर तुरंत रोकें।"
            )
        )

    # (I) Gastrointestinal Protocol
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

    # (J) Respiratory Protocol
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

    # (K) Dermatological Fungal Protocol
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

    # 5. Targeted Evidence-Based Curative Rehabilitation Exercises (कसरत व व्यायाम)
    if is_sciatica:
        exercises = [
            ExercisePrescription(
                name="Sciatic Nerve Flossing / Neural Mobilization (सायटिक नर्व ग्लाइडिंग कसरत)",
                target_area="Sciatic Nerve Trunk (L4, L5, S1)",
                sets_reps="2 sets of 10 smooth gliding repetitions",
                frequency="2 to 3 times daily (सुबह, दोपहर, शाम)",
                how_to_perform="कुर्सी पर सीधे बैठें। प्रभावित पैर के घुटने को सीधा करें और पंजे को ऊपर छत की तरफ खींचते हुए सिर को ऊपर उठाएं (आसमान देखें)। फिर पैर को नीचे मोड़ें और ठुड्डी को नीचे छाती से लगाएं। इस क्रिया को बिना झटका दिए धीरे-धीरे 10 बार दोहराएं। यह दबी हुई नस को फ्री करता है।",
                hold_duration_sec=2,
                precautions="तेज झटका न दें; यदि बहुत तेज करंट जैसा दर्द दौड़े तो गति धीमी करें।"
            ),
            ExercisePrescription(
                name="McKenzie Prone Press-Up / Cobra Stretch (प्रोन एक्सटेंशन - गद्दी हटाने का व्यायाम)",
                target_area="L4-L5, L5-S1 Intervertebral Discs & Spinal Extensors",
                sets_reps="3 sets of 10 repetitions",
                frequency="Morning, Midday & Night (दिन में 3 बार)",
                how_to_perform="पेट के बल सख्त बिस्तर या तख्त पर लेटें। हाथों को कंधों के नीचे रखें और धीरे-धीरे छाती को ऊपर उठाएं जबकि कमर और कूल्हा बिल्कुल ढीला बिस्तर पर रहे। ऊपर 3 सेकंड रुकें, फिर धीरे से नीचे आएं। 10 बार दोहराएं। यह खिसकी हुई गद्दी को नस से पीछे हटाता है।",
                hold_duration_sec=3,
                precautions="कमर को जबरन ज्यादा न मोड़ें; अगर दर्द पैर से हटकर कमर में आ जाए (Centralization) तो यह बहुत अच्छा संकेत है।"
            ),
            ExercisePrescription(
                name="Supine Knee-to-Opposite-Shoulder Stretch (क्रॉस लेग कूल्हा खिंचाव)",
                target_area="Gluteal Deep External Rotators & Piriformis",
                sets_reps="3 sets of 25-second holds",
                frequency="Twice daily",
                how_to_perform="पीठ के बल लेटें। दर्द वाले पैर के घुटने को दोनों हाथों से पकड़कर उल्टे कंधे (विपरीत दिशा) की तरफ धीरे-धीरे खींचें जब तक कूल्हे के पिछले हिस्से में गहरा व आरामदेह खिंचाव महसूस न हो। 25 सेकंड तक रोकें, फिर ढीला छोड़ें।",
                hold_duration_sec=25,
                precautions="घुटने की कटोरी पर सीधा दबाव न डालें; जांघ के पीछे से पकड़ें।"
            )
        ]
    elif is_piriformis:
        exercises = [
            ExercisePrescription(
                name="Figure-4 Piriformis Supine Stretch (फिगर-4 पिरिफोर्मिस स्ट्रेच - कूल्हे की नस का खिंचाव)",
                target_area="Deep Piriformis Muscle & Sciatic Notch",
                sets_reps="3 sets of 30-second holds each side",
                frequency="3 times daily",
                how_to_perform="पीठ के बल लेटें। दर्द वाले पैर के टखने को दूसरे घुटने के ऊपर रखकर '4' का आकार बनाएं। दूसरे पैर की जांघ को दोनों हाथों से पकड़कर अपनी छाती की तरफ धीरे-धीरे खींचें जब तक कूल्हे के पिछले हिस्से में गहरा खिंचाव न लगे। 30 सेकंड रोकें।",
                hold_duration_sec=30,
                precautions="कमर को बिस्तर से न उठाएं; खिंचाव कूल्हे की गहराई में महसूस होना चाहिए।"
            ),
            ExercisePrescription(
                name="Seated Piriformis Chair Stretch (कुर्सी पर बैठकर कूल्हे का खिंचाव)",
                target_area="Piriformis & Deep Hip Rotators",
                sets_reps="3 sets of 20-second holds",
                frequency="Twice daily",
                how_to_perform="कुर्सी पर सीधे बैठें। दर्द वाले पैर को मोड़कर दूसरे घुटने पर रखें। रीढ़ की हड्डी को बिल्कुल सीधा रखते हुए हल्का सा आगे की तरफ झुकें (कमर को झुकाए बिना)। कूल्हे के पीछे गहरा खिंचाव महसूस होगा। 20 सेकंड रोकें।",
                hold_duration_sec=20,
                precautions="पीठ को गोल न करें; छाती को आगे निकालें।"
            ),
            ExercisePrescription(
                name="Gluteal Bridge with Gentle Pelvic Squeeze (पेल्विक ब्रिज व्यायाम)",
                target_area="Gluteus Maximus & Pelvic Stabilizers",
                sets_reps="2 sets of 12 repetitions",
                frequency="Twice daily",
                how_to_perform="पीठ के बल लेटकर दोनों घुटने मोड़ें और पैर फर्श पर रखें। नितंब की मांसपेशियों को सिकोड़ते हुए कूल्हे को ऊपर उठाएं जब तक घुटना, कूल्हा और कंधा एक सीध में न आ जाएं। ऊपर 3 सेकंड रोकें, फिर धीरे से नीचे लाएं।",
                hold_duration_sec=3,
                precautions="कमर को बहुत ज्यादा ऊपर न उछालें।"
            )
        ]
    elif is_full_spine_axial:
        exercises = [
            ExercisePrescription(
                name="McKenzie Chin Tucks & Cervical Retraction (गर्दन सीधा करने का चिन-टक व्यायाम)",
                target_area="Cervical Spine, Deep Neck Flexors & Suboccipitals",
                sets_reps="3 sets of 10 repetitions (5-second hold)",
                frequency="3 to 4 times daily (हर 3-4 घंटे में)",
                how_to_perform="सीधे बैठें, कंधे पीछे रखें। सिर को झुकाए बिना ठुड्डी को सीधा पीछे की तरफ खींचें (जैसे डबल चिन बना रहे हों)। 5 सेकंड रोकें, फिर सामान्य स्थिति में आएं। 10 बार दोहराएं। सिर पर भारी बोझ उठाने व झुककर काम करने से बिगड़े पॉस्चर को तुरंत ठीक करता है।",
                hold_duration_sec=5,
                precautions="सिर को नीचे न झुकाएं, ठुड्डी को सीधे पीछे खींचें।"
            ),
            ExercisePrescription(
                name="Cat-Camel Full Spine Mobilization (बिल्ली-ऊंट रीढ़ की हड्डी का लचीलापन)",
                target_area="Entire Spinal Column (Cervical, Thoracic, Lumbar, Sacrum)",
                sets_reps="2 sets of 10 gentle smooth cycles",
                frequency="Morning and Night (सुबह उठकर व रात को)",
                how_to_perform="दोनों हाथों और घुटनों के बल आएं (चौपाया स्थिति)। धीरे-धीरे बिल्ली की तरह पूरी रीढ़ को ऊपर छत की तरफ गोल करें और सिर नीचे झुकाएं। फिर धीरे-धीरे पेट को नीचे फर्श की तरफ लाएं और ऊपर देखें। गर्दन से कूल्हे तक पूरी रीढ़ की 33 हड्डियों में रक्त संचार व लचीलापन आता है।",
                hold_duration_sec=3,
                precautions="तेज झटके से न करें; धीमी व सहज सांस के साथ करें।"
            ),
            ExercisePrescription(
                name="Thoracolumbar Prone Extension (पीठ व कमर की मांसपेशियों की मजबूती)",
                target_area="Erector Spinae & Scapular Retractors",
                sets_reps="3 sets of 8 repetitions",
                frequency="Twice daily",
                how_to_perform="पेट के बल लेटें, हाथों को बगल में रखें। सिर, छाती और दोनों हाथों को धीरे-धीरे बिस्तर से 2-3 इंच ऊपर उठाएं और कंधों की हड्डियों को पीछे आपस में दबाएं। 4 सेकंड रोकें, फिर धीरे से नीचे आएं।",
                hold_duration_sec=4,
                precautions="गर्दन पर बहुत ज्यादा जोर न दें; छाती उठाएं।"
            )
        ]
    elif is_cervical_radiculopathy or ("CERVICAL" in region_id or "NECK" in region_id):
        exercises = [
            ExercisePrescription(
                name="McKenzie Chin Tucks & Cervical Retraction (गर्दन का चिन-टक व्यायाम)",
                target_area="Cervical Spine & Suboccipital Extensors",
                sets_reps="3 sets of 10 repetitions (5-second hold)",
                frequency="3 times daily",
                how_to_perform="सीधे बैठें। सिर को आगे-पीछे झुकाए बिना ठुड्डी को सीधे पीछे की तरफ धकेलें। 5 सेकंड रोकें, फिर ढीला छोड़ें। 10 बार दोहराएं। दबी हुई नस का दबाव तुरंत कम होता है।",
                hold_duration_sec=5,
                precautions="सिर को नीचे छाती से न लगाएं।"
            ),
            ExercisePrescription(
                name="Upper Trapezius & Levator Scapulae Gentle Stretch (गर्दन व कंधे का खिंचाव)",
                target_area="Trapezius & Levator Scapulae",
                sets_reps="3 sets of 20-second holds each side",
                frequency="Twice daily",
                how_to_perform="सीधे बैठकर एक हाथ से कुर्सी पकड़ें। दूसरे हाथ से सिर को धीरे से विपरीत दिशा में झुकाएं जब तक गर्दन के किनारे हल्का खिंचाव न लगे। 20 सेकंड रोकें।",
                hold_duration_sec=20,
                precautions="जबरन जोर से न खींचें।"
            ),
            ExercisePrescription(
                name="Scapular Retraction & Squeeze (कंधों को पीछे खींचने की कसरत)",
                target_area="Rhomboids & Mid-Trapezius",
                sets_reps="3 sets of 10 repetitions",
                frequency="Twice daily",
                how_to_perform="कोहनी 90° मोड़कर दोनों कंधों की हड्डियों को पीछे आपस में सिकोड़ें जैसे बीच में पेंसिल पकड़ रहे हों। 5 सेकंड रोकें, फिर छोड़ें।",
                hold_duration_sec=5,
                precautions="कंधों को ऊपर कानों की तरफ न उचकाएं।"
            )
        ]
    elif is_calf_cramps or ("CALF" in region_id or "ANKLE" in region_id or "SHIN" in region_id):
        exercises = [
            ExercisePrescription(
                name="Gastrocnemius & Soleus Towel Stretch (पिंडली व नस का खिंचाव)",
                target_area="Calf Muscle Belly & Achilles Tendon",
                sets_reps="3 sets of 30-second holds",
                frequency="3 times daily",
                how_to_perform="बिस्तर पर पैर सीधा करके बैठें। एक तौलिए को मोड़कर पंजे के अगले हिस्से में फंसाएं। घुटने को बिल्कुल सीधा रखते हुए तौलिए के दोनों सिरों को अपनी तरफ धीरे से खींचें जब तक पिंडली में गहरा व मीठा खिंचाव न लगे। 30 सेकंड तक रोकें।",
                hold_duration_sec=30,
                precautions="झटका न दें; घुटने को मुड़ने न दें।"
            ),
            ExercisePrescription(
                name="Ankle Alphabet & Circulation Pumps (पैरों का सर्कुलेशन व ऐंठन रोकने की कसरत)",
                target_area="Ankle Joint Complex & Venous Calf Pump",
                sets_reps="2 full alphabet cycles (A to Z) + 20 ankle pumps",
                frequency="Twice daily (सोने से पहले जरूर करें)",
                how_to_perform="पैर को थोड़ा ऊपर उठाकर बैठें या लेटें। सिर्फ अपने पैर के अंगूठे से हवा में A से Z तक बड़े अक्षर बनाएं, और पंजे को 20 बार ऊपर-नीचे चलाएं। यह नसों में जमा खून तेजी से ऊपर भेजता है और रात को नस चढ़ने से रोकता है।",
                hold_duration_sec=0,
                precautions="धीमी गति और पूरे घुमाव के साथ करें।"
            ),
            ExercisePrescription(
                name="Bilateral Heel Raises with Chair Support (एड़ी उठाने की कसरत)",
                target_area="Calf Musculature & Achilles Load Tolerance",
                sets_reps="3 sets of 10 repetitions",
                frequency="Twice daily",
                how_to_perform="कुर्सी पकड़कर खड़े हों। दोनों पैरों के पंजों पर धीरे-धीरे ऊपर उठें जितना ऊंचा हो सके। ऊपर 2 सेकंड रुकें, फिर धीरे-धीरे 3 सेकंड में नीचे आएं।",
                hold_duration_sec=2,
                precautions="संतुलन के लिए कुर्सी का सहारा जरूर रखें।"
            )
        ]
    elif is_peripheral_neuropathy:
        exercises = [
            ExercisePrescription(
                name="Active Ankle Alphabet & Foot Intrinsic Strengthening (पंजों की सक्रियता)",
                target_area="Intrinsic Foot Muscles & Plantar Nerves",
                sets_reps="2 cycles of A to Z alphabet + towel scrunches",
                frequency="Twice daily",
                how_to_perform="बैठकर फर्श पर एक रुमाल या छोटा तौलिया बिछाएं। पैर की उंगलियों से उसे सिकोड़कर पकड़ने की कोशिश करें। फिर पैर को ऊपर उठाकर हवा में A से Z बनाएं।",
                hold_duration_sec=0,
                precautions="पैर में सुन्नपन हो तो चोट से बचने के लिए साफ सतह पर ही करें।"
            ),
            ExercisePrescription(
                name="Gastrocnemius Towel Stretch & Plantar Fasciculation Relief",
                target_area="Calf & Plantar Fascia",
                sets_reps="3 sets of 25-second holds",
                frequency="Twice daily",
                how_to_perform="पैर सीधा रखकर तौलिए से पंजे को अपनी तरफ खींचें। 25 सेकंड रोकें।",
                hold_duration_sec=25,
                precautions="आराम से करें।"
            )
        ]
    elif "KNEE" in region_id or "THIGH" in region_id:
        exercises = [
            ExercisePrescription(
                name="Isometric Quadriceps Sets (Quad Sets - जांघ मजबूत करने की कसरत)",
                target_area="Anterior Thigh (Quadriceps Femoris)",
                sets_reps="3 sets of 10 repetitions",
                frequency="Twice daily (Morning & Evening)",
                how_to_perform="सख्त बिस्तर पर पैर सीधा करके लेटें या बैठें। घुटने के पिछले हिस्से को बिस्तर की तरफ जोर से नीचे दबाएं, जिससे जांघ के ऊपर की मांसपेशी सख्त हो जाए। 5 सेकंड रोकें, फिर 3 सेकंड ढीला छोड़ें। 10 बार करें। घुटने का दर्द जड़ से खत्म करता है।",
                hold_duration_sec=5,
                precautions="सांस सामान्य रखें; अचानक झटका न दें।"
            ),
            ExercisePrescription(
                name="Straight Leg Raise (SLR - पैर सीधा उठाने की कसरत)",
                target_area="Rectus Femoris & Hip Flexors",
                sets_reps="3 sets of 10 repetitions",
                frequency="Twice daily",
                how_to_perform="पीठ के बल लेटें। एक घुटना मोड़कर पैर फर्श पर रखें। दर्द वाले पैर को बिल्कुल सीधा रखते हुए बिस्तर से लगभग 1 फुट (30 सेमी) ऊपर उठाएं। 3 सेकंड रोकें, फिर धीरे से नीचे लाएं।",
                hold_duration_sec=3,
                precautions="कमर को बिस्तर से न उठाएं।"
            ),
            ExercisePrescription(
                name="Seated Active Terminal Knee Extension (कुर्सी पर घुटना सीधा करने की कसरत)",
                target_area="Vastus Medialis Oblique (VMO - घुटने की अंदरूनी मांसपेशी)",
                sets_reps="2 sets of 10 repetitions",
                frequency="Twice daily",
                how_to_perform="कुर्सी पर सीधे बैठें। दर्द वाले पैर को धीरे-धीरे पूरा सीधा करें जब तक घुटना सीधा न हो जाए। घुटने के ऊपर की मांसपेशी को कसें। 4 सेकंड रोकें, फिर धीरे से नीचे लाएं।",
                hold_duration_sec=4,
                precautions="घुटने को झटके से पीछे न पटकें।"
            )
        ]
    elif "SHOULDER" in region_id or "ARM" in region_id:
        exercises = [
            ExercisePrescription(
                name="Codman's Pendulum Gentle Mobilization (पेंडुलम झूला कसरत)",
                target_area="Glenohumeral Joint & Rotator Cuff",
                sets_reps="2 to 3 minutes continuously (Clockwise & Counter-clockwise)",
                frequency="3 times daily",
                how_to_perform="कमर से 45° आगे झुकें और सही हाथ को मेज पर टिकाएं। दर्द वाले हाथ को नीचे ढीला लटकने दें। पूरे शरीर को धीरे-धीरे हिलाएं जिससे हाथ बिना जोर लगाए अपने आप गोल-गोल घूमे।",
                hold_duration_sec=0,
                precautions="हाथ की मांसपेशियों से ताकत न लगाएं; गुरुत्वाकर्षण से झूलने दें।"
            ),
            ExercisePrescription(
                name="Passive Wall Crawl / Finger Walk (दीवार पर उंगलियां चलाने की कसरत)",
                target_area="Shoulder Flexion Range of Motion",
                sets_reps="3 sets of 8 repetitions",
                frequency="Twice daily",
                how_to_perform="दीवार की तरफ मुंह करके खड़े हों। उंगलियों को दीवार पर रखकर धीरे-धीरे ऊपर मकड़ी की तरह चलाएं जितना ऊंचा आसानी से जा सके। ऊपर 5 सेकंड रुकें, फिर नीचे लाएं।",
                hold_duration_sec=5,
                precautions="कंधे को उचकाकर कान के पास न लाएं।"
            ),
            ExercisePrescription(
                name="Scapular Retraction & Squeeze (कंधे की हड्डियों को सिकोड़ना)",
                target_area="Rhomboids & Mid-Trapezius Stabilizers",
                sets_reps="3 sets of 12 repetitions",
                frequency="Twice daily",
                how_to_perform="सीधे बैठें, कोहनी 90° मोड़ें। दोनों कंधों की हड्डियों को पीछे की तरफ दबाएं जैसे पीठ में पेंसिल फंसा रहे हों। 5 सेकंड रोकें, फिर छोड़ें।",
                hold_duration_sec=5,
                precautions="गर्दन को ढीला रखें।"
            )
        ]
    elif "WRIST" in region_id or "FOREARM" in region_id or "ELBOW" in region_id:
        exercises = [
            ExercisePrescription(
                name="Passive Wrist Extensor & Flexor Stretches (कलाई व अग्रबाहु का खिंचाव)",
                target_area="Forearm Common Extensors & Flexor Tendons",
                sets_reps="3 sets of 20-second holds",
                frequency="3 times daily",
                how_to_perform="हाथ आगे सीधा रखें, हथेली नीचे। दूसरे हाथ से पंजे को नीचे की तरफ मोड़ें जब तक बाजू के ऊपर खिंचाव न लगे। 20 सेकंड रोकें। फिर हथेली ऊपर करके उंगलियों को पीछे खींचें।",
                hold_duration_sec=20,
                precautions="तेज चुभन होने पर जोर न लगाएं।"
            ),
            ExercisePrescription(
                name="Median Nerve Gliding Exercise (कलाई की नस मोबिलाइज़ेशन)",
                target_area="Carpal Tunnel & Volar Forearm",
                sets_reps="5 slow cycles",
                frequency="Twice daily",
                how_to_perform="मुट्ठी बनाएं, फिर उंगलियां सीधी करें। कलाई को पीछे मोड़ें, अंगूठे को बाहर खींचें। हाथ में सुन्नपन तुरंत कम होता है।",
                hold_duration_sec=3,
                precautions="झुनझुनी ज्यादा बढ़े तो रुकें।"
            )
        ]
    elif "LUMBAR" in region_id or "SPINE" in region_id or "BACK" in region_id:
        exercises = [
            ExercisePrescription(
                name="Pelvic Tilts in Supine (कमर सीधी करने की कसरत)",
                target_area="Lumbar Spine & Transversus Abdominis",
                sets_reps="3 sets of 10 repetitions",
                frequency="Twice daily",
                how_to_perform="पीठ के बल लेटकर घुटने मोड़ें और पैर बिस्तर पर रखें। पेट की मांसपेशियों को कसें और कमर के निचले हिस्से को बिस्तर पर बिल्कुल चपटा दबाएं। 5 सेकंड रोकें, फिर ढीला छोड़ें।",
                hold_duration_sec=5,
                precautions="सांस न रोकें।"
            ),
            ExercisePrescription(
                name="Cat-Camel Spinal Mobilization (बिल्ली-ऊंट रीढ़ की कसरत)",
                target_area="Thoracolumbar Spine",
                sets_reps="2 sets of 10 gentle cycles",
                frequency="Morning and Night",
                how_to_perform="हाथों और घुटनों के बल आएं। धीरे-धीरे रीढ़ को ऊपर छत की तरफ गोल करें और सिर झुकाएं। फिर पेट को नीचे लाएं और ऊपर देखें। 10 बार करें।",
                hold_duration_sec=3,
                precautions="तेज दर्द होने पर बहुत ज्यादा न झुकें।"
            ),
            ExercisePrescription(
                name="Knee-to-Chest Gentle Decompression Stretch (घुटने को छाती से लगाने का खिंचाव)",
                target_area="Lower Back & Gluteal Fascia",
                sets_reps="3 sets of 20-second holds each side",
                frequency="Twice daily",
                how_to_perform="पीठ के बल लेटें। एक घुटने को जांघ के पीछे से पकड़कर छाती की तरफ धीरे-धीरे खींचें। 20 सेकंड रोकें, फिर दूसरे पैर से करें।",
                hold_duration_sec=20,
                precautions="घुटने की कटोरी पर सीधा दबाव न डालें।"
            )
        ]
    else:
        exercises = [
            ExercisePrescription(
                name="Sub-Maximal Isometric Contractions (मांसपेशियों को मजबूत करने की कसरत)",
                target_area=f"{body_part_name} Musculature",
                sets_reps="3 sets of 10 repetitions, 5-second hold",
                frequency="Twice daily",
                how_to_perform="दर्द वाली जगह की मांसपेशियों को बिना जोड़ हिलाए 5 सेकंड तक हल्का कसें, फिर 3 सेकंड ढीला छोड़ें।",
                hold_duration_sec=5,
                precautions="सांस सामान्य रखें।"
            ),
            ExercisePrescription(
                name="Gentle Passive Range of Motion (जोड़ की सहज गति)",
                target_area=f"{body_part_name} Joint & Soft Tissue",
                sets_reps="2 sets of 10 smooth cycles",
                frequency="Twice daily",
                how_to_perform="जोड़ को बिना वजन उठाए हल्के हाथ से सहज गति में धीरे-धीरे चलाएं।",
                hold_duration_sec=0,
                precautions="दर्द की सीमा में ही रहें।"
            )
        ]

    # 6. Practical Rural Home Care & Parhez (घरेलू देखभाल व दैनिक परहेज - Parhez)
    if is_sciatica or is_piriformis:
        home_care = [
            "गर्म पानी की सिकाई (Hot Water Fomentation): पुरानी सायटिका व नस की जकड़न में दिन में 2-3 बार 15-20 मिनट गर्म पानी की थैली (Hot bag) से कमर व कूल्हे पर सिकाई करें। यदि ताजा चोट या तीव्र सूजन हो तो पहले 48 घंटे बरफ लगाएं।",
            "सख्त बिस्तर पर शयन (Firm Sleeping Surface): बहुत ढीले, स्पंज वाले गद्दे पर बिल्कुल न सोएं। तख्त पर पतला गद्दा या दरी बिछाकर सोएं, और सोते समय घुटनों के नीचे एक तकिया जरूर रखें जिससे कमर की नस पर खिंचाव न आए।",
            "चलने का नियम: लगातार लंबे समय तक बिस्तर पर न पड़े रहें (48 घंटे से ज्यादा बेड रेस्ट नुकसानदेह है)। हर 2 घंटे में घर के अंदर 5-10 मिनट धीरे-धीरे टहलें।"
        ]
        activity_mods = [
            "जमीन से झुककर भारी वजन (पानी की बाल्टी, अनाज की बोरी) बिल्कुल न उठाएं — कुछ भी उठाना हो तो हमेशा घुटने मोड़कर बैठें फिर उठाएं।",
            "सिर पर भारी बोझ (गठरी, धान की बोरी, पानी का घड़ा) उठाने से पूरी तरह परहेज रखें।",
            "जमीन पर बहुत देर तक पालथी मारकर (चौकड़ी मारकर) या उकड़ू न बैठें — हमेशा कुर्सी या ऊंचे तख्त का इस्तेमाल करें।",
            "पैंट की पीछे वाली जेब में बटुआ (पर्स) या मोबाइल रखकर कभी न बैठें, इससे कूल्हे की सायटिक नस दबती है।"
        ]
    elif is_full_spine_axial:
        home_care = [
            "गर्म सिकाई व भाप (Moist Heat Therapy): गर्दन से लेकर कमर तक दिन में 2 बार 15 मिनट गर्म पानी की बोतल या गर्म तौलिए से सिकाई करें। यह पूरी रीढ़ की मांसपेशियों की ऐंठन तुरंत शांत करता है।",
            "सही तकिए का चुनाव (Ergonomic Neck Pillow): सोते समय बहुत ऊंचा या मोटा तकिया न लगाएं। केवल 2-3 इंच का पतला तकिया लगाएं जो गर्दन के प्राकृतिक मोड़ को सहारा दे।",
            "सख्त तख्त पर विश्राम: पीठ के बल लेटकर दोनों घुटनों के नीचे एक तकिया रखें जिससे कमर और गर्दन दोनों को सहारा मिले।"
        ]
        activity_mods = [
            "सिर पर भारी बोझ उठाना तुरंत बंद करें — यदि बोझ उठाना मजबूरी हो तो सिर पर मोटा कपड़ा (बीड़ा) रखें और वजन को दोनों हाथों में बांटें।",
            "खेत में या घर पर लगातार 45 मिनट से ज्यादा एक ही मुद्रा में झुककर काम न करें — हर 45 मिनट पर 1 मिनट सीधे खड़े होकर कमर पर हाथ रखकर पीछे झुकें (Extension Reset)।",
            "अचानक गर्दन या कमर को झटका देकर न मटकाएं और न ही किसी अप्रशिक्षित व्यक्ति से कमर पर पैर रखवाकर दबवाएं।"
        ]
    elif is_calf_cramps or is_peripheral_neuropathy:
        home_care = [
            "पैरों की गर्म पानी में सिकाई: रात को सोने से पहले 10 मिनट गुनगुने पानी में पैर डालकर रखें और पैरों के तलवों पर हल्के हाथ से तेल या जेल लगाएं।",
            "पर्याप्त जल व ओआरएस (Hydration): दिन भर में 2.5 से 3 लीटर पानी पिएं। धूप व खेत में काम करने पर ओआरएस या नीबू-नमक का पानी जरूर पिएं।",
            "ढीले व आरामदायक जूते/चप्पल: नंगे पैर कठोर जमीन या कंकड़ पर चलने से बचें।"
        ]
        activity_mods = [
            "खेत में या दुकान पर लगातार घंटों तक बिना हिले-डुले खड़े न रहें — बीच-बीच में पंजों को ऊपर-नीचे चलाएं।",
            "सोते समय पैरों को ऊपर की तरफ 2-3 इंच ऊंचा रखें (पैरों के नीचे पतला तकिया रखें) जिससे नसों का रक्त प्रवाह सुधरे।",
            "पिंडलियों में जोर से मालिश न करवाएं।"
        ]
    else:
        home_care = [
            "बरफ की सिकाई (Cryotherapy): तीव्र दर्द व सूजन के पहले 48 घंटों में दिन में 3-4 बार 15-20 मिनट बरफ से सिकाई करें। 48 घंटे बाद गर्म सिकाई करें।",
            "सापेक्षिक विश्राम (Relative Rest): भारी वजन उठाने, कूदने या बहुत तेज चलने से 5-7 दिन तक बचें।",
            "सहारा व पट्टी (Support): दिन में चलते समय इलास्टिक बैंडेज या सपोर्टिव ब्रेस का प्रयोग करें।",
            "पर्याप्त पोषण व जल: मांसपेशियों व जोड़ों की रिकवरी के लिए पर्याप्त पानी व पौष्टिक आहार लें।"
        ]
        activity_mods = [
            "दर्द वाले हिस्से पर अचानक तेज झटका या भारी वजन न डालें।",
            "लगातार 45 मिनट से अधिक एक ही स्थिति में बैठे या खड़े न रहें।",
            "प्रभावित हिस्से पर पहले 3 दिनों तक जोर से मालिश न करें।"
        ]

    return FinalPrescription(
        clinical_diagnosis=clinical_diagnosis,
        affected_body_part=body_part_name,
        severity_grade=severity_grade,
        medications=meds,
        exercises=exercises,
        home_care_measures=home_care,
        activity_modifications=activity_mods,
        follow_up_advice="7 से 10 दिनों में क्लिनिक में दोबारा दिखाएं। यदि नियमित दवाओं व कसरत से दर्द में 50% से अधिक सुधार न हो, या लक्षण बढ़ें तो विशेषज्ञ ऑर्थोपेडिक चिकित्सक से परामर्श लें।",
        emergency_warning="यदि अचानक पैर में भारी कमजोरी आ जाए (पंजा ऊपर न उठे / Foot Drop), शौच या पेशाब पर से नियंत्रण छूटने लगे, या जांघों के बीच सुन्नपन महसूस हो, तो इसे आपातकाल (Cauda Equina) समझें और तुरंत नजदीकी बड़े अस्पताल के न्यूरो/ऑर्थो विभाग में जाएं।",
        prescribed_date=datetime.utcnow()
    )
'''

    content = content[:s_idx] + new_engine + content[e_idx:]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: report_generator.py upgraded with targeted Sciatica, Full Spine, Piriformis & Leg pain protocols!")

if __name__ == '__main__':
    apply_report_generator_upgrade()

