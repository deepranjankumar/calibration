/**
 * Web Speech Recognition & Smart Clinical Intent Parser
 * Allows patients to speak their answers in Hindi or English,
 * provides live editable transcription, and intelligently maps spoken words
 * to boolean, choice, or numeric clinical scores.
 */

import type { Examination, ExaminationStep } from '../types/examination';

// Declare Web Speech API types for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export interface SpeechRecognizerSession {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

/**
 * Creates a SpeechRecognition instance calibrated for clinical dialogue
 */
export function startPatientVoiceRecognition(options: {
  lang: 'hi-IN' | 'en-IN' | 'en-US';
  onInterimResult: (text: string) => void;
  onFinalResult: (text: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}): SpeechRecognizerSession | null {
  if (typeof window === 'undefined') return null;
  const win = window as IWindow;
  const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    if (options.onError) {
      options.onError(new Error('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.'));
    }
    return null;
  }

  try {
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = options.lang;
    recognition.maxAlternatives = 1;

    let accumulatedFinalText = '';

    recognition.onstart = () => {
      if (options.onStart) options.onStart();
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulatedFinalText += (accumulatedFinalText ? ' ' : '') + transcriptPart.trim();
          options.onFinalResult(accumulatedFinalText);
        } else {
          interimTranscript += transcriptPart;
        }
      }
      if (interimTranscript) {
        options.onInterimResult(
          accumulatedFinalText ? `${accumulatedFinalText} ${interimTranscript}` : interimTranscript
        );
      }
    };

    recognition.onerror = (event: any) => {
      // Don't flag no-speech as hard failure
      if (event.error !== 'no-speech' && options.onError) {
        options.onError(event);
      }
    };

    recognition.onend = () => {
      if (options.onEnd) options.onEnd();
    };

    recognition.start();

    return {
      start: () => {
        try { recognition.start(); } catch (_) {}
      },
      stop: () => {
        try { recognition.stop(); } catch (_) {}
      },
      abort: () => {
        try { recognition.abort(); } catch (_) {}
      }
    };
  } catch (err) {
    if (options.onError) options.onError(err);
    return null;
  }
}

/**
 * Smart Clinical Intent Parser:
 * Analyzes patient's spoken words in Hindi or English and infers
 * the corresponding boolean, choice, or numeric pain score.
 */
export function parsePatientSpokenIntent(
  spokenText: string,
  step: ExaminationStep
): {
  detectedBoolean?: boolean;
  detectedChoice?: string;
  detectedNumeric?: number;
  confidenceReason?: string;
} {
  const text = spokenText.toLowerCase().trim();
  if (!text) return {};

  // 1. QUESTION_BOOLEAN
  if (step.action_type === 'QUESTION_BOOLEAN') {
    const positiveKeywords = [
      'हाँ', 'हां', 'हा', 'जी हाँ', 'जी हां', 'दर्द है', 'चोट लगी थी', 'चोट लगी',
      'गिरा था', 'गिर गया', 'सुन्न है', 'लटक रहा है', 'अटकता है', 'कमजोरी है',
      'yes', 'yeah', 'yep', 'it hurts', 'pain', 'severe', 'injured', 'fell', 'numb'
    ];
    const negativeKeywords = [
      'नहीं', 'नही', 'ना', 'दर्द नहीं है', 'कोई चोट नहीं', 'चल सकता हूँ', 'चल सकता हु',
      'ठीक है', 'कोई दिक्कत नहीं', 'कुछ नहीं', 'आराम है',
      'no', 'nope', 'nah', 'no pain', 'i can walk', 'fine', 'normal', 'nothing'
    ];

    for (const pos of positiveKeywords) {
      if (text.includes(pos)) {
        return {
          detectedBoolean: true,
          confidenceReason: `पहचाना गया: "${pos}" (Yes / सकारात्मक)`
        };
      }
    }

    for (const neg of negativeKeywords) {
      if (text.includes(neg)) {
        return {
          detectedBoolean: false,
          confidenceReason: `पहचाना गया: "${neg}" (No / नकारात्मक)`
        };
      }
    }
  }

  // 2. PALPATION_SCORE (0 to 10 Numeric Scale)
  if (step.action_type === 'PALPATION_SCORE') {
    const hindiNumberMap: Record<string, number> = {
      'शून्य': 0, 'जीरो': 0, 'zero': 0,
      'एक': 1, 'वन': 1, 'one': 1,
      'दो': 2, 'टू': 2, 'two': 2,
      'तीन': 3, 'थ्री': 3, 'three': 3,
      'चार': 4, 'फोर': 4, 'four': 4,
      'पांच': 5, 'पाँच': 5, 'फाइव': 5, 'five': 5,
      'छह': 6, 'छः': 6, 'सिक्स': 6, 'six': 6,
      'सात': 7, 'सेवन': 7, 'seven': 7,
      'आठ': 8, 'एट': 8, 'eight': 8,
      'नौ': 9, 'नाइन': 9, 'nine': 9,
      'दस': 10, 'टैन': 10, 'ten': 10
    };

    for (const [word, val] of Object.entries(hindiNumberMap)) {
      if (text.includes(word)) {
        return {
          detectedNumeric: val,
          confidenceReason: `पहचाना गया स्कोर: ${val}/10 (शब्द: "${word}")`
        };
      }
    }

    const digitMatch = text.match(/\b([0-9]|10)\b/);
    if (digitMatch) {
      const val = parseInt(digitMatch[1], 10);
      return {
        detectedNumeric: val,
        confidenceReason: `पहचाना गया स्कोर: ${val}/10`
      };
    }
  }

  // 3. QUESTION_CHOICE
  if (step.action_type === 'QUESTION_CHOICE' && step.input_config?.choices) {
    const choices = step.input_config.choices;
    for (const choice of choices) {
      const valLower = choice.value.toLowerCase().replace(/_/g, ' ');
      const labelLower = choice.label.toLowerCase();
      
      // Match value token or label keywords
      if (text.includes(valLower)) {
        return {
          detectedChoice: choice.value,
          confidenceReason: `पहचाना गया विकल्प: ${choice.label}`
        };
      }

      // Check common anatomical location words
      const subTokens = labelLower.split(/[\s,()/-]+/).filter((w) => w.length > 3);
      for (const tok of subTokens) {
        if (text.includes(tok)) {
          return {
            detectedChoice: choice.value,
            confidenceReason: `पहचाना गया विकल्प: ${choice.label}`
          };
        }
      }
    }
  }

  return {};
}

/**
 * Builds full clinical context of all previous questions and patient responses
 * so the system always has comprehensive knowledge of what was previously asked and answered.
 */
export function getConsultationHistorySummary(exam: Examination): {
  completedStepsCount: number;
  totalStepsCount: number;
  historyItems: Array<{
    stepIndex: number;
    title: string;
    questionEn: string;
    questionHi?: string;
    spokenTranscript?: string;
    answerSummary: string;
    phase: string;
  }>;
  contextSummaryHi: string;
  contextSummaryEn: string;
} {
  const steps = exam.steps || [];
  const completedSteps = steps.filter(
    (s) => s.status === 'COMPLETED' || s.step_index < exam.current_step_index
  );

  const historyItems = completedSteps.map((s) => {
    let answerText = 'दर्ज किया गया (Recorded)';
    const sub = s.submission;

    if (sub) {
      if (sub.response_boolean !== null && sub.response_boolean !== undefined) {
        answerText = sub.response_boolean ? 'हाँ / सकारात्मक (Yes / Positive)' : 'नहीं / सामान्य (No / Cleared)';
      } else if (sub.response_choice) {
        answerText = `चुना गया: ${sub.response_choice.replace(/_/g, ' ')}`;
      } else if (sub.response_numeric !== null && sub.response_numeric !== undefined) {
        answerText = `दर्द स्कोर: ${sub.response_numeric}/10 NRS`;
      }
    }

    return {
      stepIndex: s.step_index,
      title: s.title,
      questionEn: s.patient_question || '',
      questionHi: s.patient_question_hi || undefined,
      spokenTranscript: sub?.response_text || undefined,
      answerSummary: answerText,
      phase: s.phase
    };
  });

  // Construct intelligent memory summary
  let contextSummaryHi = '';
  let contextSummaryEn = '';

  if (completedSteps.length === 0) {
    contextSummaryHi = 'यह जांच का पहला कदम है। कोई पूर्व क्लिनिकल इतिहास अभी दर्ज नहीं हुआ है।';
    contextSummaryEn = 'Initial step of examination. No prior answers recorded yet.';
  } else {
    const highlights: string[] = [];
    const highlightsEn: string[] = [];

    historyItems.forEach((item) => {
      if (item.phase === 'RED_FLAGS') {
        highlights.push(`रेड फ्लैग स्क्रीन: ${item.answerSummary}`);
        highlightsEn.push(`Red Flag Screening: ${item.answerSummary}`);
      } else if (item.phase === 'LOCALIZATION') {
        highlights.push(`दर्द का केंद्र: ${item.answerSummary}`);
        highlightsEn.push(`Pain Epicenter: ${item.answerSummary}`);
      } else if (item.spokenTranscript) {
        highlights.push(`मरीज का कथन: "${item.spokenTranscript.slice(0, 40)}..."`);
        highlightsEn.push(`Patient stated: "${item.spokenTranscript.slice(0, 40)}..."`);
      }
    });

    contextSummaryHi = `अब तक ${completedSteps.length} कदम पूरे हुए हैं। पूर्व जानकारी: ${highlights.join(' • ')}`;
    contextSummaryEn = `Completed ${completedSteps.length} steps. Established Context: ${highlightsEn.join(' • ')}`;
  }

  return {
    completedStepsCount: completedSteps.length,
    totalStepsCount: exam.total_steps || steps.length,
    historyItems,
    contextSummaryHi,
    contextSummaryEn
  };
}
