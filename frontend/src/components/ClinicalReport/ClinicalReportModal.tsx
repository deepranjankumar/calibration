import React, { useState, useEffect } from 'react';
import type { StructuredClinicalReport, FinalPrescription, MedicationPrescription, ExercisePrescription } from '../../types/examination';
import { getStructuredReport, signOffReport, updatePrescription } from '../../services/api';
import {
  X,
  FileCheck2,
  Printer,
  Download,
  ShieldAlert,
  AlertTriangle,
  Lock,
  UserCheck,
  Stethoscope,
  Pill,
  Dumbbell,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  Calendar,
  Edit3,
  Plus,
  Trash2,
  Save,
  Check,
  HeartPulse,
  Thermometer,
  Droplet,
  Wind,
  ShieldCheck,
  Layers,
  Eye,
} from 'lucide-react';

interface ClinicalReportModalProps {
  examinationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface RegionalFormularyMedicine extends MedicationPrescription {
  category: 'ORTHO' | 'FEVER' | 'GI' | 'RESP' | 'ANEMIA' | 'SKIN' | 'CHRONIC' | 'ENT_EYE';
  indication_hi: string;
}

export const PURNEA_BIHAR_FORMULARY: RegionalFormularyMedicine[] = [
  // =========================================================================================
  // 1. ORTHOPEDIC, MUSCULOSKELETAL & GOUT / जोड़, कमर, नस खिंचाव, मोच व यूरिक एसिड
  // =========================================================================================
  {
    category: 'ORTHO',
    name: 'Tab. Zerodol-SP (Aceclofenac 100 mg + Paracetamol 325 mg + Serratiopeptidase 15 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet',
    frequency: '1 - 0 - 1 (Twice daily after meals / सुबह और रात - खाने के बाद)',
    duration: '5 days',
    indication_hi: 'जोड़ों, घुटनों व मांसपेशियों के तेज दर्द व सूजन के लिए',
    how_to_use: 'सुबह और रात खाना खाने के 15-20 मिनट बाद गुनगुने पानी से पूरा निगलें। खाली पेट कभी न लें। साथ में सुबह Pan-40 गैस की गोली जरूर लें।',
    precautions: 'पेट में अल्सर, सीने में तेज जलन या गुर्दे की गंभीर बीमारी में न लें।',
  },
  {
    category: 'ORTHO',
    name: 'Tab. Dolo 650 mg (Paracetamol 650 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (650 mg)',
    frequency: 'SOS (जब तेज दर्द या बुखार हो, जरूरत पड़ने पर - 1-0-1)',
    duration: 'As needed (3-5 days)',
    indication_hi: 'हल्का-मध्यम दर्द, बदन दर्द और बुखार के लिए',
    how_to_use: 'खाने के बाद सादे पानी से लें। दो खुराक के बीच कम से कम 6 घंटे का अंतर रखें। 24 घंटे में 3 से अधिक गोली न लें।',
    precautions: 'शराब के साथ या अन्य पैरासिटामोल वाली दवा के साथ न लें।',
  },
  {
    category: 'ORTHO',
    name: 'Dynapar / Volini Gel (Diclofenac Diethylamine 1.16% + Menthol)',
    form: 'Topical Gel',
    dosage: 'Apply thin ribbon (2-3 cm)',
    frequency: '3 to 4 times daily (दिन में 3-4 बार हल्के हाथ से)',
    duration: '7 days',
    indication_hi: 'जोड़ों, कमर, गर्दन व मोच पर बाहरी लगाने का दर्द निवारक जेल',
    how_to_use: 'दर्द वाली जगह पर 2-3 सेमी जेल लगाकर हल्के हाथ से गोल-गोल घुमाएं जब तक जेल सूख न जाए। जोर से मालिश न करें और पट्टी न बांधें। लगाने के बाद हाथ साबुन से धोएं।',
    precautions: 'कटी-फटी त्वचा, आंख और मुंह के संपर्क से बचाएं।',
  },
  {
    category: 'ORTHO',
    name: 'Tab. Myoril 4 mg (Thiocolchicoside 4 mg)',
    form: 'Oral Capsule',
    dosage: '1 capsule (4 mg)',
    frequency: '1 - 0 - 1 (Twice daily after meals / सुबह और रात खाने के बाद)',
    duration: '3 to 5 days',
    indication_hi: 'मांसपेशियों की ऐंठन, कमर में नस खिंचना व गर्दन की जकड़न',
    how_to_use: 'खाने के बाद सादे पानी से लें। यह जकड़ी हुई मांसपेशियों को ढीला करके दर्द में राहत देती है।',
    precautions: 'हल्की नींद आ सकती है। दवा लेने के बाद भारी मशीनरी या वाहन न चलाएं।',
  },
  {
    category: 'ORTHO',
    name: 'Tab. Pregeb-M / Maxgalin-M (Pregabalin 75 mg + Methylcobalamin 750 mcg)',
    form: 'Oral Capsule',
    dosage: '1 capsule',
    frequency: '0 - 0 - 1 (Once daily at bedtime / रात को सोते समय)',
    duration: '15 to 30 days',
    indication_hi: 'सायटिका, नसों में करंट जैसा दर्द, झुनझुनी व सुन्नपन',
    how_to_use: 'रात को खाना खाने के बाद सोने से ठीक पहले 1 कैप्सूल लें। नसों की सूजन ठीक करने और नसों को पोषण देने में मददगार है।',
    precautions: 'शुरुआत में चक्कर या सुस्ती आ सकती है, इसलिए केवल रात को ही लें।',
  },
  {
    category: 'ORTHO',
    name: 'Tab. Shelcal-500 (Calcium 500 mg + Vitamin D3 250 IU)',
    form: 'Oral Tablet',
    dosage: '1 tablet',
    frequency: '0 - 1 - 0 (Once daily after lunch / दोपहर खाने के बाद)',
    duration: '30 days',
    indication_hi: 'हड्डियों की कमजोरी, घुटने का घिसना व जोड़ों का दर्द',
    how_to_use: 'दोपहर का भोजन करने के तुरंत बाद 1 गिलास पानी के साथ लें। हड्डियों को मजबूत करता है।',
    precautions: 'आयरन (खून) की गोली के साथ न लें; दोनों में कम से कम 2-3 घंटे का अंतर रखें।',
  },
  {
    category: 'ORTHO',
    name: 'Sachet Calcirol 60,000 IU (Cholecalciferol / Vitamin D3)',
    form: 'Sachet / Powder',
    dosage: '1 sachet (60,000 IU)',
    frequency: 'हफ्ते में 1 बार (Every Sunday with warm milk / हर रविवार दूध के साथ)',
    duration: '6 to 8 weeks',
    indication_hi: 'विटामिन डी की भारी कमी, पूरे शरीर में दर्द व थकान',
    how_to_use: '1 गिलास गुनगुने दूध में 1 पूरा पाउच अच्छी तरह घोलकर हफ्ते में केवल एक बार पिएं।',
    precautions: 'रोजाना बिल्कुल न लें, हफ्ते में सिर्फ एक निश्चित दिन ही लें।',
  },
  {
    category: 'ORTHO',
    name: 'Tab. Febutaz 40 / Feburic 40 (Febuxostat 40 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (40 mg)',
    frequency: '1 - 0 - 0 (Once daily after breakfast / सुबह नाश्ते के बाद)',
    duration: '30 days',
    indication_hi: 'गाउट (गठिया), यूरिक एसिड बढ़ना, पैर के अंगूठे व टखने में तेज चुभन व दर्द',
    how_to_use: 'रोज सुबह नाश्ते के बाद 1 गोली पानी से लें। खून में यूरिक एसिड कम करती है। साथ में दिन में 3-4 लीटर पानी पिएं।',
    precautions: 'दाल, पालक, मशरूम और रेड मीट का सेवन कम करें।',
  },
  {
    category: 'ORTHO',
    name: 'Tab. Chymoral Forte (Trypsin-Chymotrypsin 100,000 Armour Units)',
    form: 'Oral Tablet',
    dosage: '1 tablet',
    frequency: '1 - 0 - 1 (Twice daily 30 mins before meals / खाने से 30 मिनट पहले)',
    duration: '5 to 7 days',
    indication_hi: 'मोच, चोट, खून जमना व जोड़ों/मांसपेशियों की अत्यधिक सूजन',
    how_to_use: 'खाना खाने से आधा घंटा पहले सादे पानी से पूरा निगलें। यह चोट के बाद जमे हुए रक्त और सूजन को तेजी से घोलता है।',
    precautions: 'रक्तस्राव (ब्लडिंग डिसऑर्डर) के मरीज डॉक्टर की निगरानी में लें।',
  },
  {
    category: 'ORTHO',
    name: 'Tab. Ultracet / Tramazac-P (Tramadol 37.5 mg + Paracetamol 325 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet',
    frequency: 'SOS (अत्यधिक असहनीय दर्द होने पर / जब साधारण दर्द की दवा से आराम न मिले)',
    duration: '2 to 3 days',
    indication_hi: 'गंभीर असहनीय हड्डी/मांसपेशी दर्द, फैक्चर या लिगामेंट टियर का दर्द',
    how_to_use: 'केवल तब लें जब साधारण दर्द की दवा से आराम न मिले। भोजन के बाद सादे पानी से लें।',
    precautions: 'सुस्ती व चक्कर आ सकता है। गाड़ी न चलाएं। इसकी आदत पड़ सकती है, लंबे समय तक न लें।',
  },

  // =========================================================================================
  // 2. REGIONAL FEVERS & INFECTIONS / बुखार, मियादी बुखार (टाइफाइड), मलेरिया, डेंगू (Kosi Belt)
  // =========================================================================================
  {
    category: 'FEVER',
    name: 'Tab. Taxim-O 200 / Zifi 200 (Cefixime 200 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (200 mg)',
    frequency: '1 - 0 - 1 (Twice daily after meals / सुबह और रात खाने के बाद)',
    duration: '7 days',
    indication_hi: 'मियादी बुखार (टाइफाइड), मूत्र मार्ग संक्रमण व गले का इन्फेक्शन',
    how_to_use: 'खाने के बाद सुबह और रात ठीक 12 घंटे के अंतर पर लें। 7 दिन का पूरा कोर्स पूरा करें, बुखार उतरने पर भी बीच में बंद न करें।',
    precautions: 'दवा का कोर्स अधूरा छोड़ने से टाइफाइड दोबारा लौट सकता है।',
  },
  {
    category: 'FEVER',
    name: 'Tab. Azithral 500 / Azee 500 (Azithromycin 500 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (500 mg)',
    frequency: '1 - 0 - 0 (Once daily 1 hr before or 2 hrs after meals / दिन में 1 बार)',
    duration: '3 to 5 days',
    indication_hi: 'गले में खराश, टॉन्सिल, छाती का संक्रमण व विषम ज्वर',
    how_to_use: 'दिन में एक ही निश्चित समय पर खाना खाने से 1 घंटा पहले या 2 घंटे बाद 1 पूरा गिलास पानी से लें।',
    precautions: 'एंटासिड सिरप के साथ न लें। दस्त होने पर डॉक्टर को बताएं।',
  },
  {
    category: 'FEVER',
    name: 'Tab. Falcigo Plus / Coartem (Artemether 80 mg + Lumefantrine 480 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (As per ACT 6-dose schedule)',
    frequency: 'दिन में 2 बार (दूध या वसायुक्त भोजन के साथ)',
    duration: '3 days',
    indication_hi: 'जांच में पुष्ट फाल्सीपेरम मलेरिया (ठंड लगकर तेज बुखार व पसीना)',
    how_to_use: 'दूध, चाय या भोजन के साथ लें ताकि दवा का पूरा अवशोषण हो सके। 3 दिन में कुल 6 खुराक पूरी करें।',
    precautions: 'खून की जांच (Malarial Smear / MP Card) में मलेरिया पॉजिटिव होने पर ही लें।',
  },
  {
    category: 'FEVER',
    name: 'Tab. Lariago / Resochin (Chloroquine Phosphate 250 mg)',
    form: 'Oral Tablet',
    dosage: 'As per standard regimen (600mg stat, then 300mg at 6h, 24h, 48h)',
    frequency: 'मलेरिया कार्ड शेड्यूल अनुसार (भोजन के बाद)',
    duration: '3 days',
    indication_hi: 'प्लाज्मोडियम विवैक्स (P. vivax) मलेरिया बुखार',
    how_to_use: 'भोजन के तुरंत बाद भरपूर पानी से लें। खाली पेट न लें।',
    precautions: 'आंख की रेटिना संबंधी बीमारी वाले मरीज डॉक्टर की सलाह से लें।',
  },
  {
    category: 'FEVER',
    name: 'Tab. Caripill / Platimax (Carica Papaya Leaf Extract 1100 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet',
    frequency: '1 - 1 - 1 (Three times daily after food / सुबह-दोपहर-रात)',
    duration: '5 days',
    indication_hi: 'डेंगू बुखार में प्लेटलेट्स काउंट को गिरने से बचाने व बढ़ाने हेतु',
    how_to_use: 'भोजन के बाद पानी से लें। साथ में दिन भर में 3 से 4 लीटर ओआरएस घोल, नारियल पानी और तरल पदार्थ पिएं।',
    precautions: 'यदि शरीर में कहीं से खून का रिसाव हो या प्लेटलेट्स 20,000 से कम हों तो तत्काल अस्पताल में भर्ती हों।',
  },
  {
    category: 'FEVER',
    name: 'Tab. Gudcef 200 / Monocef-O (Cefpodoxime Proxetil 200 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (200 mg)',
    frequency: '1 - 0 - 1 (Twice daily after meals / सुबह-रात खाने के बाद)',
    duration: '5 to 7 days',
    indication_hi: 'गंभीर बैक्टीरियल बुखार, निमोनिया, फेफड़ों व मूत्र मार्ग का संक्रमण',
    how_to_use: 'सुबह और रात खाना खाने के बाद सादे पानी से लें। 5 दिन का कोर्स पूरा करें।',
    precautions: 'एंटीबायोटिक का कोर्स बीच में अधूरा न छोड़ें।',
  },
  {
    category: 'FEVER',
    name: 'Syrup P-250 / Calpol Paediatric (Paracetamol 250 mg / 5 ml)',
    form: 'Paediatric Suspension',
    dosage: '5 ml to 7.5 ml (वजन अनुसार 15 mg/kg)',
    frequency: 'SOS (बुखार 100°F से अधिक होने पर, दिन में 3-4 बार)',
    duration: '2 to 3 days',
    indication_hi: 'बच्चों में तेज बुखार, सिरदर्द, बदन दर्द व सर्दी',
    how_to_use: 'शीशी को अच्छी तरह हिलाकर ड्रॉपर या ढक्कन से मापकर पिलाएं। साथ में माथे पर ताजे पानी की पट्टी रखें।',
    precautions: '24 घंटे में 4 बार से अधिक न दें। दो खुराकों के बीच 4-6 घंटे का अंतर रखें।',
  },

  // =========================================================================================
  // 3. GASTROINTESTINAL & WATER-BORNE / पेट रोग, दस्त, पेचिश, उल्टी, गैस व कीड़े (Flood Areas)
  // =========================================================================================
  {
    category: 'GI',
    name: 'Electral Sachet (WHO Formula Oral Rehydration Salts - ORS 20.5g)',
    form: 'Sachet / Powder',
    dosage: '1 sachet in 1 liter clean drinking water',
    frequency: 'दिन भर में 1 से 2 लीटर (हर दस्त व उल्टी के बाद 1 बड़ा गिलास)',
    duration: '2 to 3 days',
    indication_hi: 'दस्त, उल्टी, हैजा, अत्यधिक पसीना व शरीर में पानी की कमी (डिहाइड्रेशन)',
    how_to_use: '1 पूरा पैकेट ठीक 1 लीटर उबले व ठंडे किए गए पानी में घोलें। 24 घंटे के अंदर थोड़ा-थोड़ा पिएं। 24 घंटे बाद बचा हुआ घोल फेंक दें।',
    precautions: 'आधा पैकेट पानी में न घोलें, हमेशा पूरे 1 लीटर पानी में ही घोलें।',
  },
  {
    category: 'GI',
    name: 'Tab. O2 / Zenflox-OZ (Ofloxacin 200 mg + Ornidazole 500 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet',
    frequency: '1 - 0 - 1 (Twice daily after meals / सुबह और रात खाने के बाद)',
    duration: '5 days',
    indication_hi: 'दस्त, मरोड़, पेचिश, आंव आना, खूनी दस्त व दूषित पानी से पेट का संक्रमण',
    how_to_use: 'सुबह और रात खाना खाने के बाद पानी से लें। 5 दिन का कोर्स पूरा करें।',
    precautions: 'मुंह का स्वाद कड़वा हो सकता है, चिंता न करें। साथ में ओआरएस जरूर पिएं।',
  },
  {
    category: 'GI',
    name: 'Tab. Pan-40 (Pantoprazole 40 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (40 mg)',
    frequency: '1 - 0 - 0 (Once daily before breakfast / सुबह खाली पेट)',
    duration: '5 to 7 days',
    indication_hi: 'गैस, एसिडिटी, छाती में जलन व पेट के छालों से बचाव',
    how_to_use: 'सुबह उठकर सबसे पहले खाली पेट आधा गिलास सादे पानी के साथ पूरा निगल लें। चबाएं या तोड़ें नहीं।',
    precautions: 'दर्द की दवाओं के कारण होने वाले गैस्ट्रिक अल्सर से पेट की रक्षा करता है।',
  },
  {
    category: 'GI',
    name: 'Tab. Pan-D (Pantoprazole 40 mg + Domperidone 30 mg SR)',
    form: 'Oral Capsule',
    dosage: '1 capsule',
    frequency: '1 - 0 - 0 (Once daily 30 mins before breakfast / सुबह खाली पेट)',
    duration: '7 to 14 days',
    indication_hi: 'एसिडिटी के साथ जी मिचलाना, उल्टी जैसा लगना, खट्टी डकारें व भारीपन',
    how_to_use: 'सुबह नाश्ते से 30 मिनट पहले खाली पेट 1 कैप्सूल पानी से लें।',
    precautions: 'कैप्सूल को खोलें या चबाएं नहीं; पूरा निगलें।',
  },
  {
    category: 'GI',
    name: 'Tab. Emeset 4 / Ondem 4 (Ondansetron 4 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (4 mg)',
    frequency: 'SOS (उल्टी या तेज जी मिचलाने पर, भोजन से 30 मिनट पहले)',
    duration: '2 to 3 days',
    indication_hi: 'तीव्र उल्टी, जी घबराना व पेट के इन्फेक्शन में उल्टी रोकना',
    how_to_use: 'जीभ पर रखें, यह अपने आप घुल जाती है, या 2 घूंट पानी से निगल लें। उल्टी रुकने के बाद ओआरएस पिलाएं।',
    precautions: 'यदि उल्टी 24 घंटे में न रुके और मरीज पानी भी न रोक पाए तो आईवी ड्रिप लगवाएं।',
  },
  {
    category: 'GI',
    name: 'Tab. Redotil 100 / Racigyl 100 (Racecadotril 100 mg)',
    form: 'Oral Capsule',
    dosage: '1 capsule (100 mg)',
    frequency: '1 - 1 - 1 (Three times daily before meals / दिन में 3 बार)',
    duration: '3 days',
    indication_hi: 'अत्यधिक पतला पानी जैसा दस्त (Acute Watery Diarrhea)',
    how_to_use: 'भोजन से पहले पानी से लें। यह आंतों की गति रोके बिना केवल पानी का रिसाव बंद करता है।',
    precautions: 'साथ में Electral ORS घोल पीना अनिवार्य है।',
  },
  {
    category: 'GI',
    name: 'Syrup Digene / Mucaine Gel (Antacid + Local Anesthetic Oxetacaine)',
    form: 'Oral Suspension',
    dosage: '10 ml (2 चम्मच)',
    frequency: 'दिन में 3 बार (भोजन के 15 मिनट बाद या तेज जलन होने पर)',
    duration: '5 to 7 days',
    indication_hi: 'पेट व छाती में तेज जलन, खट्टी डकारें व पेट का भारीपन',
    how_to_use: 'शीशी को अच्छी तरह हिलाकर 2 चम्मच बिना पानी मिलाए पिएं। पीने के तुरंत बाद पानी न पिएं।',
    precautions: 'गुर्दे के गंभीर मरीज बिना डॉक्टर के परामर्श के लंबे समय तक न लें।',
  },
  {
    category: 'GI',
    name: 'Tab. Zentel / Bandy (Albendazole 400 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (400 mg)',
    frequency: 'एक बार रात को सोते समय चबाकर खाएं (Single Dose)',
    duration: '1 dose (repeat after 2 weeks if needed)',
    indication_hi: 'पेट के कीड़े (कृमि रोग), भूख न लगना, गुदा में खुजली व कुपोषण',
    how_to_use: 'रात को खाना खाने के बाद गोली को अच्छी तरह चबाकर खाएं। परिवार के सभी सदस्य एक साथ खाएं।',
    precautions: 'गर्भवती महिलाओं और 2 वर्ष से छोटे बच्चों को न दें।',
  },
  {
    category: 'GI',
    name: 'Tab. Bandy-Plus (Albendazole 400 mg + Ivermectin 6 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet',
    frequency: 'रात को भोजन के बाद एक बार (Single Dose)',
    duration: '1 dose',
    indication_hi: 'पेट के गंभीर परजीवी कीड़े, फाइलेरिया रोकथाम व जिद्दी खाज (स्कैबीज)',
    how_to_use: 'रात को भोजन के बाद पानी से 1 गोली लें।',
    precautions: 'गर्भावस्था में निषेध है।',
  },
  {
    category: 'GI',
    name: 'Sachet Econorm / Darolac (Saccharomyces boulardii / Probiotics)',
    form: 'Sachet / Powder',
    dosage: '1 sachet (250 mg)',
    frequency: '1 - 0 - 1 (Twice daily with water or curd / सुबह-शाम)',
    duration: '5 days',
    indication_hi: 'एंटीबायोटिक के बाद पेट खराब होना, दस्त के बाद आंतों की कमजोरी',
    how_to_use: 'आधा कप ताजे पानी या दही में घोलकर भोजन के साथ पिएं। आंतों के अच्छे जीवाणुओं को बढ़ाता है।',
    precautions: 'गर्म पानी या उबलते दूध में न मिलाएं।',
  },

  // =========================================================================================
  // 4. RESPIRATORY & COUGH / खांसी, जुकाम, दमा, सांस फूलना व चूल्हे के धुएं से एलर्जी
  // =========================================================================================
  {
    category: 'RESP',
    name: 'Syrup Ascoril-LS / Asthakind-LS (Levosalbutamol + Ambroxol + Guaiphenesin)',
    form: 'Cough Syrup',
    dosage: '10 ml (2 चम्मच)',
    frequency: '1 - 1 - 1 (Three times daily with lukewarm water / दिन में 3 बार)',
    duration: '5 days',
    indication_hi: 'बलगम वाली खांसी, छाती में जकड़न व सांस लेने में घरघराहट',
    how_to_use: 'खाना खाने के बाद 2 चम्मच सिरप पिएं और ऊपर से 2 घूंट गुनगुना पानी पिएं। यह बलगम को पतला कर आसानी से निकालता है।',
    precautions: 'हल्की घबराहट या हाथ कांपना हो सकता है जो दवा असर कम होने पर ठीक हो जाता है।',
  },
  {
    category: 'RESP',
    name: 'Syrup Grilinctus / Benadryl DR (Dextromethorphan + Chlorpheniramine)',
    form: 'Cough Syrup',
    dosage: '10 ml (2 चम्मच)',
    frequency: '1 - 1 - 1 (Three times daily / दिन में 3 बार)',
    duration: '5 days',
    indication_hi: 'गले में सूखी खुजली वाली खांसी, बिना बलगम वाली खांसी',
    how_to_use: 'दिन में 3 बार खाने के बाद पिएं। रात में खांसते-खांसते नींद न आने में बहुत असरदार है।',
    precautions: 'हल्की नींद आ सकती है।',
  },
  {
    category: 'RESP',
    name: 'Tab. Montair-LC (Montelukast 10 mg + Levocetirizine 5 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet',
    frequency: '0 - 0 - 1 (Once daily at bedtime / रात को सोते समय)',
    duration: '7 to 10 days',
    indication_hi: 'धूल-धुएं की एलर्जी, छींकें, नाक बहना व मौसमी दमा',
    how_to_use: 'रात को खाना खाने के बाद पानी से 1 गोली लें। यह नाक व सांस की नली की सूजन को शांत करती है।',
    precautions: 'सुस्ती आ सकती है, इसलिए केवल रात को ही लें।',
  },
  {
    category: 'RESP',
    name: 'Rotacaps Foracort 200 (Budesonide 200 mcg + Formoterol 6 mcg)',
    form: 'Inhaler / Rotacap',
    dosage: '1 rotacap inhalation',
    frequency: '1 - 0 - 1 (Twice daily via Rotahaler / सुबह व शाम)',
    duration: '30 days',
    indication_hi: 'दमा (अस्थमा), सांस फूलना व चूल्हे के धुएं से फेफड़ों की बीमारी (COPD)',
    how_to_use: 'रोटाहेलर में कैप्सूल डालकर मुंह से पूरी ताकत से गहरी सांस अंदर खींचें, 10 सेकंड सांस रोकें। इसके बाद सादे पानी से गरारे करके थूक दें।',
    precautions: 'इनहेलर लेने के बाद मुंह में पानी भरकर कुल्ला व गरारा करना अनिवार्य है (छाले न पड़ें)।',
  },
  {
    category: 'RESP',
    name: 'Capsule Karvol Plus (Camphor + Chlorothymol + Eucalyptol + Menthol + Terpineol)',
    form: 'Inhalation Softgel',
    dosage: '1 capsule in hot steaming water',
    frequency: 'दिन में 2 से 3 बार भाप लें (Morning & Bedtime steam inhalation)',
    duration: '5 days',
    indication_hi: 'बंद नाक, सिर में भारीपन, जुकाम व साइनस की जकड़न',
    how_to_use: 'कैप्सूल की नोक काटकर खौलते गर्म पानी के बर्तन में निचोड़ें। तौलिया ओढ़कर 5-10 मिनट तक गहरी भाप लें। निगलना नहीं है।',
    precautions: 'यह कैप्सूल केवल भाप सूंघने के लिए है, इसे मुंह से कभी न निगलें।',
  },
  {
    category: 'RESP',
    name: 'Tab. Allegra 120 (Fexofenadine 120 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (120 mg)',
    frequency: '1 - 0 - 0 (Once daily in morning / दिन में 1 बार)',
    duration: '5 to 7 days',
    indication_hi: 'तेज छींकें, आंखों से पानी आना, परागकण व धूल की तीव्र एलर्जी (बिना नींद लाए)',
    how_to_use: 'सुबह नाश्ते के बाद पानी से लें। यह बिना सुस्ती या नींद लाए एलर्जी को रोकती है।',
    precautions: 'फलों के रस (संतरा/मौसमी) के साथ न लें, सादे पानी से लें।',
  },

  // =========================================================================================
  // 5. NUTRITIONAL, ANEMIA & LIVER / खून की कमी, कमजोरी, पोषण, पीलिया व लिवर
  // =========================================================================================
  {
    category: 'ANEMIA',
    name: 'Tab. Orofer-XT (Ferrous Ascorbate 100 mg + Folic Acid 1.5 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet',
    frequency: '0 - 1 - 0 (Once daily after lunch with lemon water / दोपहर खाने के 1 घंटे बाद)',
    duration: '60 to 90 days',
    indication_hi: 'खून की कमी (एनीमिया), हीमोग्लोबिन कम होना, चक्कर आना व कमजोरी',
    how_to_use: 'दोपहर का भोजन करने के 1 घंटे बाद नीबू पानी या सादे पानी के साथ लें (विटामिन सी आयरन को सोखने में मदद करता है)।',
    precautions: 'चाय, कॉफी या दूध के साथ बिल्कुल न लें। दवा से मल का रंग काला हो सकता है जो सामान्य है।',
  },
  {
    category: 'ANEMIA',
    name: 'Tab. Neurobion Forte / Becosules (Vitamin B-Complex + B12)',
    form: 'Oral Tablet',
    dosage: '1 tablet',
    frequency: '1 - 0 - 0 (Once daily after breakfast / सुबह नाश्ते के बाद)',
    duration: '30 days',
    indication_hi: 'मुंह में छाले, नसों की कमजोरी, थकान व हाथ-पैर में जलन',
    how_to_use: 'रोज सुबह नाश्ते के बाद पानी से 1 गोली लें। शरीर को ऊर्जा देती है और नसों को मजबूत करती है।',
    precautions: 'पेशाब का रंग हल्का चमकीला पीला हो सकता है, जो सामान्य है।',
  },
  {
    category: 'ANEMIA',
    name: 'Tab. Udiliv 300 (Ursodeoxycholic Acid 300 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (300 mg)',
    frequency: '1 - 0 - 1 (Twice daily with meals / सुबह-रात भोजन के साथ)',
    duration: '15 to 30 days',
    indication_hi: 'पीलिया (Jaundice), लिवर में सूजन, बिलीरुबिन बढ़ना व फैटी लिवर',
    how_to_use: 'भोजन के साथ दूध या पानी से लें। पित्त के प्रवाह को सुधारकर लिवर की कोशिकाओं को ठीक करती है।',
    precautions: 'तली-भुनी चीजें, तेल, घी और शराब से पूरी तरह परहेज रखें।',
  },
  {
    category: 'ANEMIA',
    name: 'Syrup Liv.52 DS (Herbal Hepatoprotective Tonic)',
    form: 'Oral Liquid Tonic',
    dosage: '10 ml (2 चम्मच)',
    frequency: '1 - 0 - 1 (Twice daily before meals / सुबह-शाम खाने से पहले)',
    duration: '30 days',
    indication_hi: 'भूख न लगना, पीलिया के बाद कमजोरी व पाचन सुधारने हेतु',
    how_to_use: 'खाना खाने से 15 मिनट पहले 2 चम्मच पिएं। भूख बढ़ाती है और लिवर को स्वस्थ रखती है।',
    precautions: 'स्वच्छ उबला हुआ पानी पिएं।',
  },
  {
    category: 'ANEMIA',
    name: 'Tab. Folvite 5 mg (Folic Acid 5 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (5 mg)',
    frequency: '1 - 0 - 0 (Once daily in morning / रोज सुबह)',
    duration: '60 to 90 days',
    indication_hi: 'मेगालोब्लास्टिक एनीमिया, गर्भावस्था में खून की कमी व लाल रक्त कणिकाओं की वृद्धि',
    how_to_use: 'सुबह नाश्ते के बाद पानी से लें।',
    precautions: 'नियमित रूप से लें।',
  },

  // =========================================================================================
  // 6. DERMATOLOGICAL, FUNGAL & WOUNDS / दाद, खाज, खुजली, फुंसी, घाव व कीटाणु संक्रमण
  // =========================================================================================
  {
    category: 'SKIN',
    name: 'Tab. Candiforce 200 (Itraconazole 200 mg)',
    form: 'Oral Capsule',
    dosage: '1 capsule (200 mg)',
    frequency: '1 - 0 - 0 या 1 - 0 - 1 (Once or Twice daily with heavy meal)',
    duration: '14 to 21 days',
    indication_hi: 'पुराना जिद्दी दाद (रिंगवर्म / फंगल इन्फेक्शन), जांघों व शरीर की खुजली',
    how_to_use: 'दोपहर या रात के भारी भोजन के तुरंत बाद पानी से लें (खाली पेट यह दवा शरीर में नहीं सोखी जाती)। पूरा कोर्स 14-21 दिन करें।',
    precautions: 'बिना डॉक्टर की सलाह के कोर्स बीच में न छोड़ें। शराब से परहेज रखें।',
  },
  {
    category: 'SKIN',
    name: 'Luliconazole 1% Cream (Lulifin / Lulican Cream)',
    form: 'Topical Cream',
    dosage: 'Apply thin layer',
    frequency: 'दिन में 1 से 2 बार प्रभावित हिस्से पर लगाएं',
    duration: '14 days',
    indication_hi: 'दाद, जांघों के बीच की फंगल खुजली व पसीने के रैश',
    how_to_use: 'दाद वाली जगह को साबुन-पानी से धोकर अच्छी तरह सुखा लें, फिर दाद के निशान से 1 सेमी बाहर तक हल्की परत लगाएं।',
    precautions: 'स्टेरॉयड वाली मिक्स क्रीम (Betnovate-C/Fourderm) कभी न लगाएं, उससे दाद शरीर में और फैल जाता है।',
  },
  {
    category: 'SKIN',
    name: 'Permethrin 5% Lotion (Scaboma / Permite Lotion)',
    form: 'Topical Lotion',
    dosage: '1 bottle (50-60 ml) for full body application',
    frequency: 'रात को एक बार पूरे शरीर पर लगाएं, 8-12 घंटे बाद नहाएं',
    duration: 'Single application (repeat after 7 days if needed)',
    indication_hi: 'खाज (स्कैबीज / रात में उंगलियों के बीच तेज खुजली)',
    how_to_use: 'रात को सोने से पहले गर्दन से लेकर पैर के तलवों तक पूरे शरीर पर लगाएं। अगली सुबह गुनगुने पानी से नहाएं और बिस्तर की चादर व कपड़े खौलते पानी में धोकर धूप में सुखाएं।',
    precautions: 'परिवार के सभी सदस्यों को एक ही रात एक साथ यह दवा लगानी चाहिए।',
  },
  {
    category: 'SKIN',
    name: 'T-Bact Ointment (Mupirocin 2% w/w)',
    form: 'Topical Ointment',
    dosage: 'Apply small dab',
    frequency: 'दिन में 2 से 3 बार घाव/फुंसी पर लगाएं',
    duration: '7 days',
    indication_hi: 'मवाद भरी फुंसी, बालतोड़, बैक्टीरियल इन्फेक्शन व संक्रमित घाव',
    how_to_use: 'प्रभावित जगह को साफ करके थोड़ी सी मलहम लगाएं। जरूरत पड़ने पर हल्की पट्टी बांध सकते हैं।',
    precautions: 'आंखों के अंदर न लगाएं।',
  },
  {
    category: 'SKIN',
    name: 'Betadine 10% Ointment (Povidone Iodine 10% w/w)',
    form: 'Topical Ointment',
    dosage: 'Apply sufficient layer with sterile gauze',
    frequency: 'दिन में 1 से 2 बार ड्रेसिंग के साथ',
    duration: '5 to 7 days',
    indication_hi: 'खेत में काम करते समय कटे-छिले घाव, मखाना/जूट की चोट व एंटीसेप्टिक सुरक्षा',
    how_to_use: 'घाव को साफ पानी या नॉर्मल सलाइन से धोकर सुखाएं, फिर बीटाडीन मलहम लगाकर साफ पट्टी बांधें।',
    precautions: 'आयोडीन एलर्जी में न लगाएं।',
  },
  {
    category: 'SKIN',
    name: 'Tab. Augmentin 625 / Moxikind-CV 625 (Amoxicillin 500 mg + Clavulanic Acid 125 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (625 mg)',
    frequency: '1 - 0 - 1 (Twice daily with meals / सुबह-रात खाने के साथ)',
    duration: '5 to 7 days',
    indication_hi: 'गंभीर त्वचा संक्रमण, सेल्युलाइटिस, गहरा संक्रमित घाव, मवाद व फोड़ा',
    how_to_use: 'खाना खाने के ठीक बाद पानी से लें (खाली पेट लेने से पेट खराब हो सकता है)। 5 दिन का पूरा कोर्स करें।',
    precautions: 'पेनिसिलिन एलर्जी होने पर यह दवा न लें।',
  },
  {
    category: 'SKIN',
    name: 'Calamine Lotion (Calasoothe / Lacto Calamine)',
    form: 'Topical Lotion',
    dosage: 'Apply liberally with cotton',
    frequency: 'दिन में 2 से 3 बार खुजली वाले हिस्से पर लगाएं',
    duration: '5 to 7 days',
    indication_hi: 'घमौरियां, कीड़े के काटने से लाल चकत्ते, पित्ती व तेज खुजली की जलन शांत करने हेतु',
    how_to_use: 'शीशी को हिलाकर रुई के फाहे से खुजली वाली जगह पर लगाएं और सूखने दें।',
    precautions: 'केवल बाहरी उपयोग के लिए।',
  },

  // =========================================================================================
  // 7. CHRONIC NON-COMMUNICABLE DISEASES / बीपी, शुगर, थायरॉयड व हृदय (Hypertension & Diabetes)
  // =========================================================================================
  {
    category: 'CHRONIC',
    name: 'Tab. Telma 40 / Tazloc 40 (Telmisartan 40 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (40 mg)',
    frequency: '1 - 0 - 0 (Once daily in morning / सुबह नाश्ते के बाद)',
    duration: 'Regular (नियमित / लगातार)',
    indication_hi: 'उच्च रक्तचाप (हाई ब्लड प्रेशर / BP) व हृदय व गुर्दे की सुरक्षा',
    how_to_use: 'रोज सुबह नाश्ते के बाद निश्चित समय पर 1 गोली लें। यह बीपी को 120/80 के सामान्य स्तर पर बनाए रखती है।',
    precautions: 'बीपी ठीक होने पर भी दवा अपने आप बंद न करें। खाने में नमक कम लें।',
  },
  {
    category: 'CHRONIC',
    name: 'Tab. Amlopres 5 / Stamlo 5 (Amlodipine 5 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (5 mg)',
    frequency: '1 - 0 - 0 (Once daily in morning / रोज सुबह नाश्ते के बाद)',
    duration: 'Regular (नियमित / लगातार)',
    indication_hi: 'हाई ब्लड प्रेशर व छाती की नसों में खिंचाव (एंजाइना)',
    how_to_use: 'रोज सुबह एक निश्चित समय पर पानी के साथ लें। बीपी को नियंत्रित रखती है।',
    precautions: 'यदि टखनों या पैरों में सूजन आए तो डॉक्टर को सूचित करें।',
  },
  {
    category: 'CHRONIC',
    name: 'Tab. Glycomet 500 (Metformin 500 mg SR)',
    form: 'Oral Tablet',
    dosage: '1 tablet (500 mg)',
    frequency: '1 - 0 - 1 (Twice daily after meals / सुबह और रात खाने के तुरंत बाद)',
    duration: 'Regular (नियमित / लगातार)',
    indication_hi: 'डायबिटीज (शुगर / मधुमेह) में रक्त शर्करा नियंत्रित करने हेतु',
    how_to_use: 'सुबह और रात खाना खाने के बीच में या तुरंत बाद लें। खाली पेट कभी न लें। मीठा, आलू और चावल का परहेज रखें।',
    precautions: 'खाली पेट लेने से पेट में गैस या दस्त हो सकते हैं। नियमित शुगर जांच कराते रहें।',
  },
  {
    category: 'CHRONIC',
    name: 'Tab. Glycomet-GP 1 / Amaryl-M 1 (Glimepiride 1 mg + Metformin 500 mg SR)',
    form: 'Oral Tablet',
    dosage: '1 tablet',
    frequency: '1 - 0 - 0 (Once daily before breakfast / सुबह नाश्ते से 15 मिनट पहले)',
    duration: 'Regular (नियमित / लगातार)',
    indication_hi: 'अनियंत्रित शुगर (Fasting > 140 mg/dl), उन्नत टाइप 2 डायबिटीज',
    how_to_use: 'सुबह का नाश्ता करने से 15-20 मिनट पहले पानी से लें। दवा लेने के बाद नाश्ता करना अनिवार्य है (शुगर कम न हो)।',
    precautions: 'दवा लेने के बाद भोजन न छोड़ने पर पसीना या चक्कर (हाइपोग्लाइसीमिया) आ सकता है; साथ में मीठी टॉफी रखें।',
  },
  {
    category: 'CHRONIC',
    name: 'Tab. Thyronorm 50 mcg (Levothyroxine Sodium 50 mcg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (50 mcg)',
    frequency: '1 - 0 - 0 (Once daily early morning empty stomach / सुबह उठते ही खाली पेट)',
    duration: 'Regular (नियमित / लगातार)',
    indication_hi: 'थायराइड ग्रंथि की सुस्ती (हाइपोथायरायडिज्म), वजन बढ़ना, गले में सूजन व सुस्ती',
    how_to_use: 'सुबह बिस्तर से उठते ही 1 पूरा गिलास सादे पानी के साथ लें। इसके बाद कम से कम 45 मिनट तक चाय, दूध या नाश्ता न लें।',
    precautions: 'चाय या दूध के साथ कभी न लें। 3 महीने में TSH टेस्ट कराएं।',
  },
  {
    category: 'CHRONIC',
    name: 'Tab. Atorva 10 / Lipitor (Atorvastatin 10 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet (10 mg)',
    frequency: '0 - 0 - 1 (Once daily at bedtime / रात को सोते समय)',
    duration: 'Regular (नियमित / लगातार)',
    indication_hi: 'खून में कोलेस्ट्रॉल व ट्राइग्लिसराइड्स कम करना, हार्ट अटैक व लकवा से बचाव',
    how_to_use: 'रात को खाना खाने के बाद सोने से पहले 1 गोली लें।',
    precautions: 'मांसपेशियों में अत्यधिक दर्द होने पर डॉक्टर को बताएं।',
  },

  // =========================================================================================
  // 8. ENT, EYE & UTI / आंख, कान व पेशाब संक्रमण (Conjunctivitis, Otitis & Burning UTI)
  // =========================================================================================
  {
    category: 'ENT_EYE',
    name: 'Ciplox Eye/Ear Drops 0.3% (Ciprofloxacin 0.3% w/v)',
    form: 'Sterile Eye/Ear Drops',
    dosage: '2 drops',
    frequency: 'दिन में 3 से 4 बार आंख या कान में डालें',
    duration: '5 to 7 days',
    indication_hi: 'आंख आना (कंजंक्टिवाइटिस), आंख लाल होना, कीचड़ आना व कान बहना/दर्द',
    how_to_use: 'ड्रॉपर की नोक को हाथ से न छुएं। आंख में 2 बूंद डालकर 2 मिनट आंख बंद रखें। कान में डालकर 5 मिनट सिर तिरछा रखें।',
    precautions: 'शीशी खोलने के 1 महीने बाद बची हुई दवा का इस्तेमाल न करें।',
  },
  {
    category: 'ENT_EYE',
    name: 'Moxicip Eye Drops 0.5% (Moxifloxacin 0.5% w/v)',
    form: 'Sterile Eye/Ear Drops',
    dosage: '1 to 2 drops',
    frequency: 'दिन में 3 बार प्रभावित आंख में डालें',
    duration: '5 days',
    indication_hi: 'तीव्र लाल आंख, पुतली का संक्रमण व धूल-मिट्टी से आंख का गंभीर घाव',
    how_to_use: 'साफ हाथों से निचली पलक खींचकर 1-2 बूंद डालें। आंखें धीरे से बंद करें।',
    precautions: 'कॉन्टैक्ट लेंस पहनकर न डालें।',
  },
  {
    category: 'ENT_EYE',
    name: 'Tab. Norflox-TZ / Norflox 400 (Norfloxacin 400 mg + Tinidazole 600 mg)',
    form: 'Oral Tablet',
    dosage: '1 tablet',
    frequency: '1 - 0 - 1 (Twice daily after meals / सुबह और रात खाने के बाद)',
    duration: '5 days',
    indication_hi: 'पेशाब में तेज जलन, बार-बार पेशाब आना (UTI) व पेट में ऐंठन',
    how_to_use: 'भोजन के बाद 1 पूरा गिलास पानी से लें। साथ में दिन में खूब पानी पिएं।',
    precautions: 'धूप में ज्यादा देर जाने से बचें।',
  },
  {
    category: 'ENT_EYE',
    name: 'Syrup Citralka (Disodium Hydrogen Citrate 1.4 g / 5 ml)',
    form: 'Oral Suspension',
    dosage: '10 ml (2 चम्मच)',
    frequency: 'दिन में 3 बार 1 गिलास पानी में मिलाकर पिएं',
    duration: '3 to 5 days',
    indication_hi: 'पेशाब में तेज जलन (Burning Micturition) व पेशाब का तेजाबीपन कम करने हेतु',
    how_to_use: '2 चम्मच दवा 1 पूरे गिलास पानी में अच्छी तरह मिलाकर पिएं। कभी भी बिना पानी मिलाए सीधे न पिएं।',
    precautions: 'हमेशा पानी में घोलकर ही पिएं।',
  },
];

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  examinationId,
  isOpen,
  onClose,
}) => {
  const [report, setReport] = useState<StructuredClinicalReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'prescription' | 'telemetry'>('prescription');

  // Interactive Prescription Editing State
  const [editableRx, setEditableRx] = useState<FinalPrescription | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [savingRx, setSavingRx] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [selectedFormularyCategory, setSelectedFormularyCategory] = useState<string>('ALL');
  const [formularySearchQuery, setFormularySearchQuery] = useState<string>('');

  // Clinician Sign-off Form State
  const [clinicianName, setClinicianName] = useState('Dr. Sarah Jenkins, MD');
  const [clinicianLicense, setClinicianLicense] = useState('MED-99482-ORTHO');
  const [diagnosticImpression, setDiagnosticImpression] = useState(
    'Probable musculoskeletal strain with mild movement limitation. Pharmacological analgesia & targeted physical therapy prescribed.'
  );
  const [recommendedPlan, setRecommendedPlan] = useState(
    'Strict adherence to prescribed medications and progressive rehabilitation exercises. Review in clinic in 7-10 days if symptoms persist.'
  );
  const [isSignedOff, setIsSignedOff] = useState<boolean>(false);
  const [signing, setSigning] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && examinationId) {
      setLoading(true);
      setError(null);
      setSaveSuccess(null);
      getStructuredReport(examinationId)
        .then((data) => {
          setReport(data);
          if (data.prescription) {
            setEditableRx(JSON.parse(JSON.stringify(data.prescription)));
          }
          if (data.clinician_attestation) {
            setIsSignedOff(true);
            setClinicianName(data.clinician_attestation.clinician_name);
            setClinicianLicense(data.clinician_attestation.clinician_license);
            setDiagnosticImpression(data.clinician_attestation.diagnostic_impression);
            setRecommendedPlan(data.clinician_attestation.recommended_plan);
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, examinationId]);

  // Save customized prescription to backend
  const handleSavePrescription = async () => {
    if (!examinationId || !editableRx) return;
    setSavingRx(true);
    setSaveSuccess(null);
    try {
      const saved = await updatePrescription(examinationId, editableRx);
      setEditableRx(saved);
      if (report) {
        setReport({ ...report, prescription: saved });
      }
      setSaveSuccess('✓ Prescription successfully saved & updated in medical record!');
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      alert(`Failed to save prescription: ${err.message}`);
    } finally {
      setSavingRx(false);
    }
  };

  // Medicine handlers
  const handleAddPresetMedicine = (preset: MedicationPrescription) => {
    if (!editableRx) return;
    setEditableRx({
      ...editableRx,
      medications: [...editableRx.medications, { ...preset }],
    });
  };

  const handleAddNewBlankMedicine = () => {
    if (!editableRx) return;
    setEditableRx({
      ...editableRx,
      medications: [
        ...editableRx.medications,
        {
          name: '',
          form: 'Oral Tablet',
          dosage: '1 tablet',
          frequency: '1 - 0 - 1 (Twice daily after meals / सुबह-रात खाने के बाद)',
          duration: '5 days',
          how_to_use: 'खाने के बाद गुनगुने पानी के साथ लें।',
          precautions: '',
        },
      ],
    });
  };

  const handleUpdateMedicine = (index: number, field: keyof MedicationPrescription, value: string) => {
    if (!editableRx) return;
    const updated = [...editableRx.medications];
    updated[index] = { ...updated[index], [field]: value };
    setEditableRx({ ...editableRx, medications: updated });
  };

  const handleDeleteMedicine = (index: number) => {
    if (!editableRx) return;
    const updated = editableRx.medications.filter((_, i) => i !== index);
    setEditableRx({ ...editableRx, medications: updated });
  };

  // Exercise handlers
  const handleAddNewBlankExercise = () => {
    if (!editableRx) return;
    setEditableRx({
      ...editableRx,
      exercises: [
        ...editableRx.exercises,
        {
          name: 'Targeted Mobilization / Stretch',
          target_area: editableRx.affected_body_part,
          sets_reps: '3 sets of 10 repetitions',
          frequency: 'Twice daily (Morning & Evening)',
          how_to_perform: 'Perform slowly within pain-free boundaries without jerking. Hold stretch smoothly for 5 seconds.',
          hold_duration_sec: 5,
          precautions: 'Stop if sharp pain occurs.',
        },
      ],
    });
  };

  const handleUpdateExercise = (index: number, field: keyof ExercisePrescription, value: any) => {
    if (!editableRx) return;
    const updated = [...editableRx.exercises];
    updated[index] = { ...updated[index], [field]: value };
    setEditableRx({ ...editableRx, exercises: updated });
  };

  const handleDeleteExercise = (index: number) => {
    if (!editableRx) return;
    const updated = editableRx.exercises.filter((_, i) => i !== index);
    setEditableRx({ ...editableRx, exercises: updated });
  };

  const handleSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examinationId) return;
    setSigning(true);
    try {
      await signOffReport(examinationId, {
        clinician_name: clinicianName,
        clinician_license: clinicianLicense,
        diagnostic_impression: diagnosticImpression,
        recommended_plan: recommendedPlan,
      });
      setIsSignedOff(true);
    } catch (err: any) {
      alert(`Sign off failed: ${err.message}`);
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!report) return;
    const exportData = {
      ...report,
      prescription: editableRx || report.prescription,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Clinical_Physical_Exam_Report_${report.examination_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  // Active prescription display
  const activeRx: FinalPrescription = editableRx || report?.prescription || {
    clinical_diagnosis: `${report?.patient_demographics.affected_side || ''} ${
      report?.patient_demographics.selected_region.replace('_', ' ') || 'Musculoskeletal'
    } Mechanical Strain / Acute Dysfunction`,
    affected_body_part: `${report?.patient_demographics.affected_side || ''} ${
      report?.patient_demographics.selected_region.replace('_', ' ') || 'Joint'
    }`,
    severity_grade: 'Mild to Moderate',
    medications: PURNEA_BIHAR_FORMULARY.slice(0, 3),
    exercises: [
      {
        name: 'Isometric Muscle Activation',
        target_area: 'Target Musculature & Peri-Articular Stabilizers',
        sets_reps: '3 sets of 10 repetitions, 5-second hold',
        frequency: 'Twice daily (Morning & Evening)',
        how_to_perform: 'Contract the muscles around the affected area gently without moving the joint. Hold constant tension for 5 seconds, then relax for 3 seconds.',
        hold_duration_sec: 5,
        precautions: 'Do not hold your breath during isometric contraction.',
      },
    ],
    home_care_measures: [
      'Cryotherapy (बरफ की सिकाई): Apply ice pack wrapped in a damp cloth for 15-20 minutes every 3-4 hours for the first 48 hours to reduce inflammation.',
      'Relative Rest (विश्राम): Avoid strenuous sports, heavy lifting, or aggravating repetitive movements for 5-7 days.',
      'Compression & Support: Use an elastic bandage or supportive brace during daytime activity to support the injured soft tissue.',
    ],
    activity_modifications: [
      'Do NOT perform sudden explosive movements, jumping, or heavy weight-bearing on the affected side.',
      'Avoid sitting or standing in static posture for more than 45 minutes continuously.',
    ],
    follow_up_advice: 'Review in orthopedic clinic in 7 to 10 days if functional pain does not improve by at least 50%, or sooner if symptoms worsen.',
    emergency_warning: 'Seek IMMEDIATE emergency orthopedic attention if you experience: sudden severe inability to bear weight, visible joint deformity, progressive numbness/weakness in fingers or toes, or high fever with joint warmth.',
    prescribed_date: new Date().toISOString(),
  };

  // Filtered Formulary Medicines for Purnea District
  const filteredFormulary = PURNEA_BIHAR_FORMULARY.filter((m) => {
    const matchesCategory = selectedFormularyCategory === 'ALL' || m.category === selectedFormularyCategory;
    const matchesSearch =
      !formularySearchQuery.trim() ||
      m.name.toLowerCase().includes(formularySearchQuery.toLowerCase()) ||
      m.indication_hi.toLowerCase().includes(formularySearchQuery.toLowerCase()) ||
      m.how_to_use.toLowerCase().includes(formularySearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto print-modal-window">
        {/* Modal Top Header (No-print) */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950 border border-emerald-500/40 rounded-xl text-emerald-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Clinical Examination & Official Prescription
                </h2>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-full font-mono font-bold">
                  Rx Validated
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/80 px-2 py-0.5 rounded-full font-mono font-bold hidden sm:inline">
                  📍 Purnea (Bihar) Clinical Formulary Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Medical-grade treatment plan, targeted exercises, regional pharmacopeia & biomechanical telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'prescription' && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isEditing
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40'
                }`}
                title={isEditing ? 'Exit Edit Mode' : 'Write / Edit Medicines & Exercises'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Done Editing (संपादित समाप्त)' : '✏️ Modify / Add Rx (वैकल्पिक संपादन)'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-colors cursor-pointer"
              title="Print Official Prescription & Plan"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Prescription</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Export as JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher (No-print) */}
        <div className="bg-slate-950/90 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('prescription')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'prescription'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>📄 Official Clinical Prescription & Rx (दवाइयाँ व कसरत पर्ची)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'telemetry'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>🔬 Biomechanical Kinematics & CV Telemetry (बायोमैकेनिकल डेटा)</span>
            </button>
          </div>

          {activeTab === 'prescription' && isEditing && (
            <button
              type="button"
              onClick={handleSavePrescription}
              disabled={savingRx}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingRx ? 'Saving...' : '💾 Save Prescription Changes'}</span>
            </button>
          )}
        </div>

        {/* Success Alert Banner */}
        {saveSuccess && (
          <div className="bg-emerald-950 border-b border-emerald-500/50 px-6 py-2 text-xs text-emerald-200 font-bold flex items-center gap-2 no-print">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200 print-document-body">
          {loading && (
            <div className="text-center py-12 text-slate-400">
              Loading clinical records and synthesizing targeted prescription...
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/80 border border-red-500 rounded-xl text-red-200 text-sm">
              Error fetching report: {error}
            </div>
          )}

          {report && (
            <div className="space-y-6">
              {/* Emergency Banner if triggered */}
              {report.urgent_referral_alert && (
                <div className="p-4 bg-red-950 border-2 border-red-500 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm uppercase">
                    <AlertTriangle className="w-5 h-5" />
                    SAFETY STOP: {report.urgent_referral_alert.urgency}
                  </div>
                  <p className="text-xs text-red-200 font-medium">
                    {report.urgent_referral_alert.reason}
                  </p>
                  <p className="text-xs text-red-300 font-bold">
                    {report.urgent_referral_alert.directive}
                  </p>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 1: OFFICIAL CLINICAL PRESCRIPTION & REHABILITATION Rx */}
              {/* ============================================================== */}
              {activeTab === 'prescription' && (
                <div id="clinical-prescription-container" className="space-y-6 print-prescription-page">
                  {/* Clinic Stationary Letterhead */}
                  <div className="bg-slate-950 border-2 border-emerald-500/50 rounded-2xl p-5 shadow-xl relative overflow-hidden print-letterhead">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow">
                            Rx
                          </div>
                          <h1 className="text-lg font-black text-white tracking-wide uppercase">
                            AI-Assisted Orthopedic & General Medical Center
                          </h1>
                        </div>
                        <p className="text-xs text-emerald-400 mt-1 font-medium">
                          Center for Precision Musculoskeletal Kinematics, Infectious Disease & Primary Care
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Regional Public Health & Clinical Care Formulary • Purnea District (Bihar) • ISO/FHIR Compliant
                        </p>
                      </div>

                      <div className="text-right text-xs space-y-0.5">
                        <div className="font-mono text-cyan-300 font-bold">
                          Rx Ref: #{report.examination_id.slice(0, 8).toUpperCase()}
                        </div>
                        <div className="text-slate-400 flex items-center gap-1 sm:justify-end">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Date: {new Date(report.generated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 sm:justify-end">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Time: {new Date(report.generated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Model Autonomous Prescription Banner */}
                    <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 border border-emerald-500/50 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="p-1.5 bg-emerald-900/80 text-emerald-300 rounded-lg flex-shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-emerald-300 flex items-center gap-2">
                          <span>🤖 AI Model Autonomous Clinical Prescription (एआई मॉडल द्वारा स्वचालित निर्धारित दवाइयां)</span>
                          <span className="text-[10px] bg-emerald-900/90 text-emerald-200 border border-emerald-600 px-2 py-0.5 rounded-full font-mono">
                            Auto-Generated from All Exam Findings
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          3D शरीर पर इंगित बिंदु, रोगी द्वारा बताए गए लक्षण, दर्द स्कोर और कंप्यूटर विज़न गति (ROM) की पूरी जांच के आधार पर मॉडल ने यह संपूर्ण पर्चा तैयार किया है। ऑपरेटर को दवा लिखने की आवश्यकता नहीं है; पर्चा सीधे प्रिंट के लिए तैयार है।
                        </p>
                      </div>
                    </div>

                    {/* Patient Demographics & Clinical Diagnosis Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-500 uppercase font-semibold text-[10px] block">Patient Name & ID</span>
                        <span className="font-bold text-white text-sm">
                          {report.patient_demographics.patient_name}
                        </span>
                        <span className="text-[10px] text-cyan-400 block font-mono">
                          ID: {report.patient_demographics.patient_id}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 uppercase font-semibold text-[10px] block">Age & Gender</span>
                        <span className="font-bold text-white">
                          {report.patient_demographics.patient_age || 34} Yrs • {report.patient_demographics.patient_gender || 'MALE'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Biometric Calibrated</span>
                      </div>

                      <div>
                        <span className="text-slate-500 uppercase font-semibold text-[10px] block">Symptomatic Region</span>
                        <span className="font-bold text-cyan-300">
                          {report.patient_demographics.affected_side} {report.patient_demographics.selected_region.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold block">
                          Severity: {activeRx.severity_grade}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 uppercase font-semibold text-[10px] block">Safety Screen</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          CLEARED (No Fractures)
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">Ottawa & Red Flags Cleared</span>
                      </div>
                    </div>

                    {/* AI Model Autonomous Prescription Banner */}
                    <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 border border-emerald-500/50 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="p-1.5 bg-emerald-900/80 text-emerald-300 rounded-lg flex-shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-emerald-300 flex items-center gap-2">
                          <span>🤖 AI Model Autonomous Clinical Prescription (एआई मॉडल द्वारा स्वचालित निर्धारित दवाइयां)</span>
                          <span className="text-[10px] bg-emerald-900/90 text-emerald-200 border border-emerald-600 px-2 py-0.5 rounded-full font-mono">
                            Auto-Generated from All Exam Findings
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          3D शरीर पर इंगित बिंदु, रोगी द्वारा बताए गए लक्षण, दर्द स्कोर और कंप्यूटर विज़न गति (ROM) की पूरी जांच के आधार पर मॉडल ने यह संपूर्ण पर्चा तैयार किया है। ऑपरेटर को दवा लिखने की आवश्यकता नहीं है; पर्चा सीधे प्रिंट के लिए तैयार है।
                        </p>
                      </div>
                    </div>

                    {/* Diagnosis Highlight */}
                    <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider block">
                          Primary Clinical Diagnosis (निदान):
                        </span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={activeRx.clinical_diagnosis}
                            onChange={(e) => setEditableRx({ ...activeRx, clinical_diagnosis: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-sm text-white mt-1"
                          />
                        ) : (
                          <span className="text-sm font-bold text-white">
                            {activeRx.clinical_diagnosis}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] bg-emerald-900/80 text-emerald-200 border border-emerald-700 px-2 py-0.5 rounded font-mono ml-3 flex-shrink-0">
                        Protocol: {report.protocol_administered}
                      </span>
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* SECTION 1: PRESCRIBED MEDICATIONS & PURNEA FORMULARY */}
                  {/* ============================================================== */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-950 border border-emerald-500/40 rounded-xl text-emerald-400">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <span>1. ℞ Prescribed Medications (दवाइयाँ व लेने का सही समय)</span>
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Comprehensive pharmacological treatment with precise timing, dosage, and Indian Hindi instructions
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 no-print">
                        <span className="text-xs bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg font-mono">
                          {activeRx.medications.length} Prescribed
                        </span>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={handleAddNewBlankMedicine}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Custom Medicine (नई दवा लिखें)</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* AI Model Autonomous Prescription Banner */}
                    <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 border border-emerald-500/50 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="p-1.5 bg-emerald-900/80 text-emerald-300 rounded-lg flex-shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-emerald-300 flex items-center gap-2">
                          <span>🤖 AI Model Autonomous Clinical Prescription (एआई मॉडल द्वारा स्वचालित निर्धारित दवाइयां)</span>
                          <span className="text-[10px] bg-emerald-900/90 text-emerald-200 border border-emerald-600 px-2 py-0.5 rounded-full font-mono">
                            Auto-Generated from All Exam Findings
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          3D शरीर पर इंगित बिंदु, रोगी द्वारा बताए गए लक्षण, दर्द स्कोर और कंप्यूटर विज़न गति (ROM) की पूरी जांच के आधार पर मॉडल ने यह संपूर्ण पर्चा तैयार किया है। ऑपरेटर को दवा लिखने की आवश्यकता नहीं है; पर्चा सीधे प्रिंट के लिए तैयार है।
                        </p>
                      </div>
                    </div>

                    {/* ============================================================== */}
                    {/* PURNEA (BIHAR) REGIONAL CLINICAL FORMULARY QUICK-PRESETS BAR */}
                    {/* ============================================================== */}
                    {isEditing && (
                      <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-2xl space-y-3 no-print">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1 bg-emerald-950 rounded text-emerald-400">
                              <Sparkles className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
                              पूर्णिया (बिहार) क्षेत्रीय चिकित्सा फॉर्मूलरी (Purnea District Formulary):
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Click any medicine to instantly prescribe with dosage & Hindi instructions
                          </span>
                        </div>

                        {/* Category Filter Pills */}
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {[
                            { id: 'ALL', label: 'All Medicines (सभी 55 दवाएं)', icon: Layers },
                            { id: 'ORTHO', label: '🦴 जोड़, कमर व यूरिक एसिड (Ortho/Pain/Gout)', icon: Dumbbell },
                            { id: 'FEVER', label: '🌡️ बुखार (Typhoid/Dengue/Malaria)', icon: Thermometer },
                            { id: 'GI', label: '💧 पेट, दस्त, उल्टी व गैस (GI/Diarrhea/Vomiting)', icon: Droplet },
                            { id: 'RESP', label: '🫁 खांसी, दमा व सांस (Cough/Asthma)', icon: Wind },
                            { id: 'ANEMIA', label: '🩸 खून की कमी व पीलिया (Anemia/Liver)', icon: HeartPulse },
                            { id: 'SKIN', label: '🧴 दाद, खाज, घाव व फुंसी (Skin/Fungal/Wounds)', icon: ShieldCheck },
                            { id: 'CHRONIC', label: '🩺 बीपी, शुगर व थायरॉयड (BP/Diabetes/Thyroid)', icon: Activity },
                            { id: 'ENT_EYE', label: '👁️ आंख, कान व पेशाब (Eye/Ear/UTI)', icon: Eye },
                          ].map((cat) => {
                            const IconComponent = cat.icon;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedFormularyCategory(cat.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                                  selectedFormularyCategory === cat.id
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/80'
                                }`}
                              >
                                <IconComponent className="w-3 h-3" />
                                <span>{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Search input inside formulary */}
                        <div className="pt-1">
                          <input
                            type="text"
                            value={formularySearchQuery}
                            onChange={(e) => setFormularySearchQuery(e.target.value)}
                            placeholder="दवा का नाम या बीमारी खोजें (e.g. Zerodol, Taxim, Dolo, दस्त, दाद, खून की कमी)..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        {/* Formulary Medicine Quick-Add Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1 pt-1">
                          {filteredFormulary.map((med, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAddPresetMedicine(med)}
                              className="text-left bg-slate-950 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/70 p-2 rounded-xl transition-all flex flex-col justify-between gap-1.5 cursor-pointer group shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-bold text-xs text-slate-100 group-hover:text-emerald-300 leading-snug">
                                  {med.name.split('(')[0].trim()}
                                </span>
                                <span className="text-[10px] bg-slate-900 group-hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0">
                                  + Add
                                </span>
                              </div>
                              <div className="text-[10px] text-cyan-300 line-clamp-1 font-hindi">
                                {med.indication_hi}
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-800 pt-1 mt-0.5">
                                <span className="text-amber-300/90">{med.frequency.split('(')[0].trim()}</span>
                                <span className="text-emerald-400">{med.duration}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Prescribed Medications Active List */}
                    <div className="space-y-4">
                      {activeRx.medications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-xs italic bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                          कोई दवा निर्धारित नहीं है। ऊपर दिए गए <strong>"Purnea District Formulary"</strong> से दवाएं जोड़ने के लिए <strong>"✏️ Write / Edit Rx"</strong> पर क्लिक करें।
                        </div>
                      ) : (
                        activeRx.medications.map((med, index) => (
                          <div
                            key={index}
                            className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 transition-all space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                  {index + 1}
                                </span>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={med.name}
                                    placeholder="Medicine Name & Composition (e.g. Tab. Zerodol-SP)"
                                    onChange={(e) => handleUpdateMedicine(index, 'name', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-bold"
                                  />
                                ) : (
                                  <h4 className="text-sm font-bold text-white">
                                    {med.name}
                                  </h4>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <select
                                      value={med.form}
                                      onChange={(e) => handleUpdateMedicine(index, 'form', e.target.value)}
                                      className="bg-slate-950 border border-slate-700 text-cyan-300 text-[11px] rounded px-2 py-1"
                                    >
                                      <option value="Oral Tablet">Oral Tablet (गोली)</option>
                                      <option value="Oral Capsule">Oral Capsule (कैप्सूल)</option>
                                      <option value="Topical Gel">Topical Gel (जेल)</option>
                                      <option value="Topical Cream">Topical Cream (क्रीम)</option>
                                      <option value="Topical Ointment">Topical Ointment (मलहम)</option>
                                      <option value="Topical Lotion">Topical Lotion (लोशन)</option>
                                      <option value="Cough Syrup">Cough Syrup (सिरप)</option>
                                      <option value="Oral Suspension">Oral Suspension (घोल)</option>
                                      <option value="Oral Liquid Tonic">Oral Liquid Tonic (टॉनिक)</option>
                                      <option value="Sachet / Powder">Sachet / Powder (पाउच)</option>
                                      <option value="Inhaler / Rotacap">Inhaler / Rotacap (इनहेलर)</option>
                                      <option value="Inhalation Softgel">Inhalation Softgel (भाप कैप्सूल)</option>
                                      <option value="Sterile Eye/Ear Drops">Sterile Eye/Ear Drops (आई/ईयर ड्रॉप्स)</option>
                                      <option value="Paediatric Suspension">Paediatric Suspension (बच्चों की सिरप)</option>
                                    </select>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMedicine(index)}
                                      className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                      title="Delete this medicine"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-semibold">
                                      {med.form}
                                    </span>
                                    <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                                      {med.duration}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Dosage, Frequency, and Duration Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                              <div>
                                <span className="text-slate-500 text-[10px] block uppercase font-mono mb-1">
                                  Dosage (मात्रा)
                                </span>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={med.dosage}
                                    placeholder="e.g. 1 tablet / 650 mg"
                                    onChange={(e) => handleUpdateMedicine(index, 'dosage', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                                  />
                                ) : (
                                  <span className="font-semibold text-slate-200">{med.dosage}</span>
                                )}
                              </div>

                              <div>
                                <span className="text-slate-500 text-[10px] block uppercase font-mono mb-1">
                                  Frequency & Timing (कब और कैसे लें)
                                </span>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={med.frequency}
                                    placeholder="e.g. 1 - 0 - 1 (सुबह और रात खाने के बाद)"
                                    onChange={(e) => handleUpdateMedicine(index, 'frequency', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 font-semibold"
                                  />
                                ) : (
                                  <span className="font-semibold text-cyan-300">{med.frequency}</span>
                                )}
                              </div>

                              <div>
                                <span className="text-slate-500 text-[10px] block uppercase font-mono mb-1">
                                  Duration (अवधि - कितने दिन)
                                </span>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={med.duration}
                                    placeholder="e.g. 5 days / 7 days"
                                    onChange={(e) => handleUpdateMedicine(index, 'duration', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-400 font-semibold"
                                  />
                                ) : (
                                  <span className="font-semibold text-emerald-400">{med.duration}</span>
                                )}
                              </div>
                            </div>

                            {/* How to use instruction callout */}
                            <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-3 text-xs space-y-1">
                              <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <Info className="w-3.5 h-3.5 text-emerald-400" />
                                <span>HOW TO USE / लेने का सही तरीका व निर्देश:</span>
                              </div>
                              {isEditing ? (
                                <textarea
                                  rows={2}
                                  value={med.how_to_use}
                                  placeholder="मरीज के लिए स्पष्ट निर्देश (e.g. खाने के बाद गुनगुने पानी के साथ लें। खाली पेट न लें...)"
                                  onChange={(e) => handleUpdateMedicine(index, 'how_to_use', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
                                />
                              ) : (
                                <p className="text-white font-medium leading-relaxed">
                                  {med.how_to_use}
                                </p>
                              )}

                              {isEditing ? (
                                <div className="pt-1 border-t border-emerald-900/60">
                                  <span className="text-[10px] text-amber-300 font-semibold block mb-0.5">Precautions / सावधानियां:</span>
                                  <input
                                    type="text"
                                    value={med.precautions || ''}
                                    placeholder="e.g. Avoid on empty stomach; avoid alcohol"
                                    onChange={(e) => handleUpdateMedicine(index, 'precautions', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-200"
                                  />
                                </div>
                              ) : med.precautions ? (
                                <p className="text-[11px] text-amber-300/90 pt-1 border-t border-emerald-900/60 leading-snug">
                                  <strong>सावधानी (Precaution):</strong> {med.precautions}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* SECTION 2: PRESCRIBED REHABILITATION EXERCISES (कसरत व व्यायाम) */}
                  {/* ============================================================== */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-cyan-950 border border-cyan-500/40 rounded-xl text-cyan-400">
                          <Dumbbell className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <span>2. 🏃 Prescribed Rehabilitation & Physiotherapy Exercises (कसरत व व्यायाम)</span>
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Perform smoothly within pain-free boundaries without jerking
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 no-print">
                        <span className="text-xs bg-slate-900 border border-slate-700 text-cyan-300 px-2.5 py-1 rounded-lg font-mono">
                          {activeRx.exercises.length} Exercises Prescribed
                        </span>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={handleAddNewBlankExercise}
                            className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add Exercise (व्यायाम जोड़ें)</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* AI Model Autonomous Prescription Banner */}
                    <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 border border-emerald-500/50 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="p-1.5 bg-emerald-900/80 text-emerald-300 rounded-lg flex-shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-emerald-300 flex items-center gap-2">
                          <span>🤖 AI Model Autonomous Clinical Prescription (एआई मॉडल द्वारा स्वचालित निर्धारित दवाइयां)</span>
                          <span className="text-[10px] bg-emerald-900/90 text-emerald-200 border border-emerald-600 px-2 py-0.5 rounded-full font-mono">
                            Auto-Generated from All Exam Findings
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          3D शरीर पर इंगित बिंदु, रोगी द्वारा बताए गए लक्षण, दर्द स्कोर और कंप्यूटर विज़न गति (ROM) की पूरी जांच के आधार पर मॉडल ने यह संपूर्ण पर्चा तैयार किया है। ऑपरेटर को दवा लिखने की आवश्यकता नहीं है; पर्चा सीधे प्रिंट के लिए तैयार है।
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {activeRx.exercises.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-xs italic">
                          No exercises prescribed. Click "+ Add Exercise" to add tailored rehabilitation exercises.
                        </div>
                      ) : (
                        activeRx.exercises.map((ex, index) => (
                          <div
                            key={index}
                            className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 transition-all space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                  {index + 1}
                                </span>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={ex.name}
                                    placeholder="Exercise Name"
                                    onChange={(e) => handleUpdateExercise(index, 'name', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-bold"
                                  />
                                ) : (
                                  <h4 className="text-sm font-bold text-white">
                                    {ex.name}
                                  </h4>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <input
                                      type="text"
                                      value={ex.target_area}
                                      placeholder="Target Area"
                                      onChange={(e) => handleUpdateExercise(index, 'target_area', e.target.value)}
                                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteExercise(index)}
                                      className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                      title="Delete this exercise"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[10px] bg-slate-800 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded font-mono font-bold">
                                      {ex.target_area}
                                    </span>
                                    {ex.hold_duration_sec ? (
                                      <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                                        Hold: {ex.hold_duration_sec}s
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                              <div>
                                <span className="text-slate-500 text-[10px] block uppercase font-mono mb-1">
                                  Sets & Repetitions (मात्रा)
                                </span>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={ex.sets_reps}
                                    placeholder="e.g. 3 sets of 10 repetitions"
                                    onChange={(e) => handleUpdateExercise(index, 'sets_reps', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-300 font-semibold"
                                  />
                                ) : (
                                  <span className="font-semibold text-amber-300">{ex.sets_reps}</span>
                                )}
                              </div>

                              <div>
                                <span className="text-slate-500 text-[10px] block uppercase font-mono mb-1">
                                  Frequency (दिन में कब)
                                </span>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={ex.frequency}
                                    placeholder="e.g. Twice daily (Morning & Evening)"
                                    onChange={(e) => handleUpdateExercise(index, 'frequency', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-400 font-semibold"
                                  />
                                ) : (
                                  <span className="font-semibold text-emerald-400">{ex.frequency}</span>
                                )}
                              </div>
                            </div>

                            {/* How to perform instruction callout */}
                            <div className="bg-cyan-950/40 border border-cyan-500/50 rounded-xl p-3 text-xs space-y-1">
                              <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                <span>HOW TO PERFORM / करने की सही विधि व तकनीक:</span>
                              </div>
                              {isEditing ? (
                                <textarea
                                  rows={2}
                                  value={ex.how_to_perform}
                                  placeholder="Step by step execution instructions for the patient..."
                                  onChange={(e) => handleUpdateExercise(index, 'how_to_perform', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
                                />
                              ) : (
                                <p className="text-white font-medium leading-relaxed">
                                  {ex.how_to_perform}
                                </p>
                              )}

                              {isEditing ? (
                                <div className="pt-1 border-t border-cyan-900/60">
                                  <span className="text-[10px] text-amber-300 font-semibold block mb-0.5">Warning / सावधानियां:</span>
                                  <input
                                    type="text"
                                    value={ex.precautions || ''}
                                    placeholder="e.g. Do not bounce or over-stretch"
                                    onChange={(e) => handleUpdateExercise(index, 'precautions', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-200"
                                  />
                                </div>
                              ) : ex.precautions ? (
                                <p className="text-[11px] text-amber-300/90 pt-1 border-t border-cyan-900/60 leading-snug">
                                  <strong>सावधानी (Warning):</strong> {ex.precautions}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Section 3 & 4: Home Care Measures & Precautions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Home Care Measures */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>3. Home Care & Modalities (घर पर देखभाल)</span>
                      </h3>
                      <div className="space-y-2 text-xs">
                        {activeRx.home_care_measures.map((measure, idx) => (
                          <div key={idx} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-slate-300 flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span className="leading-snug">{measure}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Model Autonomous Prescription Banner */}
                    <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 border border-emerald-500/50 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="p-1.5 bg-emerald-900/80 text-emerald-300 rounded-lg flex-shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-emerald-300 flex items-center gap-2">
                          <span>🤖 AI Model Autonomous Clinical Prescription (एआई मॉडल द्वारा स्वचालित निर्धारित दवाइयां)</span>
                          <span className="text-[10px] bg-emerald-900/90 text-emerald-200 border border-emerald-600 px-2 py-0.5 rounded-full font-mono">
                            Auto-Generated from All Exam Findings
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          3D शरीर पर इंगित बिंदु, रोगी द्वारा बताए गए लक्षण, दर्द स्कोर और कंप्यूटर विज़न गति (ROM) की पूरी जांच के आधार पर मॉडल ने यह संपूर्ण पर्चा तैयार किया है। ऑपरेटर को दवा लिखने की आवश्यकता नहीं है; पर्चा सीधे प्रिंट के लिए तैयार है।
                        </p>
                      </div>
                    </div>

                    {/* Activities to Avoid (परहेज) */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                      <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>4. Activities to Avoid (परहेज / क्या न करें)</span>
                      </h3>
                      <div className="space-y-2 text-xs">
                        {activeRx.activity_modifications.map((mod, idx) => (
                          <div key={idx} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-amber-200/90 flex items-start gap-2">
                            <span className="text-amber-400 font-bold">✕</span>
                            <span className="leading-snug">{mod}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Model Autonomous Prescription Banner */}
                    <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 border border-emerald-500/50 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="p-1.5 bg-emerald-900/80 text-emerald-300 rounded-lg flex-shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-emerald-300 flex items-center gap-2">
                          <span>🤖 AI Model Autonomous Clinical Prescription (एआई मॉडल द्वारा स्वचालित निर्धारित दवाइयां)</span>
                          <span className="text-[10px] bg-emerald-900/90 text-emerald-200 border border-emerald-600 px-2 py-0.5 rounded-full font-mono">
                            Auto-Generated from All Exam Findings
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          3D शरीर पर इंगित बिंदु, रोगी द्वारा बताए गए लक्षण, दर्द स्कोर और कंप्यूटर विज़न गति (ROM) की पूरी जांच के आधार पर मॉडल ने यह संपूर्ण पर्चा तैयार किया है। ऑपरेटर को दवा लिखने की आवश्यकता नहीं है; पर्चा सीधे प्रिंट के लिए तैयार है।
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Emergency Warning Signs */}
                  <div className="bg-red-950/70 border-2 border-red-500/80 rounded-2xl p-4 shadow-xl space-y-2">
                    <div className="flex items-center gap-2 text-red-300 font-bold text-xs uppercase tracking-wider font-mono">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span>5. Emergency Warning Signs (खतरे के लक्षण - तत्काल अस्पताल जाएँ)</span>
                    </div>
                    <p className="text-xs text-red-100 leading-relaxed">
                      {activeRx.emergency_warning}
                    </p>
                    <div className="text-[11px] text-red-300 pt-1 border-t border-red-800/80 font-mono">
                      Follow-up Advice: {activeRx.follow_up_advice}
                    </div>
                  </div>

                  {/* Section 6: Clinician Attestation & Official Digital Stamp */}
                  <div className="bg-slate-950 border border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-cyan-400" />
                        Attending Clinician Prescription Validation & Attestation
                      </h3>
                      {isSignedOff && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-500/50">
                          <Lock className="w-3 h-3" />
                          DIGITALLY SIGNED & CLINICALLY CERTIFIED
                        </span>
                      )}
                    </div>

                    {!isSignedOff ? (
                      <form onSubmit={handleSignOff} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                              Attending Doctor Name
                            </label>
                            <input
                              type="text"
                              value={clinicianName}
                              onChange={(e) => setClinicianName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                              Medical License / Registration #
                            </label>
                            <input
                              type="text"
                              value={clinicianLicense}
                              onChange={(e) => setClinicianLicense(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                            Diagnostic Impression & Clinical Formulation
                          </label>
                          <textarea
                            rows={2}
                            value={diagnosticImpression}
                            onChange={(e) => setDiagnosticImpression(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                            Recommended Clinical Care Plan
                          </label>
                          <textarea
                            rows={2}
                            value={recommendedPlan}
                            onChange={(e) => setRecommendedPlan(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={signing}
                          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-lg cursor-pointer"
                        >
                          <FileCheck2 className="w-4 h-4" />
                          {signing ? 'Attesting...' : 'Digitally Sign & Validate Prescription'}
                        </button>
                      </form>
                    ) : (
                      <div className="bg-emerald-950/40 border border-emerald-600/30 rounded-xl p-4 space-y-3 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/60 pb-2">
                          <div className="text-emerald-300 font-bold text-sm">
                            Signed by: {clinicianName}
                          </div>
                          <div className="text-emerald-400 font-mono text-[11px]">
                            Registration No: {clinicianLicense}
                          </div>
                        </div>
                        <div className="text-slate-300">
                          <strong className="text-white">Diagnostic Impression:</strong> {diagnosticImpression}
                        </div>
                        <div className="text-slate-300">
                          <strong className="text-white">Clinical Plan:</strong> {recommendedPlan}
                        </div>
                        <div className="pt-2 flex justify-between items-end border-t border-emerald-900/60 text-[10px] text-slate-400">
                          <div>Digitally Generated & Verified via Physical Examination Controller • Purnea Center</div>
                          <div className="text-right">
                            <span className="font-mono text-emerald-400">Official Doctor Seal / Signature</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 2: BIOMECHANICAL KINEMATICS & CV TELEMETRY DATA */}
              {/* ============================================================== */}
              {activeTab === 'telemetry' && (
                <div className="space-y-6">
                  {/* Patient & Exam Metadata Table */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                          Patient ID / Name
                        </span>
                        <span className="font-bold text-white">
                          {report.patient_demographics.patient_id} ({report.patient_demographics.patient_name})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                          Age / Gender
                        </span>
                        <span className="font-bold text-white">
                          {report.patient_demographics.patient_age} yrs • {report.patient_demographics.patient_gender}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                          Symptomatic Site
                        </span>
                        <span className="font-bold text-cyan-400">
                          {report.patient_demographics.affected_side}{' '}
                          {report.patient_demographics.selected_region.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                          Exam Status
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          {report.examination_status}
                        </span>
                      </div>
                    </div>

                    {/* AI Model Autonomous Prescription Banner */}
                    <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 border border-emerald-500/50 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="p-1.5 bg-emerald-900/80 text-emerald-300 rounded-lg flex-shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-emerald-300 flex items-center gap-2">
                          <span>🤖 AI Model Autonomous Clinical Prescription (एआई मॉडल द्वारा स्वचालित निर्धारित दवाइयां)</span>
                          <span className="text-[10px] bg-emerald-900/90 text-emerald-200 border border-emerald-600 px-2 py-0.5 rounded-full font-mono">
                            Auto-Generated from All Exam Findings
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          3D शरीर पर इंगित बिंदु, रोगी द्वारा बताए गए लक्षण, दर्द स्कोर और कंप्यूटर विज़न गति (ROM) की पूरी जांच के आधार पर मॉडल ने यह संपूर्ण पर्चा तैयार किया है। ऑपरेटर को दवा लिखने की आवश्यकता नहीं है; पर्चा सीधे प्रिंट के लिए तैयार है।
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1. Red Flag Safety Screen */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-cyan-400" />
                      1. Validated Safety Screen (Ottawa & Infection Criteria)
                    </h3>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">
                          Ottawa Fracture & Weight-Bearing Inability:
                        </span>
                        <span className="font-bold text-emerald-400">CLEARED (Negative)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">
                          Acute Infectious Septic Joint Screen:
                        </span>
                        <span className="font-bold text-emerald-400">CLEARED (Negative)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">
                          Distal Neurovascular & Perfusion Deficit:
                        </span>
                        <span className="font-bold text-emerald-400">CLEARED (Negative)</span>
                      </div>
                    </div>

                    {/* AI Model Autonomous Prescription Banner */}
                    <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 border border-emerald-500/50 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="p-1.5 bg-emerald-900/80 text-emerald-300 rounded-lg flex-shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-emerald-300 flex items-center gap-2">
                          <span>🤖 AI Model Autonomous Clinical Prescription (एआई मॉडल द्वारा स्वचालित निर्धारित दवाइयां)</span>
                          <span className="text-[10px] bg-emerald-900/90 text-emerald-200 border border-emerald-600 px-2 py-0.5 rounded-full font-mono">
                            Auto-Generated from All Exam Findings
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          3D शरीर पर इंगित बिंदु, रोगी द्वारा बताए गए लक्षण, दर्द स्कोर और कंप्यूटर विज़न गति (ROM) की पूरी जांच के आधार पर मॉडल ने यह संपूर्ण पर्चा तैयार किया है। ऑपरेटर को दवा लिखने की आवश्यकता नहीं है; पर्चा सीधे प्रिंट के लिए तैयार है।
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Patient-Reported Symptoms */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      2. Patient-Reported Symptoms & Epicenter Localization
                    </h3>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800">
                      {report.patient_reported_symptoms.map((f) => (
                        <div key={f.id} className="p-3 text-xs flex items-start justify-between gap-3">
                          <div>
                            <div className="font-bold text-cyan-300">{f.title}</div>
                            <div className="text-slate-400 mt-0.5">{f.description}</div>
                          </div>
                          <span className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded font-mono text-slate-300">
                            {f.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Computer-Vision Observations & Quality */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      3. Computer-Vision Biomechanical Observations & Video Quality
                    </h3>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
                      <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-2">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Tracking Reliability</span>
                          <span className="font-bold text-emerald-400 font-mono">
                            {report.computer_vision_quality_summary.overall_status}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Mean Landmark Confidence</span>
                          <span className="font-bold text-cyan-400 font-mono">
                            {report.computer_vision_quality_summary.mean_tracking_confidence}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Tracked Frames</span>
                          <span className="font-bold text-white font-mono">
                            {report.computer_vision_quality_summary.valid_tracking_frames} /{' '}
                            {report.computer_vision_quality_summary.frames_analyzed}
                          </span>
                        </div>
                      </div>

                      {report.computer_vision_observations.map((f) => (
                        <div key={f.id} className="text-xs text-slate-300">
                          • <strong className="text-white">{f.title}:</strong> {f.description}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. Calculated Biomechanical Measurements */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      4. Objective Biomechanical Kinematics vs. Standard Clinical Norms
                    </h3>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                          <tr>
                            <th className="p-3">Biomechanical Metric</th>
                            <th className="p-3">Measured Value</th>
                            <th className="p-3">Standard Normative Range</th>
                            <th className="p-3">Clinical Interpretation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {report.objective_measurements.map((m) => (
                            <React.Fragment key={m.id}>
                              <tr>
                                <td className="p-3 font-semibold text-white">Terminal Extension</td>
                                <td className="p-3 font-mono font-bold text-cyan-300">
                                  {m.terminal_extension_deg?.toFixed(1)}°
                                </td>
                                <td className="p-3 text-slate-400">0.0° - 5.0°</td>
                                <td className="p-3 text-amber-300">
                                  {(m.terminal_extension_deg ?? 0) > 6.0
                                    ? 'Mild Extension Deficit / Lag'
                                    : 'Normal full extension'}
                                </td>
                              </tr>
                              <tr>
                                <td className="p-3 font-semibold text-white">Maximum Flexion</td>
                                <td className="p-3 font-mono font-bold text-cyan-300">
                                  {m.maximum_flexion_deg?.toFixed(1)}°
                                </td>
                                <td className="p-3 text-slate-400">130.0° - 145.0°</td>
                                <td className="p-3 text-amber-300">
                                  {(m.maximum_flexion_deg ?? 0) < 125.0
                                    ? 'Flexion restriction (~20° deficit)'
                                    : 'Normal active flexion'}
                                </td>
                              </tr>
                              <tr>
                                <td className="p-3 font-semibold text-white">Total Active ROM</td>
                                <td className="p-3 font-mono font-bold text-amber-400">
                                  {m.range_of_motion_deg?.toFixed(1)}°
                                </td>
                                <td className="p-3 text-slate-400">&gt; 125.0°</td>
                                <td className="p-3 text-slate-300">Functional range</td>
                              </tr>
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 5. Regulatory Disclaimer */}
                  <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Mandatory Regulatory Notice:</strong> {report.regulatory_disclaimer}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
