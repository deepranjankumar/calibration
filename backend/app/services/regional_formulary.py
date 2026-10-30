"""
Comprehensive Regional Medical Formulary for Purnea District & Kosi/Seemanchal Region, Bihar.
Addresses high-prevalence local epidemiological conditions:
1. Orthopedic, Joint, Sciatica & Gout Strains (Agrarian & physical labor)
2. Vector-Borne & Enteric Fevers (Typhoid, Malaria, Dengue)
3. Flood-Related Water-Borne Gastrointestinal Infections (Diarrhea, Dysentery, Acidity, Worms)
4. Respiratory Illnesses & Biomass Smoke Complications (COPD, Bronchitis, Asthma, Allergies)
5. Nutritional Deficiencies, Severe Anemia & Liver/Jaundice
6. Dermatological Fungal, Scabies & Mud Exposure Infections
7. Chronic Non-Communicable Diseases (Hypertension, Type 2 Diabetes, Thyroid)
8. Rural Eye, Ear & Urinary Tract Infections
"""

from typing import List, Dict, Any, Optional

PURNEA_BIHAR_FORMULARY: List[Dict[str, Any]] = [
    # 1. ORTHO
    {
        "category": "ORTHO",
        "name": "Tab. Zerodol-SP (Aceclofenac 100 mg + Paracetamol 325 mg + Serratiopeptidase 15 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet",
        "frequency": "1 - 0 - 1 (Twice daily after meals / सुबह-रात खाने के बाद)",
        "duration": "5 days",
        "indication_hi": "जोड़ों, घुटनों व मांसपेशियों के तेज दर्द व सूजन के लिए",
        "how_to_use": "सुबह और रात खाना खाने के 15-20 मिनट बाद गुनगुने पानी से पूरा निगलें। खाली पेट कभी न लें। साथ में सुबह Pan-40 गैस की गोली जरूर लें।",
        "precautions": "पेट में अल्सर, सीने में तेज जलन या गुर्दे की गंभीर बीमारी में न लें।"
    },
    {
        "category": "ORTHO",
        "name": "Tab. Dolo 650 mg (Paracetamol 650 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (650 mg)",
        "frequency": "SOS (जब तेज दर्द या बुखार हो, जरूरत पड़ने पर - 1-0-1)",
        "duration": "As needed (3-5 days)",
        "indication_hi": "हल्का-मध्यम दर्द, बदन दर्द और बुखार के लिए",
        "how_to_use": "खाने के बाद सादे पानी से लें। दो खुराक के बीच कम से कम 6 घंटे का अंतर रखें। 24 घंटे में 3 से अधिक गोली न लें।",
        "precautions": "शराब के साथ या अन्य पैरासिटामोल वाली दवा के साथ न लें।"
    },
    {
        "category": "ORTHO",
        "name": "Dynapar / Volini Gel (Diclofenac Diethylamine 1.16% + Menthol)",
        "form": "Topical Gel",
        "dosage": "Apply thin ribbon (2-3 cm)",
        "frequency": "3 to 4 times daily (दिन में 3-4 बार हल्के हाथ से)",
        "duration": "7 days",
        "indication_hi": "जोड़ों, कमर, गर्दन व मोच पर बाहरी लगाने का दर्द निवारक जेल",
        "how_to_use": "दर्द वाली जगह पर 2-3 सेमी जेल लगाकर हल्के हाथ से गोल-गोल घुमाएं जब तक जेल सूख न जाए। जोर से मालिश न करें और पट्टी न बांधें। लगाने के बाद हाथ साबुन से धोएं।",
        "precautions": "कटी-फटी त्वचा, आंख और मुंह के संपर्क से बचाएं।"
    },
    {
        "category": "ORTHO",
        "name": "Tab. Myoril 4 mg (Thiocolchicoside 4 mg)",
        "form": "Oral Capsule",
        "dosage": "1 capsule (4 mg)",
        "frequency": "1 - 0 - 1 (Twice daily after meals / सुबह और रात खाने के बाद)",
        "duration": "3 to 5 days",
        "indication_hi": "मांसपेशियों की ऐंठन, कमर में नस खिंचना व गर्दन की जकड़न",
        "how_to_use": "खाने के बाद सादे पानी से लें। यह जकड़ी हुई मांसपेशियों को ढीला करके दर्द में राहत देती है।",
        "precautions": "हल्की नींद आ सकती है। दवा लेने के बाद भारी मशीनरी या वाहन न चलाएं।"
    },
    {
        "category": "ORTHO",
        "name": "Tab. Pregeb-M / Maxgalin-M (Pregabalin 75 mg + Methylcobalamin 750 mcg)",
        "form": "Oral Capsule",
        "dosage": "1 capsule",
        "frequency": "0 - 0 - 1 (Once daily at bedtime / रात को सोते समय)",
        "duration": "15 to 30 days",
        "indication_hi": "सायटिका, नसों में करंट जैसा दर्द, झुनझुनी व सुन्नपन",
        "how_to_use": "रात को खाना खाने के बाद सोने से ठीक पहले 1 कैप्सूल लें। नसों की सूजन ठीक करने और नसों को पोषण देने में मददगार है।",
        "precautions": "शुरुआत में चक्कर या सुस्ती आ सकती है, इसलिए केवल रात को ही लें।"
    },
    {
        "category": "ORTHO",
        "name": "Tab. Shelcal-500 (Calcium 500 mg + Vitamin D3 250 IU)",
        "form": "Oral Tablet",
        "dosage": "1 tablet",
        "frequency": "0 - 1 - 0 (Once daily after lunch / दोपहर खाने के बाद)",
        "duration": "30 days",
        "indication_hi": "हड्डियों की कमजोरी, घुटने का घिसना व जोड़ों का दर्द",
        "how_to_use": "दोपहर का भोजन करने के तुरंत बाद 1 गिलास पानी के साथ लें। हड्डियों को मजबूत करता है।",
        "precautions": "आयरन (खून) की गोली के साथ न लें; दोनों में कम से कम 2-3 घंटे का अंतर रखें।"
    },
    {
        "category": "ORTHO",
        "name": "Sachet Calcirol 60,000 IU (Cholecalciferol / Vitamin D3)",
        "form": "Sachet / Powder",
        "dosage": "1 sachet (60,000 IU)",
        "frequency": "हफ्ते में 1 बार (Every Sunday with warm milk / हर रविवार दूध के साथ)",
        "duration": "6 to 8 weeks",
        "indication_hi": "विटामिन डी की भारी कमी, पूरे शरीर में दर्द व थकान",
        "how_to_use": "1 गिलास गुनगुने दूध में 1 पूरा पाउच अच्छी तरह घोलकर हफ्ते में केवल एक बार पिएं।",
        "precautions": "रोजाना बिल्कुल न लें, हफ्ते में सिर्फ एक निश्चित दिन ही लें।"
    },
    {
        "category": "ORTHO",
        "name": "Tab. Febutaz 40 / Feburic 40 (Febuxostat 40 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (40 mg)",
        "frequency": "1 - 0 - 0 (Once daily after breakfast / सुबह नाश्ते के बाद)",
        "duration": "30 days",
        "indication_hi": "गाउट (गठिया), यूरिक एसिड बढ़ना, पैर के अंगूठे व टखने में तेज चुभन व दर्द",
        "how_to_use": "रोज सुबह नाश्ते के बाद 1 गोली पानी से लें। खून में यूरिक एसिड कम करती है। साथ में दिन में 3-4 लीटर पानी पिएं।",
        "precautions": "दाल, पालक, मशरूम और रेड मीट का सेवन कम करें।"
    },
    {
        "category": "ORTHO",
        "name": "Tab. Chymoral Forte (Trypsin-Chymotrypsin 100,000 Armour Units)",
        "form": "Oral Tablet",
        "dosage": "1 tablet",
        "frequency": "1 - 0 - 1 (Twice daily 30 mins before meals / खाने से 30 मिनट पहले)",
        "duration": "5 to 7 days",
        "indication_hi": "मोच, चोट, खून जमना व जोड़ों/मांसपेशियों की अत्यधिक सूजन",
        "how_to_use": "खाना खाने से आधा घंटा पहले सादे पानी से पूरा निगलें। यह चोट के बाद जमे हुए रक्त और सूजन को तेजी से घोलता है।",
        "precautions": "रक्तस्राव (ब्लडिंग डिसऑर्डर) के मरीज डॉक्टर की निगरानी में लें।"
    },
    {
        "category": "ORTHO",
        "name": "Tab. Ultracet / Tramazac-P (Tramadol 37.5 mg + Paracetamol 325 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet",
        "frequency": "SOS (अत्यधिक असहनीय दर्द होने पर / जब साधारण दर्द की दवा से आराम न मिले)",
        "duration": "2 to 3 days",
        "indication_hi": "गंभीर असहनीय हड्डी/मांसपेशी दर्द, फैक्चर या लिगामेंट टियर का दर्द",
        "how_to_use": "केवल तब लें जब साधारण दर्द की दवा से आराम न मिले। भोजन के बाद सादे पानी से लें।",
        "precautions": "सुस्ती व चक्कर आ सकता है। गाड़ी न चलाएं। इसकी आदत पड़ सकती है, लंबे समय तक न लें।"
    },

    # 2. FEVER
    {
        "category": "FEVER",
        "name": "Tab. Taxim-O 200 / Zifi 200 (Cefixime 200 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (200 mg)",
        "frequency": "1 - 0 - 1 (Twice daily after meals / सुबह और रात खाने के बाद)",
        "duration": "7 days",
        "indication_hi": "मियादी बुखार (टाइफाइड), मूत्र मार्ग संक्रमण व गले का इन्फेक्शन",
        "how_to_use": "खाने के बाद सुबह और रात ठीक 12 घंटे के अंतर पर लें। 7 दिन का पूरा कोर्स पूरा करें, बुखार उतरने पर भी बीच में बंद न करें।",
        "precautions": "दवा का कोर्स अधूरा छोड़ने से टाइफाइड दोबारा लौट सकता है।"
    },
    {
        "category": "FEVER",
        "name": "Tab. Azithral 500 / Azee 500 (Azithromycin 500 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (500 mg)",
        "frequency": "1 - 0 - 0 (Once daily 1 hr before or 2 hrs after meals / दिन में 1 बार)",
        "duration": "3 to 5 days",
        "indication_hi": "गले में खराश, टॉन्सिल, छाती का संक्रमण व विषम ज्वर",
        "how_to_use": "दिन में एक ही निश्चित समय पर खाना खाने से 1 घंटा पहले या 2 घंटे बाद 1 पूरा गिलास पानी से लें।",
        "precautions": "एंटासिड सिरप के साथ न लें। दस्त होने पर डॉक्टर को बताएं।"
    },
    {
        "category": "FEVER",
        "name": "Tab. Falcigo Plus / Coartem (Artemether 80 mg + Lumefantrine 480 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (As per ACT 6-dose schedule)",
        "frequency": "दिन में 2 बार (दूध या वसायुक्त भोजन के साथ)",
        "duration": "3 days",
        "indication_hi": "जांच में पुष्ट फाल्सीपेरम मलेरिया (ठंड लगकर तेज बुखार व पसीना)",
        "how_to_use": "दूध, चाय या भोजन के साथ लें ताकि दवा का पूरा अवशोषण हो सके। 3 दिन में कुल 6 खुराक पूरी करें।",
        "precautions": "खून की जांच (Malarial Smear / MP Card) में मलेरिया पॉजिटिव होने पर ही लें।"
    },
    {
        "category": "FEVER",
        "name": "Tab. Lariago / Resochin (Chloroquine Phosphate 250 mg)",
        "form": "Oral Tablet",
        "dosage": "As per standard regimen (600mg stat, then 300mg at 6h, 24h, 48h)",
        "frequency": "मलेरिया कार्ड शेड्यूल अनुसार (भोजन के बाद)",
        "duration": "3 days",
        "indication_hi": "प्लाज्मोडियम विवैक्स (P. vivax) मलेरिया बुखार",
        "how_to_use": "भोजन के तुरंत बाद भरपूर पानी से लें। खाली पेट न लें।",
        "precautions": "आंख की रेटिना संबंधी बीमारी वाले मरीज डॉक्टर की सलाह से लें।"
    },
    {
        "category": "FEVER",
        "name": "Tab. Caripill / Platimax (Carica Papaya Leaf Extract 1100 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet",
        "frequency": "1 - 1 - 1 (Three times daily after food / सुबह-दोपहर-रात)",
        "duration": "5 days",
        "indication_hi": "डेंगू बुखार में प्लेटलेट्स काउंट को गिरने से बचाने व बढ़ाने हेतु",
        "how_to_use": "भोजन के बाद पानी से लें। साथ में दिन भर में 3 से 4 लीटर ओआरएस घोल, नारियल पानी और तरल पदार्थ पिएं।",
        "precautions": "यदि शरीर में कहीं से खून का रिसाव हो या प्लेटलेट्स 20,000 से कम हों तो तत्काल अस्पताल में भर्ती हों।"
    },
    {
        "category": "FEVER",
        "name": "Tab. Gudcef 200 / Monocef-O (Cefpodoxime Proxetil 200 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (200 mg)",
        "frequency": "1 - 0 - 1 (Twice daily after meals / सुबह-रात खाने के बाद)",
        "duration": "5 to 7 days",
        "indication_hi": "गंभीर बैक्टीरियल बुखार, निमोनिया, फेफड़ों व मूत्र मार्ग का संक्रमण",
        "how_to_use": "सुबह और रात खाना खाने के बाद सादे पानी से लें। 5 दिन का कोर्स पूरा करें।",
        "precautions": "एंटीबायोटिक का कोर्स बीच में अधूरा न छोड़ें।"
    },
    {
        "category": "FEVER",
        "name": "Syrup P-250 / Calpol Paediatric (Paracetamol 250 mg / 5 ml)",
        "form": "Paediatric Suspension",
        "dosage": "5 ml to 7.5 ml (वजन अनुसार 15 mg/kg)",
        "frequency": "SOS (बुखार 100°F से अधिक होने पर, दिन में 3-4 बार)",
        "duration": "2 to 3 days",
        "indication_hi": "बच्चों में तेज बुखार, सिरदर्द, बदन दर्द व सर्दी",
        "how_to_use": "शीशी को अच्छी तरह हिलाकर ड्रॉपर या ढक्कन से मापकर पिलाएं। साथ में माथे पर ताजे पानी की पट्टी रखें।",
        "precautions": "24 घंटे में 4 बार से अधिक न दें। दो खुराकों के बीच 4-6 घंटे का अंतर रखें।"
    },

    # 3. GI
    {
        "category": "GI",
        "name": "Electral Sachet (WHO Formula Oral Rehydration Salts - ORS 20.5g)",
        "form": "Sachet / Powder",
        "dosage": "1 sachet in 1 liter clean drinking water",
        "frequency": "दिन भर में 1 से 2 लीटर (हर दस्त व उल्टी के बाद 1 बड़ा गिलास)",
        "duration": "2 to 3 days",
        "indication_hi": "दस्त, उल्टी, हैजा, अत्यधिक पसीना व शरीर में पानी की कमी (डिहाइड्रेशन)",
        "how_to_use": "1 पूरा पैकेट ठीक 1 लीटर उबले व ठंडे किए गए पानी में घोलें। 24 घंटे के अंदर थोड़ा-थोड़ा पिएं। 24 घंटे बाद बचा हुआ घोल फेंक दें।",
        "precautions": "आधा पैकेट पानी में न घोलें, हमेशा पूरे 1 लीटर पानी में ही घोलें।"
    },
    {
        "category": "GI",
        "name": "Tab. O2 / Zenflox-OZ (Ofloxacin 200 mg + Ornidazole 500 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet",
        "frequency": "1 - 0 - 1 (Twice daily after meals / सुबह और रात खाने के बाद)",
        "duration": "5 days",
        "indication_hi": "दस्त, मरोड़, पेचिश, आंव आना, खूनी दस्त व दूषित पानी से पेट का संक्रमण",
        "how_to_use": "सुबह और रात खाना खाने के बाद पानी से लें। 5 दिन का कोर्स पूरा करें।",
        "precautions": "मुंह का स्वाद कड़वा हो सकता है, चिंता न करें। साथ में ओआरएस जरूर पिएं।"
    },
    {
        "category": "GI",
        "name": "Tab. Pan-40 (Pantoprazole 40 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (40 mg)",
        "frequency": "1 - 0 - 0 (Once daily before breakfast / सुबह खाली पेट)",
        "duration": "5 to 7 days",
        "indication_hi": "गैस, एसिडिटी, छाती में जलन व पेट के छालों से बचाव",
        "how_to_use": "सुबह उठकर सबसे पहले खाली पेट आधा गिलास सादे पानी के साथ पूरा निगल लें। चबाएं या तोड़ें नहीं।",
        "precautions": "दर्द की दवाओं के कारण होने वाले गैस्ट्रिक अल्सर से पेट की रक्षा करता है।"
    },
    {
        "category": "GI",
        "name": "Tab. Pan-D (Pantoprazole 40 mg + Domperidone 30 mg SR)",
        "form": "Oral Capsule",
        "dosage": "1 capsule",
        "frequency": "1 - 0 - 0 (Once daily 30 mins before breakfast / सुबह खाली पेट)",
        "duration": "7 to 14 days",
        "indication_hi": "एसिडिटी के साथ जी मिचलाना, उल्टी जैसा लगना, खट्टी डकारें व भारीपन",
        "how_to_use": "सुबह नाश्ते से 30 मिनट पहले खाली पेट 1 कैप्सूल पानी से लें।",
        "precautions": "कैप्सूल को खोलें या चबाएं नहीं; पूरा निगलें।"
    },
    {
        "category": "GI",
        "name": "Tab. Emeset 4 / Ondem 4 (Ondansetron 4 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (4 mg)",
        "frequency": "SOS (उल्टी या तेज जी मिचलाने पर, भोजन से 30 मिनट पहले)",
        "duration": "2 to 3 days",
        "indication_hi": "तीव्र उल्टी, जी घबराना व पेट के इन्फेक्शन में उल्टी रोकना",
        "how_to_use": "जीभ पर रखें, यह अपने आप घुल जाती है, या 2 घूंट पानी से निगल लें। उल्टी रुकने के बाद ओआरएस पिलाएं।",
        "precautions": "यदि उल्टी 24 घंटे में न रुके और मरीज पानी भी न रोक पाए तो आईवी ड्रिप लगवाएं।"
    },
    {
        "category": "GI",
        "name": "Tab. Redotil 100 / Racigyl 100 (Racecadotril 100 mg)",
        "form": "Oral Capsule",
        "dosage": "1 capsule (100 mg)",
        "frequency": "1 - 1 - 1 (Three times daily before meals / दिन में 3 बार)",
        "duration": "3 days",
        "indication_hi": "अत्यधिक पतला पानी जैसा दस्त (Acute Watery Diarrhea)",
        "how_to_use": "भोजन से पहले पानी से लें। यह आंतों की गति रोके बिना केवल पानी का रिसाव बंद करता है।",
        "precautions": "साथ में Electral ORS घोल पीना अनिवार्य है।"
    },
    {
        "category": "GI",
        "name": "Syrup Digene / Mucaine Gel (Antacid + Local Anesthetic Oxetacaine)",
        "form": "Oral Suspension",
        "dosage": "10 ml (2 चम्मच)",
        "frequency": "दिन में 3 बार (भोजन के 15 मिनट बाद या तेज जलन होने पर)",
        "duration": "5 to 7 days",
        "indication_hi": "पेट व छाती में तेज जलन, खट्टी डकारें व पेट का भारीपन",
        "how_to_use": "शीशी को अच्छी तरह हिलाकर 2 चम्मच बिना पानी मिलाए पिएं। पीने के तुरंत बाद पानी न पिएं।",
        "precautions": "गुर्दे के गंभीर मरीज बिना डॉक्टर के परामर्श के लंबे समय तक न लें।"
    },
    {
        "category": "GI",
        "name": "Tab. Zentel / Bandy (Albendazole 400 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (400 mg)",
        "frequency": "एक बार रात को सोते समय चबाकर खाएं (Single Dose)",
        "duration": "1 dose (repeat after 2 weeks if needed)",
        "indication_hi": "पेट के कीड़े (कृमि रोग), भूख न लगना, गुदा में खुजली व कुपोषण",
        "how_to_use": "रात को खाना खाने के बाद गोली को अच्छी तरह चबाकर खाएं। परिवार के सभी सदस्य एक साथ खाएं।",
        "precautions": "गर्भवती महिलाओं और 2 वर्ष से छोटे बच्चों को न दें।"
    },
    {
        "category": "GI",
        "name": "Tab. Bandy-Plus (Albendazole 400 mg + Ivermectin 6 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet",
        "frequency": "रात को भोजन के बाद एक बार (Single Dose)",
        "duration": "1 dose",
        "indication_hi": "पेट के गंभीर परजीवी कीड़े, फाइलेरिया रोकथाम व जिद्दी खाज (स्कैबीज)",
        "how_to_use": "रात को भोजन के बाद पानी से 1 गोली लें।",
        "precautions": "गर्भावस्था में निषेध है।"
    },
    {
        "category": "GI",
        "name": "Sachet Econorm / Darolac (Saccharomyces boulardii / Probiotics)",
        "form": "Sachet / Powder",
        "dosage": "1 sachet (250 mg)",
        "frequency": "1 - 0 - 1 (Twice daily with water or curd / सुबह-शाम)",
        "duration": "5 days",
        "indication_hi": "एंटीबायोटिक के बाद पेट खराब होना, दस्त के बाद आंतों की कमजोरी",
        "how_to_use": "आधा कप ताजे पानी या दही में घोलकर भोजन के साथ पिएं। आंतों के अच्छे जीवाणुओं को बढ़ाता है।",
        "precautions": "गर्म पानी या उबलते दूध में न मिलाएं।"
    },

    # 4. RESP
    {
        "category": "RESP",
        "name": "Syrup Ascoril-LS / Asthakind-LS (Levosalbutamol + Ambroxol + Guaiphenesin)",
        "form": "Cough Syrup",
        "dosage": "10 ml (2 चम्मच)",
        "frequency": "1 - 1 - 1 (Three times daily with lukewarm water / दिन में 3 बार)",
        "duration": "5 days",
        "indication_hi": "बलगम वाली खांसी, छाती में जकड़न व सांस लेने में घरघराहट",
        "how_to_use": "खाना खाने के बाद 2 चम्मच सिरप पिएं और ऊपर से 2 घूंट गुनगुना पानी पिएं। यह बलगम को पतला कर आसानी से निकालता है।",
        "precautions": "हल्की घबराहट या हाथ कांपना हो सकता है जो दवा असर कम होने पर ठीक हो जाता है।"
    },
    {
        "category": "RESP",
        "name": "Syrup Grilinctus / Benadryl DR (Dextromethorphan + Chlorpheniramine)",
        "form": "Cough Syrup",
        "dosage": "10 ml (2 चम्मच)",
        "frequency": "1 - 1 - 1 (Three times daily / दिन में 3 बार)",
        "duration": "5 days",
        "indication_hi": "गले में सूखी खुजली वाली खांसी, बिना बलगम वाली खांसी",
        "how_to_use": "दिन में 3 बार खाने के बाद पिएं। रात में खांसते-खांसते नींद न आने में बहुत असरदार है।",
        "precautions": "हल्की नींद आ सकती है।"
    },
    {
        "category": "RESP",
        "name": "Tab. Montair-LC (Montelukast 10 mg + Levocetirizine 5 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet",
        "frequency": "0 - 0 - 1 (Once daily at bedtime / रात को सोते समय)",
        "duration": "7 to 10 days",
        "indication_hi": "धूल-धुएं की एलर्जी, छींकें, नाक बहना व मौसमी दमा",
        "how_to_use": "रात को खाना खाने के बाद पानी से 1 गोली लें। यह नाक व सांस की नली की सूजन को शांत करती है।",
        "precautions": "सुस्ती आ सकती है, इसलिए केवल रात को ही लें।"
    },
    {
        "category": "RESP",
        "name": "Rotacaps Foracort 200 (Budesonide 200 mcg + Formoterol 6 mcg)",
        "form": "Inhaler / Rotacap",
        "dosage": "1 rotacap inhalation",
        "frequency": "1 - 0 - 1 (Twice daily via Rotahaler / सुबह व शाम)",
        "duration": "30 days",
        "indication_hi": "दमा (अस्थमा), सांस फूलना व चूल्हे के धुएं से फेफड़ों की बीमारी (COPD)",
        "how_to_use": "रोटाहेलर में कैप्सूल डालकर मुंह से पूरी ताकत से गहरी सांस अंदर खींचें, 10 सेकंड सांस रोकें। इसके बाद सादे पानी से गरारे करके थूक दें।",
        "precautions": "इनहेलर लेने के बाद मुंह में पानी भरकर कुल्ला व गरारा करना अनिवार्य है (छाले न पड़ें)।"
    },
    {
        "category": "RESP",
        "name": "Capsule Karvol Plus (Camphor + Chlorothymol + Eucalyptol + Menthol + Terpineol)",
        "form": "Inhalation Softgel",
        "dosage": "1 capsule in hot steaming water",
        "frequency": "दिन में 2 से 3 बार भाप लें (Morning & Bedtime steam inhalation)",
        "duration": "5 days",
        "indication_hi": "बंद नाक, सिर में भारीपन, जुकाम व साइनस की जकड़न",
        "how_to_use": "कैप्सूल की नोक काटकर खौलते गर्म पानी के बर्तन में निचोड़ें। तौलिया ओढ़कर 5-10 मिनट तक गहरी भाप लें। निगलना नहीं है।",
        "precautions": "यह कैप्सूल केवल भाप सूंघने के लिए है, इसे मुंह से कभी न निगलें।"
    },
    {
        "category": "RESP",
        "name": "Tab. Allegra 120 (Fexofenadine 120 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (120 mg)",
        "frequency": "1 - 0 - 0 (Once daily in morning / दिन में 1 बार)",
        "duration": "5 to 7 days",
        "indication_hi": "तेज छींकें, आंखों से पानी आना, परागकण व धूल की तीव्र एलर्जी (बिना नींद लाए)",
        "how_to_use": "सुबह नाश्ते के बाद पानी से लें। यह बिना सुस्ती या नींद लाए एलर्जी को रोकती है।",
        "precautions": "फलों के रस (संतरा/मौसमी) के साथ न लें, सादे पानी से लें।"
    },

    # 5. ANEMIA & LIVER
    {
        "category": "ANEMIA",
        "name": "Tab. Orofer-XT (Ferrous Ascorbate 100 mg + Folic Acid 1.5 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet",
        "frequency": "0 - 1 - 0 (Once daily after lunch with lemon water / दोपहर खाने के 1 घंटे बाद)",
        "duration": "60 to 90 days",
        "indication_hi": "खून की कमी (एनीमिया), हीमोग्लोबिन कम होना, चक्कर आना व कमजोरी",
        "how_to_use": "दोपहर का भोजन करने के 1 घंटे बाद नीबू पानी या सादे पानी के साथ लें (विटामिन सी आयरन को सोखने में मदद करता है)।",
        "precautions": "चाय, कॉफी या दूध के साथ बिल्कुल न लें। दवा से मल का रंग काला हो सकता है जो सामान्य है।"
    },
    {
        "category": "ANEMIA",
        "name": "Tab. Neurobion Forte / Becosules (Vitamin B-Complex + B12)",
        "form": "Oral Tablet",
        "dosage": "1 tablet",
        "frequency": "1 - 0 - 0 (Once daily after breakfast / सुबह नाश्ते के बाद)",
        "duration": "30 days",
        "indication_hi": "मुंह में छाले, नसों की कमजोरी, थकान व हाथ-पैर में जलन",
        "how_to_use": "रोज सुबह नाश्ते के बाद पानी से 1 गोली लें। शरीर को ऊर्जा देती है और नसों को मजबूत करती है।",
        "precautions": "पेशाब का रंग हल्का चमकीला पीला हो सकता है, जो सामान्य है।"
    },
    {
        "category": "ANEMIA",
        "name": "Tab. Udiliv 300 (Ursodeoxycholic Acid 300 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (300 mg)",
        "frequency": "1 - 0 - 1 (Twice daily with meals / सुबह-रात भोजन के साथ)",
        "duration": "15 to 30 days",
        "indication_hi": "पीलिया (Jaundice), लिवर में सूजन, बिलीरुबिन बढ़ना व फैटी लिवर",
        "how_to_use": "भोजन के साथ दूध या पानी से लें। पित्त के प्रवाह को सुधारकर लिवर की कोशिकाओं को ठीक करती है।",
        "precautions": "तली-भुनी चीजें, तेल, घी और शराब से पूरी तरह परहेज रखें।"
    },
    {
        "category": "ANEMIA",
        "name": "Syrup Liv.52 DS (Herbal Hepatoprotective Tonic)",
        "form": "Oral Liquid Tonic",
        "dosage": "10 ml (2 चम्मच)",
        "frequency": "1 - 0 - 1 (Twice daily before meals / सुबह-शाम खाने से पहले)",
        "duration": "30 days",
        "indication_hi": "भूख न लगना, पीलिया के बाद कमजोरी व पाचन सुधारने हेतु",
        "how_to_use": "खाना खाने से 15 मिनट पहले 2 चम्मच पिएं। भूख बढ़ाती है और लिवर को स्वस्थ रखती है।",
        "precautions": "स्वच्छ उबला हुआ पानी पिएं।"
    },
    {
        "category": "ANEMIA",
        "name": "Tab. Folvite 5 mg (Folic Acid 5 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (5 mg)",
        "frequency": "1 - 0 - 0 (Once daily in morning / रोज सुबह)",
        "duration": "60 to 90 days",
        "indication_hi": "मेगालोब्लास्टिक एनीमिया, गर्भावस्था में खून की कमी व लाल रक्त कणिकाओं की वृद्धि",
        "how_to_use": "सुबह नाश्ते के बाद पानी से लें।",
        "precautions": "नियमित रूप से लें।"
    },

    # 6. SKIN & WOUNDS
    {
        "category": "SKIN",
        "name": "Tab. Candiforce 200 (Itraconazole 200 mg)",
        "form": "Oral Capsule",
        "dosage": "1 capsule (200 mg)",
        "frequency": "1 - 0 - 0 या 1 - 0 - 1 (Once or Twice daily with heavy meal)",
        "duration": "14 to 21 days",
        "indication_hi": "पुराना जिद्दी दाद (रिंगवर्म / फंगल इन्फेक्शन), जांघों व शरीर की खुजली",
        "how_to_use": "दोपहर या रात के भारी भोजन के तुरंत बाद पानी से लें (खाली पेट यह दवा शरीर में नहीं सोखी जाती)। पूरा कोर्स 14-21 दिन करें।",
        "precautions": "बिना डॉक्टर की सलाह के कोर्स बीच में न छोड़ें। शराब से परहेज रखें।"
    },
    {
        "category": "SKIN",
        "name": "Luliconazole 1% Cream (Lulifin / Lulican Cream)",
        "form": "Topical Cream",
        "dosage": "Apply thin layer",
        "frequency": "दिन में 1 से 2 बार प्रभावित हिस्से पर लगाएं",
        "duration": "14 days",
        "indication_hi": "दाद, जांघों के बीच की फंगल खुजली व पसीने के रैश",
        "how_to_use": "दाद वाली जगह को साबुन-पानी से धोकर अच्छी तरह सुखा लें, फिर दाद के निशान से 1 सेमी बाहर तक हल्की परत लगाएं।",
        "precautions": "स्टेरॉयड वाली मिक्स क्रीम (Betnovate-C/Fourderm) कभी न लगाएं, उससे दाद शरीर में और फैल जाता है।"
    },
    {
        "category": "SKIN",
        "name": "Permethrin 5% Lotion (Scaboma / Permite Lotion)",
        "form": "Topical Lotion",
        "dosage": "1 bottle (50-60 ml) for full body application",
        "frequency": "रात को एक बार पूरे शरीर पर लगाएं, 8-12 घंटे बाद नहाएं",
        "duration": "Single application (repeat after 7 days if needed)",
        "indication_hi": "खाज (स्कैबीज / रात में उंगलियों के बीच तेज खुजली)",
        "how_to_use": "रात को सोने से पहले गर्दन से लेकर पैर के तलवों तक पूरे शरीर पर लगाएं। अगली सुबह गुनगुने पानी से नहाएं और बिस्तर की चादर व कपड़े खौलते पानी में धोकर धूप में सुखाएं।",
        "precautions": "परिवार के सभी सदस्यों को एक ही रात एक साथ यह दवा लगानी चाहिए।"
    },
    {
        "category": "SKIN",
        "name": "T-Bact Ointment (Mupirocin 2% w/w)",
        "form": "Topical Ointment",
        "dosage": "Apply small dab",
        "frequency": "दिन में 2 से 3 बार घाव/फुंसी पर लगाएं",
        "duration": "7 days",
        "indication_hi": "मवाद भरी फुंसी, बालतोड़, बैक्टीरियल इन्फेक्शन व संक्रमित घाव",
        "how_to_use": "प्रभावित जगह को साफ करके थोड़ी सी मलहम लगाएं। जरूरत पड़ने पर हल्की पट्टी बांध सकते हैं।",
        "precautions": "आंखों के अंदर न लगाएं।"
    },
    {
        "category": "SKIN",
        "name": "Betadine 10% Ointment (Povidone Iodine 10% w/w)",
        "form": "Topical Ointment",
        "dosage": "Apply sufficient layer with sterile gauze",
        "frequency": "दिन में 1 से 2 बार ड्रेसिंग के साथ",
        "duration": "5 to 7 days",
        "indication_hi": "खेत में काम करते समय कटे-छिले घाव, मखाना/जूट की चोट व एंटीसेप्टिक सुरक्षा",
        "how_to_use": "घाव को साफ पानी या नॉर्मल सलाइन से धोकर सुखाएं, फिर बीटाडीन मलहम लगाकर साफ पट्टी बांधें।",
        "precautions": "आयोडीन एलर्जी में न लगाएं।"
    },
    {
        "category": "SKIN",
        "name": "Tab. Augmentin 625 / Moxikind-CV 625 (Amoxicillin 500 mg + Clavulanic Acid 125 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (625 mg)",
        "frequency": "1 - 0 - 1 (Twice daily with meals / सुबह-रात खाने के साथ)",
        "duration": "5 to 7 days",
        "indication_hi": "गंभीर त्वचा संक्रमण, सेल्युलाइटिस, गहरा संक्रमित घाव, मवाद व फोड़ा",
        "how_to_use": "खाना खाने के ठीक बाद पानी से लें (खाली पेट लेने से पेट खराब हो सकता है)। 5 दिन का पूरा कोर्स करें।",
        "precautions": "पेनिसिलिन एलर्जी होने पर यह दवा न लें।"
    },
    {
        "category": "SKIN",
        "name": "Calamine Lotion (Calasoothe / Lacto Calamine)",
        "form": "Topical Lotion",
        "dosage": "Apply liberally with cotton",
        "frequency": "दिन में 2 से 3 बार खुजली वाले हिस्से पर लगाएं",
        "duration": "5 to 7 days",
        "indication_hi": "घमौरियां, कीड़े के काटने से लाल चकत्ते, पित्ती व तेज खुजली की जलन शांत करने हेतु",
        "how_to_use": "शीशी को हिलाकर रुई के फाहे से खुजली वाली जगह पर लगाएं और सूखने दें।",
        "precautions": "केवल बाहरी उपयोग के लिए।"
    },

    # 7. CHRONIC
    {
        "category": "CHRONIC",
        "name": "Tab. Telma 40 / Tazloc 40 (Telmisartan 40 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (40 mg)",
        "frequency": "1 - 0 - 0 (Once daily in morning / सुबह नाश्ते के बाद)",
        "duration": "Regular (नियमित / लगातार)",
        "indication_hi": "उच्च रक्तचाप (हाई ब्लड प्रेशर / BP) व हृदय व गुर्दे की सुरक्षा",
        "how_to_use": "रोज सुबह नाश्ते के बाद निश्चित समय पर 1 गोली लें। यह बीपी को 120/80 के सामान्य स्तर पर बनाए रखती है।",
        "precautions": "बीपी ठीक होने पर भी दवा अपने आप बंद न करें। खाने में नमक कम लें।"
    },
    {
        "category": "CHRONIC",
        "name": "Tab. Amlopres 5 / Stamlo 5 (Amlodipine 5 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (5 mg)",
        "frequency": "1 - 0 - 0 (Once daily in morning / रोज सुबह नाश्ते के बाद)",
        "duration": "Regular (नियमित / लगातार)",
        "indication_hi": "हाई ब्लड प्रेशर व छाती की नसों में खिंचाव (एंजाइना)",
        "how_to_use": "रोज सुबह एक निश्चित समय पर पानी के साथ लें। बीपी को नियंत्रित रखती है।",
        "precautions": "यदि टखनों या पैरों में सूजन आए तो डॉक्टर को सूचित करें।"
    },
    {
        "category": "CHRONIC",
        "name": "Tab. Glycomet 500 (Metformin 500 mg SR)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (500 mg)",
        "frequency": "1 - 0 - 1 (Twice daily after meals / सुबह और रात खाने के तुरंत बाद)",
        "duration": "Regular (नियमित / लगातार)",
        "indication_hi": "डायबिटीज (शुगर / मधुमेह) में रक्त शर्करा नियंत्रित करने हेतु",
        "how_to_use": "सुबह और रात खाना खाने के बीच में या तुरंत बाद लें। खाली पेट कभी न लें। मीठा, आलू और चावल का परहेज रखें।",
        "precautions": "खाली पेट लेने से पेट में गैस या दस्त हो सकते हैं। नियमित शुगर जांच कराते रहें।"
    },
    {
        "category": "CHRONIC",
        "name": "Tab. Glycomet-GP 1 / Amaryl-M 1 (Glimepiride 1 mg + Metformin 500 mg SR)",
        "form": "Oral Tablet",
        "dosage": "1 tablet",
        "frequency": "1 - 0 - 0 (Once daily before breakfast / सुबह नाश्ते से 15 मिनट पहले)",
        "duration": "Regular (नियमित / लगातार)",
        "indication_hi": "अनियंत्रित शुगर (Fasting > 140 mg/dl), उन्नत टाइप 2 डायबिटीज",
        "how_to_use": "सुबह का नाश्ता करने से 15-20 मिनट पहले पानी से लें। दवा लेने के बाद नाश्ता करना अनिवार्य है (शुगर कम न हो)।",
        "precautions": "दवा लेने के बाद भोजन न छोड़ने पर पसीना या चक्कर (हाइपोग्लाइसीमिया) आ सकता है; साथ में मीठी टॉफी रखें।"
    },
    {
        "category": "CHRONIC",
        "name": "Tab. Thyronorm 50 mcg (Levothyroxine Sodium 50 mcg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (50 mcg)",
        "frequency": "1 - 0 - 0 (Once daily early morning empty stomach / सुबह उठते ही खाली पेट)",
        "duration": "Regular (नियमित / लगातार)",
        "indication_hi": "थायराइड ग्रंथि की सुस्ती (हाइपोथायरायडिज्म), वजन बढ़ना, गले में सूजन व सुस्ती",
        "how_to_use": "सुबह बिस्तर से उठते ही 1 पूरा गिलास सादे पानी के साथ लें। इसके बाद कम से कम 45 मिनट तक चाय, दूध या नाश्ता न लें।",
        "precautions": "चाय या दूध के साथ कभी न लें। 3 महीने में TSH टेस्ट कराएं।"
    },
    {
        "category": "CHRONIC",
        "name": "Tab. Atorva 10 / Lipitor (Atorvastatin 10 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet (10 mg)",
        "frequency": "0 - 0 - 1 (Once daily at bedtime / रात को सोते समय)",
        "duration": "Regular (नियमित / लगातार)",
        "indication_hi": "खून में कोलेस्ट्रॉल व ट्राइग्लिसराइड्स कम करना, हार्ट अटैक व लकवा से बचाव",
        "how_to_use": "रात को खाना खाने के बाद सोने से पहले 1 गोली लें।",
        "precautions": "मांसपेशियों में अत्यधिक दर्द होने पर डॉक्टर को बताएं।"
    },

    # 8. ENT, EYE & UTI
    {
        "category": "ENT_EYE",
        "name": "Ciplox Eye/Ear Drops 0.3% (Ciprofloxacin 0.3% w/v)",
        "form": "Sterile Eye/Ear Drops",
        "dosage": "2 drops",
        "frequency": "दिन में 3 से 4 बार आंख या कान में डालें",
        "duration": "5 to 7 days",
        "indication_hi": "आंख आना (कंजंक्टिवाइटिस), आंख लाल होना, कीचड़ आना व कान बहना/दर्द",
        "how_to_use": "ड्रॉपर की नोक को हाथ से न छुएं। आंख में 2 बूंद डालकर 2 मिनट आंख बंद रखें। कान में डालकर 5 मिनट सिर तिरछा रखें।",
        "precautions": "शीशी खोलने के 1 महीने बाद बची हुई दवा का इस्तेमाल न करें।"
    },
    {
        "category": "ENT_EYE",
        "name": "Moxicip Eye Drops 0.5% (Moxifloxacin 0.5% w/v)",
        "form": "Sterile Eye/Ear Drops",
        "dosage": "1 to 2 drops",
        "frequency": "दिन में 3 बार प्रभावित आंख में डालें",
        "duration": "5 days",
        "indication_hi": "तीव्र लाल आंख, पुतली का संक्रमण व धूल-मिट्टी से आंख का गंभीर घाव",
        "how_to_use": "साफ हाथों से निचली पलक खींचकर 1-2 बूंद डालें। आंखें धीरे से बंद करें।",
        "precautions": "कॉन्टैक्ट लेंस पहनकर न डालें।"
    },
    {
        "category": "ENT_EYE",
        "name": "Tab. Norflox-TZ / Norflox 400 (Norfloxacin 400 mg + Tinidazole 600 mg)",
        "form": "Oral Tablet",
        "dosage": "1 tablet",
        "frequency": "1 - 0 - 1 (Twice daily after meals / सुबह और रात खाने के बाद)",
        "duration": "5 days",
        "indication_hi": "पेशाब में तेज जलन, बार-बार पेशाब आना (UTI) व पेट में ऐंठन",
        "how_to_use": "भोजन के बाद 1 पूरा गिलास पानी से लें। साथ में दिन में खूब पानी पिएं।",
        "precautions": "धूप में ज्यादा देर जाने से बचें।"
    },
    {
        "category": "ENT_EYE",
        "name": "Syrup Citralka (Disodium Hydrogen Citrate 1.4 g / 5 ml)",
        "form": "Oral Suspension",
        "dosage": "10 ml (2 चम्मच)",
        "frequency": "दिन में 3 बार 1 गिलास पानी में मिलाकर पिएं",
        "duration": "3 to 5 days",
        "indication_hi": "पेशाब में तेज जलन (Burning Micturition) व पेशाब का तेजाबीपन कम करने हेतु",
        "how_to_use": "2 चम्मच दवा 1 पूरे गिलास पानी में अच्छी तरह मिलाकर पिएं। कभी भी बिना पानी मिलाए सीधे न पिएं।",
        "precautions": "हमेशा पानी में घोलकर ही पिएं।"
    }
]

def get_purnea_formulary(category: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns filtered formulary list by disease category and search term."""
    results = PURNEA_BIHAR_FORMULARY
    if category and category.upper() != "ALL":
        results = [m for m in results if m["category"].upper() == category.upper()]
    if search and search.strip():
        q = search.lower().strip()
        results = [
            m for m in results
            if q in m["name"].lower()
            or q in m.get("indication_hi", "").lower()
            or q in m.get("how_to_use", "").lower()
        ]
    return results
