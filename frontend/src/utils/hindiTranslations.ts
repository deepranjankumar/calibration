/**
 * Hindi Translations and Indian Voice Synthesis Engine
 * Designed for rural / village healthcare accessibility
 */

export const HINDI_QUESTION_DICTIONARY: Record<string, string> = {
  // --- KNEE PROTOCOL ---
  "RED_FLAG_TRAUMA": "क्या आपको घुटने में कोई तेज चोट या झटका लगा है, और क्या आप तुरंत बाद या अभी अपने पैरों पर 4 कदम भी नहीं चल पा रहे हैं?",
  "RED_FLAG_SEPTIC": "क्या आपका घुटना छूने पर बहुत ज्यादा गर्म महसूस हो रहा है, कुछ ही घंटों में अचानक फूल गया है, या आपको साथ में तेज बुखार और कंपकंपी आ रही है?",
  "RED_FLAG_NEUROVASCULAR": "क्या आपका पैर या पंजा सुन्न पड़ रहा है, पैर की उंगलियां ठंडी व पीली पड़ रही हैं, या पैर का पंजा ऊपर उठाने में कमजोरी महसूस हो रही है?",
  "SYMPTOM_LOCALIZATION": "अगर आपको सिर्फ एक उंगली से बताना हो कि घुटने में सबसे ज्यादा दर्द ठीक किस जगह पर है, तो वह जगह कौन सी है?",
  "MECHANICAL_SYMPTOMS": "चलते या मोड़ते समय क्या आपका घुटना कभी बीच में अचानक अटक जाता है कि पैर सीधा ही न हो, या चलते-चलते अचानक लचक खाकर धोखा दे देता है?",
  "AROM_FLEXION_EXTENSION": "कृपया कैमरे की तरफ करवट करके सीधे बैठें। अपने दर्द वाले पैर को धीरे-धीरे पूरा सीधा आगे फैलाएं, एक पल रोकें, फिर जितना हो सके पीछे कुर्सी के नीचे की तरफ मोड़ें।",
  "FUNCTIONAL_SQUAT": "अब कैमरे के सामने दोनों पैरों को थोड़ा खोलकर सीधे खड़े हो जाएं। धीरे-धीरे थोड़ा नीचे झुकें जैसे कुर्सी पर बैठने जा रहे हों (हल्का स्क्वाट), फिर आराम से वापस सीधे खड़े हो जाएं।",
  "PALPATION_TENDERNESS": "जब घुटने के उस खास दर्द वाले बिंदु पर उंगली से दबाया जाता है, तो 0 से 10 के पैमाने पर दर्द कितना तेज महसूस होता है (0 मतलब कोई दर्द नहीं, 10 मतलब असहनीय दर्द)?",

  // --- HIP PROTOCOL (Gait Walk & Bending) ---
  "RED_FLAG_HIP_TRAUMA": "क्या आप गिर गए थे, क्या आप इस पैर पर बिल्कुल खड़े नहीं हो पा रहे हैं, या पैर बाहर की तरफ घूमकर छोटा लग रहा है?",
  "HIP_LOCALIZATION": "क्या आपको जांघ के आगे अंदरूनी हिस्से (ग्रोइन) में गहरा दर्द है, या रात में करवट लेते समय बाहर कूल्हे की हड्डी पर?",
  "AROM_HIP_FLEXION": "कृपया सीधे खड़े होकर या बैठकर अपने दर्द वाले घुटने को ऊपर छाती की तरफ जितना हो सके ऊंचा उठाएं।",
  "HIP_TRENDELENBURG_TEST": "क्या आप बिना सहारा लिए सिर्फ अपने दर्द वाले पैर पर 10 सेकंड तक संतुलन बनाकर खड़े रह सकते हैं?",
  "HIP_GAIT_WALK_ANALYSIS": "कृपया कैमरे की तरफ सामान्य रूप से 4 से 6 कदम चलकर आगे आएं, फिर आराम से घूमकर वापस जाएं।",
  "HIP_PALPATION": "जब कूल्हे की बाहर वाली उभरी हुई हड्डी पर सीधा दबाव दिया जाता है, तो 0 से 10 तक कितना दर्द होता है?",

  // --- LUMBAR SPINE PROTOCOL (Toe-touch Bending & Sciatica) ---
  "RED_FLAG_CAUDA_EQUINA": "क्या आपके जांघों के बीच या शौच वाली जगह पर सुन्नपन है, पेशाब-पाखाने पर से नियंत्रण छूट रहा है, या दोनों पैरों में भारी कमजोरी है?",
  "LUMBAR_LOCALIZATION": "क्या दर्द केवल कमर के निचले हिस्से में रहता है, या करंट की तरह नीचे पैर और घुटने से नीचे तक दौड़ता है?",
  "AROM_LUMBAR_FLEXION": "कृपया दोनों घुटनों को सीधा रखकर धीरे-धीरे नीचे झुकें और अपने पैर के अंगूठे को छूने की कोशिश करें, फिर धीरे से वापस सीधे खड़े हो जाएं।",
  "LUMBAR_STRAIGHT_LEG_RAISE": "जब सीधे लेटकर पैर को बिना मोड़े ऊपर उठाया जाता है, तो क्या कमर से पैर तक बिजली जैसा तेज दर्द दौड़ता है?",
  "LUMBAR_PALPATION": "जब कमर की रीढ़ की हड्डी और मांसपेशियों को दबाया जाता है, तो 0 से 10 तक कितना दर्द महसूस होता है?",

  // --- CERVICAL SPINE PROTOCOL (Neck Bending & Radiation) ---
  "RED_FLAG_CERVICAL_MYELOPATHY": "क्या आपके हाथों से चीजें छूट रही हैं, शर्ट का बटन लगाने में दिक्कत हो रही है, या चलने में संतुलन लड़खड़ा रहा है?",
  "CERVICAL_LOCALIZATION": "क्या दर्द केवल गर्दन और कंधों में रहता है, या करंट और सुन्नपन की तरह हाथ से होकर उंगलियों तक जाता है?",
  "AROM_CERVICAL_FLEXION_ROTATION": "कृपया अपनी ठुड्डी को नीचे छाती से लगाएं, फिर ऊपर छत की तरफ देखें, और फिर धीरे-धीरे दोनों तरफ गर्दन घुमाकर देखें।",
  "CERVICAL_SPURLING_TEST": "गर्दन को दर्द वाले कंधे की तरफ थोड़ा झुकाने पर क्या बाजू में करंट या झनझनाहट जैसी तेज पीड़ा होती है?",
  "CERVICAL_PALPATION": "गर्दन की उस नस या हड्डी पर उंगली से दबाने पर 0 से 10 तक कितना दर्द होता है?",

  // --- SHOULDER PROTOCOL ---
  "RED_FLAG_SHOULDER_TRAUMA": "क्या आपको कंधे पर कोई तेज चोट या झटका लगा है, कंधा अपनी जगह से उतर गया है या बाजू के बाहर सुन्नपन लग रहा है?",
  "SHOULDER_LOCALIZATION": "कंधे में सबसे तेज दर्द कहां महसूस होता है? (कंधे के ऊपर, आगे वाली नस में, बाजू के बाहर, या पीछे की हड्डी पर)?",
  "AROM_SHOULDER_FLEXION": "कृपया अपने दर्द वाले हाथ को आगे से ऊपर आसमान की तरफ जितना हो सके पूरा उठाएं, एक सेकंड रोकें, फिर धीरे-धीरे नीचे लाएं।",
  "SHOULDER_IMPINGEMENT_TEST": "हाथ ऊपर उठाते समय क्या कंधे की ऊंचाई पर बीच में तेज झटका या दर्द होता है, या हाथ कमजोरी से अचानक नीचे गिर जाता है?",
  "SHOULDER_PALPATION": "जब कंधे के उस खास दर्द वाले बिंदु पर उंगली से दबाया जाता है, तो 0 से 10 तक कितना दर्द होता है?",

  // --- ELBOW PROTOCOL ---
  "RED_FLAG_ELBOW_TRAUMA": "क्या कोहनी में कोई गंभीर चोट लगी है, कोहनी मुड़ गई है, या हाथ की उंगलियां ठंडी, सुन्न और सफेद पड़ रही हैं?",
  "ELBOW_LOCALIZATION": "दर्द कोहनी की बाहर वाली हड्डी पर है, अंदर की हड्डी पर, या कोहनी की पीछे वाली नोक पर?",
  "AROM_ELBOW_FLEXION": "कृपया अपने हाथ को पूरा सीधा आगे फैलाएं, फिर कोहनी को मोड़कर अपने हाथ से कंधे को छूने की कोशिश करें।",
  "ELBOW_RESISTED_TEST": "जब आप मुट्ठी बांधकर कलाई को पीछे की तरफ मोड़ते हैं, तो क्या कोहनी की हड्डी में तेज दर्द का झटका लगता है?",
  "ELBOW_PALPATION": "कोहनी की उस हड्डी या जोड़ को दबाने पर 0 से 10 के बीच कितना दर्द महसूस होता है?",

  // --- WRIST & HAND PROTOCOL ---
  "RED_FLAG_WRIST_TRAUMA": "क्या आप हाथ के बल जमीन पर गिरे थे, कलाई टेढ़ी दिख रही है, या अंगूठे के नीचे वाले गड्ढे में तेज असहनीय दर्द है?",
  "WRIST_LOCALIZATION": "कलाई या हाथ में दर्द और सुन्नपन कहां पर है? (हथेली और उंगलियों में, अंगूठे की जड़ में, या छोटी उंगली की तरफ)?",
  "AROM_WRIST_FLEXION": "कृपया अपनी कलाई को पहले पूरा नीचे की तरफ मोड़ें, फिर पूरा ऊपर आसमान की तरफ मोड़ें।",
  "WRIST_PHALENS_TEST": "जब दोनों हाथों के पिछले हिस्सों को मिलाकर कलाई को 30 से 60 सेकंड मोड़कर रखते हैं, तो क्या उंगलियों में झनझनाहट या सुन्नपन आता है?",
  "WRIST_PALPATION": "कलाई के उस खास बिंदु या नस पर दबाने पर 0 से 10 तक कितना दर्द होता है?",

  // --- ANKLE & FOOT PROTOCOL ---
  "RED_FLAG_ANKLE_OTTAWA": "क्या टखना मुड़ गया है, टखने की हड्डी पर तेज दर्द है और क्या आप इस पैर पर 4 कदम भी नहीं चल पा रहे हैं?",
  "ANKLE_LOCALIZATION": "टखने में सबसे ज्यादा दर्द कहां है? (बाहर की तरफ, अंदर की तरफ, पीछे एड़ी की नस में, या पैर के तलवे में)?",
  "AROM_ANKLE_DORSIFLEXION": "कृपया अपने पंजे को पूरा ऊपर अपने मुंह की तरफ उठाएं, फिर पूरा नीचे फर्श की तरफ तानें।",
  "ANKLE_THOMPSON_TEST": "क्या पीछे पिंडली में अचानक जोर से चटकने की आवाज आई थी और क्या आप पंजे के बल खड़े होने में असमर्थ हैं?",
  "ANKLE_PALPATION": "टखने के उस खास जोड़ या नस पर दबाने पर 0 से 10 के बीच कितना दर्द है?"
};

/**
 * Resolves the Hindi question for any given step
 */
export function getHindiQuestion(stepId: string, backendHindiQuestion?: string | null): string {
  if (backendHindiQuestion && backendHindiQuestion.trim().length > 0) {
    return backendHindiQuestion.trim();
  }
  return HINDI_QUESTION_DICTIONARY[stepId] || "कृपया डॉक्टर के निर्देशों का पालन करते हुए अपनी परेशानी बताएं।";
}

/**
 * Finds the best Indian Hindi voice available in the client browser
 */
export function findIndianHindiVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Specific Hindi voice for India (hi-IN)
  const hiInVoice = voices.find((v) => v.lang === 'hi-IN' || v.lang === 'hi_IN');
  if (hiInVoice) return hiInVoice;

  // 2. Any voice where language starts with 'hi'
  const hiVoice = voices.find((v) => v.lang.toLowerCase().startsWith('hi'));
  if (hiVoice) return hiVoice;

  // 3. Known Indian Hindi voice names in Windows / Android / iOS / Chrome
  const namedHindiVoice = voices.find((v) => {
    const name = v.name.toLowerCase();
    return (
      name.includes('hindi') ||
      name.includes('हिन्दी') ||
      name.includes('swara') ||
      name.includes('madhur') ||
      name.includes('lekha') ||
      name.includes('kalpana') ||
      name.includes('hemant')
    );
  });
  if (namedHindiVoice) return namedHindiVoice;

  // 4. Fallback to Indian English (en-IN) if pure Hindi voice is not pre-installed
  const indianEnVoice = voices.find(
    (v) => v.lang === 'en-IN' || v.name.toLowerCase().includes('india')
  );
  if (indianEnVoice) return indianEnVoice;

  return null;
}

/**
 * Speaks text using an Indian Hindi voice
 * Calibrated rate and pitch for clear, comfortable village comprehension
 */
export function speakInIndianHindi(
  text: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[Speech] Web Speech API not supported in this browser.');
    return;
  }

  // Cancel any prior speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const indianVoice = findIndianHindiVoice();

  if (indianVoice) {
    utterance.voice = indianVoice;
    utterance.lang = indianVoice.lang || 'hi-IN';
  } else {
    // Setting hi-IN signals browser to use cloud/system Hindi pack if available
    utterance.lang = 'hi-IN';
  }

  // Gentle, calm doctor cadence (slightly slower than default for village clarity)
  utterance.rate = 0.88;
  utterance.pitch = 1.02;

  if (callbacks?.onStart) utterance.onstart = callbacks.onStart;
  if (callbacks?.onEnd) utterance.onend = callbacks.onEnd;
  if (callbacks?.onError) utterance.onerror = callbacks.onError;

  window.speechSynthesis.speak(utterance);
}

/**
 * Cancels any active speech synthesis
 */
export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
