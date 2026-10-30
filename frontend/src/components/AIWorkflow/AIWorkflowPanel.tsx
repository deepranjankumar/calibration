import React, { useState, useRef } from 'react';
import type { Examination, PatientCalibration } from '../../types/examination';
import { calibratePatientMesh } from '../../services/api';
import {
  AlertTriangle,
  CheckCircle2,
  Activity,
  Video,
  Upload,
  Play,
  ShieldAlert,
  Send,
  User,
  RotateCw,
  FileText,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Camera,
  UserCheck,
  RefreshCw,
  Target,
  Mic,
  MicOff,
  History,
  Brain,
  Edit3,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import {
  getHindiQuestion,
  speakInIndianHindi,
  findIndianHindiVoice,
  stopSpeaking,
} from '../../utils/hindiTranslations';
import {
  startPatientVoiceRecognition,
  parsePatientSpokenIntent,
  getConsultationHistorySummary,
  type SpeechRecognizerSession,
} from '../../utils/speechRecognition';

interface AIWorkflowPanelProps {
  examination: Examination | null;
  patientCalibration?: PatientCalibration | null;
  onCalibratePatient?: (calibration: PatientCalibration) => void;
  onResetCalibration?: () => void;
  onStartExam: (data: {
    patient_id: string;
    patient_name: string;
    patient_age: number;
    patient_gender: string;
    selected_region: string;
    affected_side: 'RIGHT' | 'LEFT';
  }) => void;
  onSubmitStep: (payload: {
    response_boolean?: boolean;
    response_choice?: string;
    response_text?: string;
    response_numeric?: number;
    use_synthetic_kinematic_demo?: boolean;
    videoFile?: File | null;
  }) => Promise<void>;
  onOpenReport: () => void;
  isSubmitting: boolean;
  selectedRegion: string;
  affectedSide: 'RIGHT' | 'LEFT';
  onSelectRegion: (region: string, side: 'RIGHT' | 'LEFT') => void;
}

export const AIWorkflowPanel: React.FC<AIWorkflowPanelProps> = ({
  examination,
  patientCalibration,
  onCalibratePatient,
  onResetCalibration,
  onStartExam,
  onSubmitStep,
  onOpenReport,
  isSubmitting,
  selectedRegion,
  affectedSide,
  onSelectRegion,
}) => {
  // Pre-exam form state
  const [patientId, setPatientId] = useState('PT-4821');
  const [patientName, setPatientName] = useState('John Doe');
  const [patientAge, setPatientAge] = useState(48);
  const [patientGender, setPatientGender] = useState('Male');
  const [showDemographics, setShowDemographics] = useState(false);

  // Step response state
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [booleanResponse, setBooleanResponse] = useState<boolean | null>(null);
  const [numericScore, setNumericScore] = useState<number>(5);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [useSyntheticDemo, setUseSyntheticDemo] = useState<boolean>(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  // Hindi & Indian Voice State (Defaults to Hindi for village accessibility)
  const [languageMode, setLanguageMode] = useState<'hi' | 'en'>('hi');
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [detectedVoiceLabel, setDetectedVoiceLabel] = useState<string>('भारतीय हिंदी आवाज़');

  // Patient Speech-to-Text & Live Editable Transcript State
  const [isListeningPatient, setIsListeningPatient] = useState<boolean>(false);
  const [patientTranscript, setPatientTranscript] = useState<string>('');
  const [autoDetectedPill, setAutoDetectedPill] = useState<string | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(false);
  const activeSpeechSessionRef = useRef<SpeechRecognizerSession | null>(null);

  // Live webcam recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoElemRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Photo intake & 3D mesh calibration state
  const [isCalibratingPhoto, setIsCalibratingPhoto] = useState<boolean>(false);
  const [isPhotoCameraOpen, setIsPhotoCameraOpen] = useState<boolean>(false);
  const [calibrationError, setCalibrationError] = useState<string | null>(null);
  const photoVideoRef = useRef<HTMLVideoElement | null>(null);
  const photoStreamRef = useRef<MediaStream | null>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleStartPhotoCamera = async () => {
    setCalibrationError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      photoStreamRef.current = stream;
      setIsPhotoCameraOpen(true);
      setTimeout(() => {
        if (photoVideoRef.current) {
          photoVideoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      setCalibrationError('Could not access camera for patient photo. You can upload an image file or use Instant Biometric Calibration.');
    }
  };

  const handleStopPhotoCamera = () => {
    if (photoStreamRef.current) {
      photoStreamRef.current.getTracks().forEach((track) => track.stop());
      photoStreamRef.current = null;
    }
    setIsPhotoCameraOpen(false);
  };

  const handleCapturePhoto = async () => {
    if (!photoVideoRef.current) return;
    setIsCalibratingPhoto(true);
    setCalibrationError(null);

    try {
      const video = photoVideoRef.current;
      const canvas = photoCanvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      handleStopPhotoCamera();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
      );
      if (!blob) throw new Error('Failed to capture photo frame');

      const file = new File([blob], `patient_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const calibration = await calibratePatientMesh(file, false);
      if (onCalibratePatient) {
        onCalibratePatient(calibration);
      }
      if (calibration.detected_body_part && onSelectRegion) {
        const part = calibration.detected_body_part;
        onSelectRegion(part.region_id, part.side === 'BILATERAL' ? 'RIGHT' : part.side);
      }
    } catch (err: any) {
      setCalibrationError(err.message || 'Failed to calibrate patient mesh from photo.');
    } finally {
      setIsCalibratingPhoto(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsCalibratingPhoto(true);
    setCalibrationError(null);

    try {
      const calibration = await calibratePatientMesh(file, false);
      if (onCalibratePatient) {
        onCalibratePatient(calibration);
      }
      if (calibration.detected_body_part && onSelectRegion) {
        const part = calibration.detected_body_part;
        onSelectRegion(part.region_id, part.side === 'BILATERAL' ? 'RIGHT' : part.side);
      }
    } catch (err: any) {
      setCalibrationError(err.message || 'Failed to calibrate patient mesh from uploaded photo.');
    } finally {
      setIsCalibratingPhoto(false);
      e.target.value = '';
    }
  };

  const handleInstantDemoCalibration = async () => {
    setIsCalibratingPhoto(true);
    setCalibrationError(null);
    try {
      const calibration = await calibratePatientMesh(null, true);
      if (onCalibratePatient) {
        onCalibratePatient(calibration);
      }
      if (calibration.detected_body_part && onSelectRegion) {
        const part = calibration.detected_body_part;
        onSelectRegion(part.region_id, part.side === 'BILATERAL' ? 'RIGHT' : part.side);
      }
    } catch (err: any) {
      setCalibrationError(err.message || 'Instant biometric calibration failed.');
    } finally {
      setIsCalibratingPhoto(false);
    }
  };

  const currentStep = examination?.current_step;

  // Reset local state when active step changes
  React.useEffect(() => {
    setSelectedChoice('');
    setBooleanResponse(null);
    setNumericScore(5);
    setVideoFile(null);
    setUseSyntheticDemo(false);
    setVideoPreviewUrl(null);
    setPatientTranscript('');
    setAutoDetectedPill(null);

    // Stop listening session if step changes
    if (activeSpeechSessionRef.current) {
      activeSpeechSessionRef.current.stop();
      activeSpeechSessionRef.current = null;
    }
    setIsListeningPatient(false);
  }, [currentStep?.id]);

  const handleStartWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoElemRef.current) {
        videoElemRef.current.srcObject = stream;
      }
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const file = new File([blob], `recorded_${Date.now()}.mp4`, { type: 'video/mp4' });
        setVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(blob));
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Could not access webcam. You can use the "Run Simulated Patient Kinematics" option or upload a file.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setUseSyntheticDemo(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStep) return;

    // Stop listening before submitting
    if (activeSpeechSessionRef.current) {
      activeSpeechSessionRef.current.stop();
      activeSpeechSessionRef.current = null;
    }
    setIsListeningPatient(false);

    await onSubmitStep({
      response_boolean: booleanResponse ?? undefined,
      response_choice: selectedChoice || undefined,
      response_text: patientTranscript.trim() || undefined,
      response_numeric: currentStep.action_type === 'PALPATION_SCORE' ? numericScore : undefined,
      use_synthetic_kinematic_demo: useSyntheticDemo,
      videoFile: videoFile,
    });
  };

  const applySmartIntent = (parsed: ReturnType<typeof parsePatientSpokenIntent>) => {
    if (!currentStep) return;

    if (currentStep.action_type === 'QUESTION_BOOLEAN' && parsed.detectedBoolean !== undefined) {
      setBooleanResponse(parsed.detectedBoolean);
      setAutoDetectedPill(parsed.confidenceReason || (parsed.detectedBoolean ? 'हाँ / Yes' : 'नहीं / No'));
    } else if (currentStep.action_type === 'QUESTION_CHOICE' && parsed.detectedChoice) {
      setSelectedChoice(parsed.detectedChoice);
      setAutoDetectedPill(parsed.confidenceReason || parsed.detectedChoice);
    } else if (currentStep.action_type === 'PALPATION_SCORE' && parsed.detectedNumeric !== undefined) {
      setNumericScore(parsed.detectedNumeric);
      setAutoDetectedPill(parsed.confidenceReason || `${parsed.detectedNumeric}/10 NRS`);
    }
  };

  const handleToggleListenPatient = () => {
    if (isListeningPatient) {
      if (activeSpeechSessionRef.current) {
        activeSpeechSessionRef.current.stop();
        activeSpeechSessionRef.current = null;
      }
      setIsListeningPatient(false);
      return;
    }

    // Stop any active AI speech output
    stopSpeaking();
    setIsSpeaking(false);
    setAutoDetectedPill(null);

    const langCode = languageMode === 'hi' ? 'hi-IN' : 'en-IN';
    const session = startPatientVoiceRecognition({
      lang: langCode,
      onStart: () => {
        setIsListeningPatient(true);
      },
      onInterimResult: (interimText) => {
        setPatientTranscript(interimText);
        if (currentStep) {
          const parsed = parsePatientSpokenIntent(interimText, currentStep);
          applySmartIntent(parsed);
        }
      },
      onFinalResult: (finalText) => {
        setPatientTranscript(finalText);
        if (currentStep) {
          const parsed = parsePatientSpokenIntent(finalText, currentStep);
          applySmartIntent(parsed);
        }
      },
      onEnd: () => {
        setIsListeningPatient(false);
        activeSpeechSessionRef.current = null;
      },
      onError: (err) => {
        console.warn('[SpeechRecognition] error:', err);
        setIsListeningPatient(false);
        activeSpeechSessionRef.current = null;
      },
    });

    if (session) {
      activeSpeechSessionRef.current = session;
    } else {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.');
    }
  };

  const handleClearTranscript = () => {
    setPatientTranscript('');
    setAutoDetectedPill(null);
  };

  // Update detected Indian voice label
  React.useEffect(() => {
    const updateVoiceLabel = () => {
      const v = findIndianHindiVoice();
      if (v) {
        setDetectedVoiceLabel(v.name.includes('(') ? v.name.split('(')[0].trim() : v.name);
      } else {
        setDetectedVoiceLabel('Indian Hindi Voice (hi-IN)');
      }
    };
    updateVoiceLabel();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoiceLabel;
    }
    return () => {
      stopSpeaking();
    };
  }, []);

  const playQuestionAudio = (mode?: 'hi' | 'en') => {
    if (!currentStep) return;
    const targetMode = mode || languageMode;
    const hindiText = getHindiQuestion(currentStep.step_id, currentStep.patient_question_hi);
    const englishText = currentStep.patient_question || hindiText;

    if (targetMode === 'hi') {
      setIsSpeaking(true);
      speakInIndianHindi(hindiText, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(englishText);
        utterance.rate = 0.92;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleStopAudio = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  // Auto-speak question in Hindi when moving to next step
  React.useEffect(() => {
    if (currentStep?.patient_question && autoSpeakEnabled) {
      const timer = setTimeout(() => {
        playQuestionAudio(languageMode);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep?.step_id, autoSpeakEnabled, languageMode]);

  const consultationHistory = examination
    ? getConsultationHistorySummary(examination)
    : { completedStepsCount: 0, totalStepsCount: 0, historyItems: [], contextSummaryHi: '', contextSummaryEn: '' };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* --- PANEL HEADER --- */}
      <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              AI Physical Examination Controller
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/80 px-2 py-0.5 rounded-full font-mono">
                v1.0 AAOS PROTOCOL
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Validated clinical state machine • Operator follows AI directives
            </p>
          </div>
        </div>

        {/* --- Language & Indian Voice Audio Controls --- */}
        <div className="flex items-center gap-2.5">
          {/* Language Toggle: Hindi vs English */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setLanguageMode('hi');
                playQuestionAudio('hi');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                languageMode === 'hi'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="गाँव के मरीजों के लिए भारतीय हिंदी आवाज़ (Indian Hindi Voice for Village Patients)"
            >
              <span>🇮🇳</span>
              <span>हिंदी</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguageMode('en');
                playQuestionAudio('en');
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                languageMode === 'en'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English Medical Phrasing"
            >
              <span>🇬🇧</span>
              <span>EN</span>
            </button>
          </div>

          {/* Auto-Voice Announcement Toggle */}
          <button
            type="button"
            onClick={() => setAutoSpeakEnabled(!autoSpeakEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              autoSpeakEnabled
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={autoSpeakEnabled ? 'आवाज़ स्वतः चालू है (Auto-Voice ON)' : 'आवाज़ बंद है (Auto-Voice OFF)'}
          >
            <Radio className={`w-3.5 h-3.5 ${autoSpeakEnabled ? 'animate-pulse text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Auto-Voice</span>
          </button>

          {examination && (
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600/80 transition-colors shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              Report
            </button>
          )}
        </div>
      </div>

      {/* --- BODY SCROLL AREA --- */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* === SCREEN 1: PRE-EXAM REGION & PATIENT INTAKE === */}
        {!examination && (
          <div className="space-y-4">
            {/* --- PHASE 0: PATIENT PHOTO INTAKE & 3D MESH CALIBRATION --- */}
            <div className="bg-slate-950/95 border border-cyan-500/50 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/60 flex items-center gap-1.5">
                  <Camera className="w-3 h-3 text-cyan-400" />
                  Step 1: Patient Photo Intake
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {patientCalibration ? 'Calibrated ✓' : 'Required for 3D Mesh'}
                </span>
              </div>

              {!patientCalibration ? (
                <>
                  <div>
                    <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Take Photo to Reconstruct Exact Patient 3D Body Mesh
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Capture or upload a photo of the patient. Python MediaPipe 3D Pose extracts 33 anatomical landmarks to reconstruct an exact 3D wireframe mesh body matching their specific height, limb lengths, and proportions.
                    </p>
                  </div>

                  {/* Camera Viewfinder when Live Camera is Open */}
                  {isPhotoCameraOpen && (
                    <div className="space-y-2 bg-slate-900 p-3 rounded-xl border border-cyan-500/60">
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                        <video
                          ref={photoVideoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        {/* Anatomical Alignment Outline Box */}
                        <div className="absolute inset-4 border-2 border-dashed border-cyan-400/70 rounded-xl pointer-events-none flex items-center justify-center">
                          <span className="bg-black/70 text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded backdrop-blur">
                            Align Patient in View (Standing or Seated)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCapturePhoto}
                          disabled={isCalibratingPhoto}
                          className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Snap Photo & Reconstruct Exact 3D Mesh
                        </button>
                        <button
                          type="button"
                          onClick={handleStopPhotoCamera}
                          className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons to Capture, Upload, or Instant Demo */}
                  {!isPhotoCameraOpen && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleStartPhotoCamera}
                          disabled={isCalibratingPhoto}
                          className="py-2.5 px-3 bg-cyan-700/80 hover:bg-cyan-600 text-white text-xs font-bold rounded-xl border border-cyan-500/60 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          <Camera className="w-3.5 h-3.5 text-cyan-200" />
                          Live Webcam Photo
                        </button>

                        <label className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md">
                          <Upload className="w-3.5 h-3.5 text-cyan-400" />
                          Upload Photo File
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadPhoto}
                            disabled={isCalibratingPhoto}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Instant Clinical Biometric Calibration Option */}
                      <button
                        type="button"
                        onClick={handleInstantDemoCalibration}
                        disabled={isCalibratingPhoto}
                        className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-bold rounded-xl border border-dashed border-cyan-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        ⚡ Instant Clinical Biometric Calibration (Demo/Fast-Track)
                      </button>
                    </div>
                  )}

                  {/* Calibrating Loading Banner */}
                  {isCalibratingPhoto && (
                    <div className="p-3 bg-cyan-950/80 border border-cyan-500/60 rounded-xl text-xs text-cyan-200 flex items-center gap-3 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      <div>
                        <div className="font-bold">MediaPipe 3D Landmark Extraction in Progress...</div>
                        <div className="text-[10px] text-cyan-400">
                          Extracting 33 biometric landmarks & building patient-specific 3D wireframe mesh
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Calibration Error */}
                  {calibrationError && (
                    <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span>{calibrationError}</span>
                    </div>
                  )}
                </>
              ) : (
                /* Patient Mesh Calibrated Status Card */
                <div className="space-y-3">
                  {/* Step 1: AI Detected Body Part Banner */}
                  {patientCalibration.detected_body_part && (
                    <div className="bg-gradient-to-r from-cyan-950/95 to-slate-900/95 border-2 border-cyan-400/90 rounded-xl p-3 shadow-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-cyan-900/60 rounded-lg border border-cyan-500/40">
                          <Target className="w-5 h-5 text-cyan-300 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                            <span>Step 1: AI Detected Body Part</span>
                            <span className="text-[9px] bg-cyan-900 text-cyan-200 px-1.5 py-0.2 rounded border border-cyan-700">
                              {(patientCalibration.detected_body_part.confidence * 100).toFixed(0)}% Conf
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white">
                            🎯 {patientCalibration.detected_body_part.display_name}
                          </div>
                          <div className="text-[10px] text-cyan-300 font-mono">
                            Posture: {patientCalibration.detected_body_part.posture} • Exact 3D mesh reconstructed & focused
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (patientCalibration.detected_body_part && onSelectRegion) {
                            const p = patientCalibration.detected_body_part;
                            onSelectRegion(p.region_id, p.side === 'BILATERAL' ? 'RIGHT' : p.side);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold rounded-lg transition-colors shadow flex items-center gap-1 cursor-pointer"
                      >
                        Start Exam
                      </button>
                    </div>
                  )}

                  <div className="bg-emerald-950/70 border border-emerald-500/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        Exact Patient 3D Body Mesh Calibrated
                      </div>
                      <span className="text-[10px] bg-emerald-900/90 text-emerald-300 px-2 py-0.5 rounded font-mono border border-emerald-600/60">
                        33 3D Spatial Landmarks
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-1 text-center font-mono">
                      <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                        <div className="text-[9px] text-slate-400 uppercase">Height</div>
                        <div className="text-xs font-bold text-cyan-300">
                          {patientCalibration.body_proportions.estimated_height_cm}cm
                        </div>
                      </div>
                      <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                        <div className="text-[9px] text-slate-400 uppercase">Shoulders</div>
                        <div className="text-xs font-bold text-cyan-300">
                          {(patientCalibration.body_proportions.shoulder_width_m * 100).toFixed(0)}cm
                        </div>
                      </div>
                      <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                        <div className="text-[9px] text-slate-400 uppercase">Pelvis</div>
                        <div className="text-xs font-bold text-cyan-300">
                          {(patientCalibration.body_proportions.hip_width_m * 100).toFixed(0)}cm
                        </div>
                      </div>
                      <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                        <div className="text-[9px] text-slate-400 uppercase">Torso</div>
                        <div className="text-xs font-bold text-cyan-300">
                          {(patientCalibration.body_proportions.torso_height_m * 100).toFixed(0)}cm
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      Wireframe rendered in 3D viewer matching patient biometrics
                    </span>
                    {onResetCalibration && (
                      <button
                        type="button"
                        onClick={onResetCalibration}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer underline"
                      >
                        <RotateCw className="w-3 h-3" />
                        Retake / Recalibrate Photo
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* --- PHASE 1: INTERACTIVE PAIN LOCALIZATION ON 3D MESH --- */}
            <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/60 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Step 2: Patient Pain Localization
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Interactive Selection
                </span>
              </div>
              <h2 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                Select Patient's Painful Location
              </h2>
              <div className="bg-cyan-950/60 border border-cyan-600/40 rounded-xl p-3 text-xs text-cyan-200/95 leading-relaxed">
                <strong>Operator Directive:</strong> Ask the patient where they feel pain. <strong>Click directly on that point on the patient's 3D wireframe mesh body</strong> (or choose a quick anatomical region below) to identify the anatomical region and start the AI questions.
              </div>
            </div>

            {/* Currently Targeted Region & Direct Launch Button */}
            <div className="bg-slate-950/90 border border-cyan-500/50 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Targeted Anatomical Region:
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/80">
                  {affectedSide} SIDE
                </span>
              </div>
              
              <div className="text-base font-extrabold text-white flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                <span>{selectedRegion.replace('_', ' ')}</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  onStartExam({
                    patient_id: patientId,
                    patient_name: patientName,
                    patient_age: patientAge,
                    patient_gender: patientGender,
                    selected_region: selectedRegion,
                    affected_side: affectedSide,
                  })
                }
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Identify Anatomical Region & Start AI Protocol →
              </button>
            </div>

            {/* Quick 1-Click Anatomical Target Grid */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Or Choose Quick Anatomical Target:</span>
                <span className="text-[10px] text-cyan-400 font-mono">1-Click Launch</span>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {[
                  { id: 'RIGHT_KNEE', label: 'Right Knee Joint', side: 'RIGHT' as const, sub: 'Ottawa Knee Protocol' },
                  { id: 'LEFT_KNEE', label: 'Left Knee Joint', side: 'LEFT' as const, sub: 'Ottawa Knee Protocol' },
                  { id: 'RIGHT_SHOULDER', label: 'Right Shoulder', side: 'RIGHT' as const, sub: 'Rotator Cuff Protocol' },
                  { id: 'LEFT_SHOULDER', label: 'Left Shoulder', side: 'LEFT' as const, sub: 'Rotator Cuff Protocol' },
                  { id: 'RIGHT_ELBOW', label: 'Right Elbow Joint', side: 'RIGHT' as const, sub: 'Epicondyle Protocol' },
                  { id: 'LEFT_ELBOW', label: 'Left Elbow Joint', side: 'LEFT' as const, sub: 'Epicondyle Protocol' },
                  { id: 'RIGHT_WRIST', label: 'Right Wrist & Hand', side: 'RIGHT' as const, sub: 'Carpal Tunnel Protocol' },
                  { id: 'LEFT_WRIST', label: 'Left Wrist & Hand', side: 'LEFT' as const, sub: 'Carpal Tunnel Protocol' },
                  { id: 'RIGHT_HIP', label: 'Right Hip & Pelvis', side: 'RIGHT' as const, sub: 'Trendelenburg Protocol' },
                  { id: 'LEFT_HIP', label: 'Left Hip & Pelvis', side: 'LEFT' as const, sub: 'Trendelenburg Protocol' },
                  { id: 'RIGHT_ANKLE', label: 'Right Ankle & Foot', side: 'RIGHT' as const, sub: 'Ottawa Ankle Protocol' },
                  { id: 'LEFT_ANKLE', label: 'Left Ankle & Foot', side: 'LEFT' as const, sub: 'Ottawa Ankle Protocol' },
                  { id: 'LUMBAR_SPINE', label: 'Lumbar Spine (Low Back)', side: 'RIGHT' as const, sub: 'Sciatica Protocol' },
                  { id: 'CERVICAL_SPINE', label: 'Cervical Spine (Neck)', side: 'RIGHT' as const, sub: 'Radiculopathy Protocol' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectRegion(item.id, item.side);
                      onStartExam({
                        patient_id: patientId,
                        patient_name: patientName,
                        patient_age: patientAge,
                        patient_gender: patientGender,
                        selected_region: item.id,
                        affected_side: item.side,
                      });
                    }}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedRegion === item.id
                        ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-cyan-500/60 hover:text-white'
                    }`}
                  >
                    <div className="font-bold">{item.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {item.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Non-blocking Patient Demographics (Collapsible) */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <button
                type="button"
                onClick={() => setShowDemographics(!showDemographics)}
                className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  Patient: <span className="text-white font-mono">{patientId}</span> • {patientName} ({patientAge}y, {patientGender})
                </span>
                <span className="text-[10px] text-cyan-400 underline font-mono">
                  {showDemographics ? 'Hide Details' : 'Edit Demographics'}
                </span>
              </button>

              {showDemographics && (
                <div className="grid grid-cols-2 gap-2.5 pt-3 mt-3 border-t border-slate-800/80">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                      Patient ID
                    </label>
                    <input
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                      Patient Name
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={patientAge}
                      onChange={(e) => setPatientAge(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                      Gender
                    </label>
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === SCREEN 2: ACTIVE EXAMINATION CONTROLLER === */}
        {examination && (
          <div className="space-y-4">
            {/* --- ANATOMICAL REGION IDENTIFIED HERO BANNER --- */}
            <div className="identified-hero-banner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-cyan-400 font-mono tracking-wider">
                      ✓ Anatomical Region Identified & Engaged
                    </div>
                    <div className="text-sm font-extrabold text-white">
                      {examination.affected_side} {examination.selected_region.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2.5 py-1 rounded-full font-mono font-bold">
                  {examination.protocol_name}
                </span>
              </div>
            </div>

            {/* Examination Progress Header */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300">
                  Step {examination.current_step_index} of {examination.total_steps}
                </span>
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  Phase: {currentStep?.phase || 'COMPLETE'}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
                  style={{
                    width: `${(examination.current_step_index / examination.total_steps) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* --- EMERGENCY SAFETY ALERT BANNER (IF RED FLAG TRIGGERED) --- */}
            {examination.urgent_referral && (
              <div className="bg-red-950/90 border-2 border-red-500 rounded-xl p-4 shadow-2xl animate-pulse">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-red-200 uppercase tracking-wide">
                      CRITICAL SAFETY STOP: Urgent Clinician Referral Triggered
                    </h3>
                    <p className="text-xs text-red-300 leading-relaxed">
                      {examination.urgent_referral_reason}
                    </p>
                    <div className="bg-red-900/60 border border-red-700/60 p-2.5 rounded-lg text-xs text-red-200">
                      <strong>AI Directive to Operator:</strong> Cease all provocative active range of motion and weight-bearing testing immediately to prevent physical harm. Expedite immediate clinician evaluation.
                    </div>
                    <button
                      onClick={onOpenReport}
                      className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Emergency Referral Documentation
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- COMPLETED BANNER --- */}
            {examination.status === 'COMPLETED' && !examination.urgent_referral && (
              <div className="bg-emerald-950/90 border border-emerald-500/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  Physical Examination Protocol Completed
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  {examination.clinical_summary}
                </p>
                <button
                  onClick={onOpenReport}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Open Structured Clinical Report for Clinician Sign-Off
                </button>
              </div>
            )}

            {/* --- 🧠 CONSULTATION CLINICAL MEMORY & PREVIOUS KNOWLEDGE PANEL --- */}
            {examination && (
              <div className="bg-slate-950/95 border border-indigo-500/40 rounded-xl p-3.5 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-950 border border-indigo-500/40 rounded-xl text-indigo-400">
                      <Brain className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>AI क्लिनिकल मेमोरी व पूर्व ज्ञान</span>
                        <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/80 px-2 py-0.5 rounded-full font-mono">
                          {consultationHistory.completedStepsCount} / {consultationHistory.totalStepsCount} Steps Logged
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                        {languageMode === 'hi' ? consultationHistory.contextSummaryHi : consultationHistory.contextSummaryEn}
                      </p>
                    </div>
                  </div>

                  {consultationHistory.completedStepsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex-shrink-0"
                      title="पिछली सभी बातचीत और मरीज के जवाब देखें"
                    >
                      <History className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{showHistoryPanel ? 'इतिहास छिपाएं' : 'पिछला इतिहास'}</span>
                      {showHistoryPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* Expandable Consultation History Timeline */}
                {showHistoryPanel && consultationHistory.historyItems.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800 space-y-2 max-h-56 overflow-y-auto pr-1">
                    {consultationHistory.historyItems.map((item) => (
                      <div
                        key={item.stepIndex}
                        className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[10px] text-indigo-300 font-mono">
                          <span className="font-bold">कदम {item.stepIndex}: {item.title}</span>
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{item.phase}</span>
                        </div>
                        <div className="text-slate-200 font-medium text-[11px] leading-relaxed">
                          Q: "{item.questionHi || item.questionEn}"
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            {item.answerSummary}
                          </span>
                          {item.spokenTranscript && (
                            <span className="text-[11px] text-amber-300/90 italic truncate max-w-[220px]" title={item.spokenTranscript}>
                              🗣️ "{item.spokenTranscript}"
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- ACTIVE STEP CARD (AI DIRECTIVE & QUESTION) --- */}
            {examination.status === 'ACTIVE' && currentStep && (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* 1. Step Title & Operator Directive */}
                <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl p-4 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                      Step {currentStep.step_index}: {currentStep.phase}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Action: {currentStep.action_type}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">
                    {currentStep.title}
                  </h3>

                  {/* Context Continuity Notice (Shows AI knowledge of prior question/answer) */}
                  {consultationHistory.completedStepsCount > 0 && (
                    <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg px-3 py-1.5 text-[11px] text-indigo-300 flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>
                        <strong>पूर्व संदर्भ (Prior Context):</strong>{' '}
                        {consultationHistory.historyItems[consultationHistory.historyItems.length - 1]?.answerSummary}
                      </span>
                    </div>
                  )}

                  {/* Operator Directive */}
                  <div className="bg-blue-950/40 border border-blue-600/30 rounded-lg p-3">
                    <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      AI Directive for Operator:
                    </div>
                    <p className="text-xs text-blue-200/90 leading-relaxed">
                      {currentStep.operator_instruction}
                    </p>
                  </div>

                  {/* Patient Question (Verbatim dialogue with Indian Hindi Voice) */}
                  {currentStep.patient_question && (
                    <div className="bg-slate-900/95 border-2 border-amber-500/40 rounded-xl p-3.5 shadow-lg space-y-2.5">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            {languageMode === 'hi' ? 'मरीज से सीधे पूछें (गाँव / सरल हिंदी):' : 'Ask Patient Verbatim:'}
                          </span>
                          <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                            <span>🇮🇳</span> {detectedVoiceLabel}
                          </span>
                        </div>

                        {/* Audio Controls */}
                        <div className="flex items-center gap-1.5">
                          {isSpeaking ? (
                            <button
                              type="button"
                              onClick={handleStopAudio}
                              className="flex items-center gap-1.5 px-3 py-1 bg-red-950 hover:bg-red-900 text-red-300 border border-red-700/80 rounded-lg text-xs font-semibold shadow transition-all animate-pulse"
                              title="आवाज़ रोकें (Stop Speaking)"
                            >
                              <VolumeX className="w-3.5 h-3.5 text-red-400" />
                              <span>रोकें</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => playQuestionAudio('hi')}
                              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border border-amber-400/50 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
                              title="भारतीय हिंदी आवाज़ में बोलकर सुनाएं"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>🔊 हिंदी बोलें</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => playQuestionAudio('en')}
                            className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs font-semibold transition-colors"
                            title="English Voice Readout"
                          >
                            EN
                          </button>
                        </div>
                      </div>

                      {/* Primary Hindi Text */}
                      <blockquote className="text-sm font-medium text-amber-200 border-l-4 border-amber-400 pl-3 py-1.5 leading-relaxed bg-amber-950/20 rounded-r-lg">
                        "{getHindiQuestion(currentStep.step_id, currentStep.patient_question_hi)}"
                      </blockquote>

                      {/* English subtitle for operator reference */}
                      <div className="text-[11px] text-slate-400 italic pl-3 border-l-2 border-slate-700/60 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 uppercase not-italic font-mono">EN:</span>
                        "{currentStep.patient_question}"
                      </div>

                      {/* --- Patient Voice Answer & Real-time Editable Transcript --- */}
                      <div className="bg-slate-950/95 border border-cyan-500/30 rounded-xl p-3 space-y-2 mt-3 pt-3 border-t border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5 text-cyan-400" />
                            <span>मरीज की आवाज़ सुनें (Patient Voice Answer):</span>
                          </span>

                          <div className="flex items-center gap-2">
                            {isListeningPatient ? (
                              <button
                                type="button"
                                onClick={handleToggleListenPatient}
                                className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold animate-pulse shadow-md transition-all"
                                title="सुनना समाप्त करें (Stop Listening)"
                              >
                                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                <MicOff className="w-3.5 h-3.5" />
                                <span>⏹ बोलना समाप्त (Done)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handleToggleListenPatient}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
                                title="मरीज के उत्तर को आवाज़ से सुनें और टाइप करें"
                              >
                                <Mic className="w-3.5 h-3.5" />
                                <span>🎤 मरीज की आवाज़ सुनें (Listen)</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Listening Radar / Pulse Bar */}
                        {isListeningPatient && (
                          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-cyan-950/70 border border-cyan-500/40 rounded-lg text-xs text-cyan-200 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            <span>
                              {languageMode === 'hi'
                                ? '🔴 माइक चालू है: मरीज हिंदी में अपना जवाब बोलें...'
                                : '🔴 Microphone listening: Patient speaking...'}
                            </span>
                          </div>
                        )}

                        {/* Auto-detected intent banner */}
                        {autoDetectedPill && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-[11px] text-emerald-300">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span><strong>AI Auto-Recognized:</strong> {autoDetectedPill}</span>
                          </div>
                        )}

                        {/* Editable Live Transcript Area */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 text-slate-300">
                              <Edit3 className="w-3 h-3 text-amber-400" />
                              मरीज का बोला गया जवाब (Editable Transcript):
                            </span>
                            {patientTranscript && (
                              <button
                                type="button"
                                onClick={handleClearTranscript}
                                className="text-red-400 hover:text-red-300 flex items-center gap-0.5 text-[10px]"
                                title="ट्रांसक्रिप्ट हटाएं"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                                साफ़ करें (Clear)
                              </button>
                            )}
                          </div>

                          <textarea
                            value={patientTranscript}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPatientTranscript(val);
                              if (currentStep) {
                                const parsed = parsePatientSpokenIntent(val, currentStep);
                                applySmartIntent(parsed);
                              }
                            }}
                            rows={2}
                            placeholder={
                              languageMode === 'hi'
                                ? 'मरीज के बोलने पर शब्द यहाँ स्वतः टाइप होंगे... (यदि कोई गलती हो तो आप यहाँ क्लिक करके सुधार सकते हैं)'
                                : 'Spoken words appear here in real-time... (Click to edit or correct any mistake)'
                            }
                            className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 resize-none transition-all leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Operator Response Controls */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Operator Input Response:
                  </div>

                  {/* Case A: QUESTION_BOOLEAN */}
                  {currentStep.action_type === 'QUESTION_BOOLEAN' && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setBooleanResponse(false)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                          booleanResponse === false
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-200 shadow-lg'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        NO / NEGATIVE
                      </button>

                      <button
                        type="button"
                        onClick={() => setBooleanResponse(true)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                          booleanResponse === true
                            ? 'bg-red-950 border-red-500 text-red-200 shadow-lg'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        YES / POSITIVE
                      </button>
                    </div>
                  )}

                  {/* Case B: QUESTION_CHOICE */}
                  {currentStep.action_type === 'QUESTION_CHOICE' && currentStep.input_config?.choices && (
                    <div className="space-y-2">
                      {currentStep.input_config.choices.map((choice) => (
                        <button
                          key={choice.value}
                          type="button"
                          onClick={() => setSelectedChoice(choice.value)}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                            selectedChoice === choice.value
                              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-semibold">{choice.label}</div>
                          {choice.zone && (
                            <div className="text-[10px] text-cyan-400/80 font-mono mt-0.5">
                              Mesh Zone: {choice.zone}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Case C: VIDEO_MOVEMENT (MediaPipe Active ROM) */}
                  {currentStep.action_type === 'VIDEO_MOVEMENT' && (
                    <div className="space-y-3">
                      <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                            <Video className="w-4 h-4 text-cyan-400" />
                            Motion Capture & Landmark Tracking
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Required: {currentStep.input_config?.target_duration_sec || 8}s {currentStep.input_config?.plane || 'SAGITTAL'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {currentStep.input_config?.camera_guidance || 'Position camera at 90 degrees to patient.'}
                        </p>
                      </div>

                      {/* Video capture / test buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {!isRecording ? (
                          <button
                            type="button"
                            onClick={handleStartWebcam}
                            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                          >
                            <Video className="w-3.5 h-3.5 text-cyan-400" />
                            Record with Webcam
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleStopRecording}
                            className="py-2.5 px-3 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 animate-pulse"
                          >
                            <div className="w-2.5 h-2.5 rounded-sm bg-white" />
                            Stop Recording
                          </button>
                        )}

                        <label className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-cyan-400" />
                          Upload Video File
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Quick Simulated Live Patient Kinematics button */}
                      <button
                        type="button"
                        onClick={() => {
                          setUseSyntheticDemo(true);
                          setVideoFile(null);
                          setVideoPreviewUrl(null);
                        }}
                        className={`w-full py-2.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          useSyntheticDemo
                            ? 'bg-amber-950 border-amber-500 text-amber-200'
                            : 'bg-slate-900 border-dashed border-amber-500/50 text-amber-400 hover:bg-amber-950/40'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {useSyntheticDemo
                          ? '✓ Synthetic Patient Kinematics Ready (Click Send)'
                          : '⚡ Run Live Simulated Patient Kinematics (Instant Demo)'}
                      </button>

                      {/* Video Preview or Live Webcam View */}
                      {isRecording && (
                        <div className="relative rounded-lg overflow-hidden border border-red-500 bg-black aspect-video flex items-center justify-center">
                          <video ref={videoElemRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold animate-pulse">
                            REC ●
                          </div>
                        </div>
                      )}

                      {videoPreviewUrl && !isRecording && (
                        <div className="rounded-lg overflow-hidden border border-cyan-500/40 bg-black aspect-video flex items-center justify-center">
                          <video src={videoPreviewUrl} controls className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Case D: PALPATION_SCORE */}
                  {currentStep.action_type === 'PALPATION_SCORE' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Pain Provocation Severity:</span>
                        <span className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded ${
                          numericScore >= 7
                            ? 'bg-red-950 text-red-400 border border-red-600/50'
                            : numericScore >= 4
                            ? 'bg-amber-950 text-amber-400 border border-amber-600/50'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-600/50'
                        }`}>
                          {numericScore.toFixed(0)} / 10 NRS
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={numericScore}
                        onChange={(e) => setNumericScore(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />

                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>0 (No Pain)</span>
                        <span>5 (Moderate)</span>
                        <span>10 (Worst Possible)</span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        Computer Vision Analyzing Kinematics...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Submission to AI Controller
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
