import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { DenseHumanMesh } from './DenseHumanMesh';
import { PatientSpecificMesh } from './PatientSpecificMesh';
import { KinematicMotionSkeleton } from './KinematicMotionSkeleton';
import { MedicalExaminationBed } from './MedicalExaminationBed';
import {
  type DoctorExamDirective,
  DOCTOR_DIRECTIVE_CONFIGS,
  generateDoctorKinematicSequence,
} from '../../utils/doctorExamKinematics';
import { speakInIndianHindi, stopSpeaking } from '../../utils/hindiTranslations';
import type {
  BiomechanicalMeasurement,
  ClinicalFinding,
  PatientCalibration,
  Point3D,
  PointAnalysis,
  PainPathAnalysis,
} from '../../types/examination';
import { analyzeBodyPoint } from '../../services/api';
import {
  Eye,
  Play,
  Pause,
  Repeat,
  UserCheck,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Target,
  Zap,
  BedDouble,
  Footprints,
  Move,
  ArrowUpDown,
  Volume2,
  VolumeX,
  Stethoscope,
  CheckCircle2,
  Video,
  RotateCw,
  ArrowUpRight,
  Activity,
  Undo2,
} from 'lucide-react';

interface BodyMeshViewerProps {
  selectedRegion: string;
  onSelectRegion?: (region: string, side: 'RIGHT' | 'LEFT') => void;
  affectedSide: 'RIGHT' | 'LEFT' | 'BILATERAL';
  measurements?: BiomechanicalMeasurement[];
  findings?: ClinicalFinding[];
  isExamActive: boolean;
  activeExamStepId?: string | null;
  activeDoctorDirective?: DoctorExamDirective;
  onSelectDoctorDirective?: (dir: DoctorExamDirective) => void;
  patientCalibration?: PatientCalibration | null;
  selectedPoint?: Point3D | null;
  selectedPoints?: Point3D[];
  selectionMode?: 'POINT' | 'LINE';
  onChangeSelectionMode?: (mode: 'POINT' | 'LINE') => void;
  pointAnalysis?: PointAnalysis | null;
  painPathAnalysis?: PainPathAnalysis | null;
  onSelectPoint?: (point: Point3D, analysis?: PointAnalysis) => void;
  onAddPointToPath?: (point: Point3D) => void;
  onUndoPoint?: () => void;
  onClearPoints?: () => void;
  onStartPointExam?: (point: Point3D, analysis: PointAnalysis) => void;
  onClearPoint?: () => void;
  onApplyClinicalFinding?: (title: string, description: string, severity: string) => void;
}

const BODY_CENTER: [number, number, number] = [0, -0.05, 0];
const DEFAULT_CAM_POS: [number, number, number] = [0, 0.0, 3.2];

export const BodyMeshViewer: React.FC<BodyMeshViewerProps> = ({
  selectedRegion,
  onSelectRegion,
  affectedSide,
  measurements = [],
  findings = [],
  isExamActive,
  activeExamStepId,
  activeDoctorDirective,
  onSelectDoctorDirective,
  patientCalibration,
  selectedPoint,
  selectedPoints = [],
  selectionMode = 'LINE',
  onChangeSelectionMode,
  pointAnalysis,
  painPathAnalysis,
  onSelectPoint,
  onAddPointToPath,
  onUndoPoint,
  onClearPoints,
  onStartPointExam,
  onClearPoint,
  onApplyClinicalFinding,
}) => {
  const controlsRef = useRef<OrbitControlsType>(null);

  // High-Level Operator Mode: 'PIN_POINTS' (Interactive 3D Body Surface Pinning & Radiation Lines) vs 'DIRECTIVES' (Doctor Physical Movements & Video)
  const [viewerMode, setViewerMode] = useState<'PIN_POINTS' | 'DIRECTIVES'>('PIN_POINTS');

  // Point Selection & Decision State
  const [localPoint, setLocalPoint] = useState<Point3D | null>(null);
  const [localAnalysis, setLocalAnalysis] = useState<PointAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const activePoint = selectedPoint !== undefined ? selectedPoint : localPoint;
  const activeAnalysis = pointAnalysis !== undefined ? pointAnalysis : localAnalysis;

  // Doctor Clinical Physical Examination Directive Mode
  const [doctorExamDirective, setDoctorExamDirective] = useState<DoctorExamDirective>('STAND_NEUTRAL');
  const [isSpeakingInstruction, setIsSpeakingInstruction] = useState<boolean>(false);
  const [showDirectiveBanner, setShowDirectiveBanner] = useState<boolean>(true);

  // Motion replay state
  const [isPlayingMotion, setIsPlayingMotion] = useState(false);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Extract motion sequence frames from latest video measurement
  const videoMeasurementFrames = useMemo(() => {
    for (let i = measurements.length - 1; i >= 0; i--) {
      const m = measurements[i];
      if (m.timeseries_data && m.timeseries_data.length > 0) {
        const framesWithLms = m.timeseries_data.filter(
          (f) => f.frame_landmarks_3d && f.frame_landmarks_3d.length > 0
        );
        if (framesWithLms.length > 0) return framesWithLms;
      }
    }
    return [];
  }, [measurements]);

  // Auto-switch to UPLOADED_VIDEO mode when real patient video measurements are loaded
  useEffect(() => {
    if (videoMeasurementFrames.length > 0) {
      setDoctorExamDirective('UPLOADED_VIDEO');
      setIsPlayingMotion(true);
      setCurrentFrameIdx(0);
    }
  }, [videoMeasurementFrames.length]);

  // Sync with active protocol step if it corresponds to a doctor physical test
  useEffect(() => {
    if (!activeExamStepId) return;
    const stepUpper = activeExamStepId.toUpperCase();
    if (stepUpper.includes('STRAIGHT_LEG_RAISE') || stepUpper.includes('SLR') || stepUpper.includes('LASEGUE') || stepUpper.includes('BED')) {
      handleSelectDirective('BED_SLR');
    } else if (stepUpper.includes('GAIT') || stepUpper.includes('WALK') || stepUpper.includes('FORWARD')) {
      handleSelectDirective('MOVE_FORWARD');
    } else if (stepUpper.includes('SQUAT') || (stepUpper.includes('ABDUCTION') && !stepUpper.includes('SHOULDER')) || stepUpper.includes('SPREAD')) {
      handleSelectDirective('SPREAD_LEGS');
    } else if (stepUpper.includes('CERVICAL') || stepUpper.includes('NECK') || stepUpper.includes('HEAD')) {
      handleSelectDirective('NECK_ROTATION');
    } else if (stepUpper.includes('SHOULDER') || stepUpper.includes('ARM')) {
      handleSelectDirective('SHOULDER_ABDUCTION');
    } else if (stepUpper.includes('LUMBAR') || stepUpper.includes('SPINE') || stepUpper.includes('BACK') || stepUpper.includes('BEND')) {
      handleSelectDirective('LUMBAR_FLEXION');
    } else if (stepUpper.includes('FLEXION_EXTENSION') || stepUpper.includes('AROM') || stepUpper.includes('KNEE')) {
      handleSelectDirective('LEG_UP_DOWN');
    }
  }, [activeExamStepId]);

  // Current active directive configuration
  const activeDirectiveConfig = DOCTOR_DIRECTIVE_CONFIGS[doctorExamDirective];

  // Active motion frames (from doctor directive animation sequence OR recorded video measurement)
  const activeSequenceFrames = useMemo(() => {
    if (doctorExamDirective === 'UPLOADED_VIDEO') {
      return videoMeasurementFrames.length > 0 ? videoMeasurementFrames : [];
    }
    if (doctorExamDirective !== 'STAND_NEUTRAL') {
      return generateDoctorKinematicSequence(
        doctorExamDirective,
        affectedSide === 'BILATERAL' ? 'RIGHT' : affectedSide,
        patientCalibration?.body_proportions
      );
    }
    return videoMeasurementFrames;
  }, [doctorExamDirective, affectedSide, patientCalibration?.body_proportions, videoMeasurementFrames]);

  // Continuous motion playback timer
  useEffect(() => {
    if (!isPlayingMotion || activeSequenceFrames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrameIdx((prev) => (prev + 1) % activeSequenceFrames.length);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlayingMotion, activeSequenceFrames]);

  const activeFrameData = activeSequenceFrames.length > 0 ? activeSequenceFrames[currentFrameIdx] : null;

  const handlePointSelect = async (pt: Point3D) => {
    if (onAddPointToPath) {
      onAddPointToPath(pt);
      return;
    }

    setLocalPoint(pt);
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeBodyPoint(
        { x: pt.x, y: pt.y, z: pt.z },
        pt.normal,
        affectedSide
      );
      setLocalAnalysis(analysis);
      if (onSelectPoint) {
        onSelectPoint(pt, analysis);
      }
      setView(pt.x, pt.y, pt.z + 1.15, [pt.x, pt.y, pt.z]);
    } catch (err) {
      console.error('Point analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearPin = () => {
    setLocalPoint(null);
    setLocalAnalysis(null);
    if (onClearPoints) {
      onClearPoints();
    }
    if (onClearPoint) {
      onClearPoint();
    }
    setFullBodyView();
  };

  // Zoom and Camera controls
  const handleZoom = (delta: number) => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const cam = controls.object;
      const target = controls.target;
      const dir = new THREE.Vector3().subVectors(cam.position, target);
      const currentDist = dir.length();
      const newDist = Math.max(0.6, Math.min(7.5, currentDist + delta));
      dir.setLength(newDist);
      cam.position.copy(target).add(dir);
      controls.update();
    }
  };

  const setView = (x: number, y: number, z: number, target: [number, number, number] = BODY_CENTER) => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(x, y, z);
      controlsRef.current.target.set(...target);
      controlsRef.current.update();
    }
  };

  const setFullBodyView = () => {
    setView(DEFAULT_CAM_POS[0], DEFAULT_CAM_POS[1], DEFAULT_CAM_POS[2], BODY_CENTER);
  };

  // Sync with prop if passed
  useEffect(() => {
    if (activeDoctorDirective && activeDoctorDirective !== doctorExamDirective) {
      handleSelectDirective(activeDoctorDirective);
    }
  }, [activeDoctorDirective]);

  // Switch Doctor Physical Examination Directive
  const handleSelectDirective = (dir: DoctorExamDirective) => {
    setDoctorExamDirective(dir);
    if (onSelectDoctorDirective) {
      onSelectDoctorDirective(dir);
    }
    setCurrentFrameIdx(0);
    setShowDirectiveBanner(true);

    if (dir !== 'STAND_NEUTRAL') {
      setViewerMode('DIRECTIVES');
      setIsPlayingMotion(true);
      const cfg = DOCTOR_DIRECTIVE_CONFIGS[dir];
      setView(
        cfg.cameraViewPreset.camPos[0],
        cfg.cameraViewPreset.camPos[1],
        cfg.cameraViewPreset.camPos[2],
        cfg.cameraViewPreset.target
      );
    } else {
      setViewerMode('PIN_POINTS');
      setIsPlayingMotion(false);
      setFullBodyView();
    }
  };

  // Voice synthesis: speak doctor verbatim instructions to the patient in Hindi
  const handleSpeakDirective = () => {
    if (!activeDirectiveConfig) return;
    if (isSpeakingInstruction) {
      stopSpeaking();
      setIsSpeakingInstruction(false);
      return;
    }

    setIsSpeakingInstruction(true);
    speakInIndianHindi(activeDirectiveConfig.doctorVoicePromptHi, {
      onEnd: () => setIsSpeakingInstruction(false),
      onError: () => setIsSpeakingInstruction(false),
    });
  };

  // Apply clinical finding to examination
  const handleApplyFinding = () => {
    if (!activeDirectiveConfig || !onApplyClinicalFinding) return;
    onApplyClinicalFinding(
      activeDirectiveConfig.detectedIssueTitle,
      activeDirectiveConfig.detectedIssueDetail,
      activeDirectiveConfig.detectedIssueSeverity
    );
  };

  const focusOnSelectedRegion = (comfortDistance: number = 2.6) => {
    if (!controlsRef.current) return;
    if (activePoint) {
      setView(activePoint.x * 0.3, activePoint.y * 0.4, comfortDistance, [activePoint.x * 0.2, activePoint.y * 0.3, 0]);
      return;
    }
    if (!selectedRegion) {
      setFullBodyView();
      return;
    }
    const isRight = affectedSide === 'RIGHT' || selectedRegion.includes('RIGHT');
    const xMult = isRight ? -1 : 1;

    let targetJoint: [number, number, number] = [xMult * 0.08, -0.25, 0.0];
    let camPos: [number, number, number] = [xMult * 0.08, -0.25, comfortDistance];

    const reg = selectedRegion.toUpperCase();
    if (reg.includes('SHOULDER')) {
      targetJoint = [xMult * 0.12, 0.45, 0.0];
      camPos = [xMult * 0.12, 0.45, comfortDistance];
    } else if (reg.includes('ELBOW')) {
      targetJoint = [xMult * 0.18, 0.25, 0.0];
      camPos = [xMult * 0.18, 0.25, comfortDistance];
    } else if (reg.includes('WRIST')) {
      targetJoint = [xMult * 0.22, 0.10, 0.0];
      camPos = [xMult * 0.22, 0.10, comfortDistance];
    } else if (reg.includes('HIP') || reg.includes('THIGH')) {
      targetJoint = [xMult * 0.08, -0.15, 0.0];
      camPos = [xMult * 0.08, -0.15, comfortDistance];
    } else if (reg.includes('KNEE') || reg.includes('SHIN')) {
      targetJoint = [xMult * 0.08, -0.40, 0.0];
      camPos = [xMult * 0.08, -0.40, comfortDistance];
    } else if (reg.includes('ANKLE') || reg.includes('FOOT')) {
      targetJoint = [xMult * 0.08, -0.65, 0.0];
      camPos = [xMult * 0.08, -0.65, comfortDistance];
    } else if (reg.includes('SPINE') || reg.includes('LUMBAR')) {
      targetJoint = [0, 0.18, -0.02];
      camPos = [0, 0.18, comfortDistance];
    } else if (reg.includes('CERVICAL') || reg.includes('NECK')) {
      targetJoint = [0, 0.50, 0.0];
      camPos = [0, 0.50, comfortDistance];
    }

    setView(camPos[0], camPos[1], camPos[2], targetJoint);
  };

  const regionDisplayName = selectedRegion ? selectedRegion.replace(/_/g, ' ') : '';

  return (
    <div className="relative w-full flex-1 min-h-[440px] flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Header Controls & Camera Presets */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between pointer-events-none gap-2">
        {/* Left Side: Dual-Mode Primary Switcher Tabs */}
        <div className="flex items-center bg-slate-900/95 border border-cyan-500/60 p-1 rounded-xl shadow-xl backdrop-blur-md pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              setViewerMode('PIN_POINTS');
              handleSelectDirective('STAND_NEUTRAL');
              setIsPlayingMotion(false);
            }}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewerMode === 'PIN_POINTS' || doctorExamDirective === 'STAND_NEUTRAL'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Switch to 3D Point & Line Selection on anatomical mesh"
          >
            <Target className="w-3.5 h-3.5" />
            <span>📍 1. Pin Pain Points / Draw Lines</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewerMode('DIRECTIVES');
              if (doctorExamDirective === 'STAND_NEUTRAL') {
                handleSelectDirective('MOVE_FORWARD');
              }
            }}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewerMode === 'DIRECTIVES' && doctorExamDirective !== 'STAND_NEUTRAL'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Switch to 7 Dynamic Movement Directives & Patient Video Replay"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>🎬 2. Physical Directives</span>
          </button>
        </div>

        {/* Anatomical Status Badge */}
        {selectedPoints && selectedPoints.length > 1 ? (
          <div className="flex items-center gap-2 bg-slate-900/95 border border-amber-500/80 px-3 py-1.5 rounded-xl shadow-xl backdrop-blur-md pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-white">
              {painPathAnalysis?.pattern_title_en || (selectionMode === 'LINE' ? 'Radiation Line' : 'Multi-Point Areas')}
            </span>
            <span className="text-[10px] text-amber-400 font-mono bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
              {selectedPoints.length} Points
            </span>
            {onUndoPoint && selectedPoints && selectedPoints.length > 1 && (
              <button
                type="button"
                onClick={onUndoPoint}
                className="p-0.5 text-slate-400 hover:text-amber-400 rounded transition-colors ml-1 cursor-pointer"
                title="Undo Last Marked Point"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleClearPin}
              className="p-0.5 text-slate-400 hover:text-red-400 rounded transition-colors ml-1 cursor-pointer"
              title="Clear Points"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : activePoint ? (
          <div className="flex items-center gap-2 bg-slate-900/95 border border-cyan-500/80 px-3 py-1.5 rounded-xl shadow-xl backdrop-blur-md pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-bold text-white">
              {activeAnalysis?.display_name || 'Selected Point'}
            </span>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
              [{activePoint.x.toFixed(2)}, {activePoint.y.toFixed(2)}, {activePoint.z.toFixed(2)}]
            </span>
            {isAnalyzing ? (
              <span className="text-[10px] text-amber-300 font-mono animate-pulse border-l border-slate-700 pl-2">
                Analyzing...
              </span>
            ) : (
              <button
                type="button"
                onClick={handleClearPin}
                className="p-0.5 text-slate-400 hover:text-red-400 rounded transition-colors ml-1 cursor-pointer"
                title="Clear Pin"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md pointer-events-auto">
            <Stethoscope className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white">
              {patientCalibration ? 'Patient Mesh Calibrated' : 'Canonical 3D Mesh'}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
              {doctorExamDirective === 'STAND_NEUTRAL' ? 'Interactive 3D Surface' : activeDirectiveConfig.shortBadge}
            </span>
          </div>
        )}

        {/* Radiation Line / Point Toggle */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 border border-slate-700/60 p-1 rounded-xl shadow-lg backdrop-blur-md pointer-events-auto">
          <button
            type="button"
            onClick={() => onChangeSelectionMode && onChangeSelectionMode('POINT')}
            title="Single Anatomical Focal Point"
            className={`text-xs px-2.5 py-1 rounded-lg transition-all font-bold flex items-center gap-1.5 cursor-pointer ${
              selectionMode === 'POINT'
                ? 'bg-cyan-600 text-white shadow-md border border-cyan-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-cyan-300" />
            <span>Focal Point</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeSelectionMode && onChangeSelectionMode('LINE')}
            title="Continuous Pain Radiation Trajectory / Nerve Line (e.g. Sciatica, Spine)"
            className={`text-xs px-2.5 py-1 rounded-lg transition-all font-bold flex items-center gap-1.5 cursor-pointer ${
              selectionMode === 'LINE'
                ? 'bg-amber-600 text-white shadow-md border border-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Radiation Line</span>
          </button>
        </div>

        {/* Start AI Examination Action Button in Top Bar (Unobtrusive & Never Blocks Body) */}
        {(activePoint || (selectedPoints && selectedPoints.length > 0)) && onStartPointExam && (
          <button
            type="button"
            onClick={() => {
              if (activePoint && activeAnalysis) {
                onStartPointExam(activePoint, activeAnalysis);
              } else if (selectedPoints && selectedPoints.length > 0) {
                const firstPt = selectedPoints[0];
                const fallbackAnalysis = activeAnalysis || ({
                  region_id: selectedRegion || 'LUMBAR_SPINE',
                  side: affectedSide,
                  display_name: 'Selected Tissue',
                } as any);
                onStartPointExam(firstPt, fallbackAnalysis);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg border border-emerald-400/60 transition-all cursor-pointer pointer-events-auto transform hover:scale-[1.03] animate-pulse"
            title="Start AI Clinical Examination for Pinned Points & Trajectory"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>🩺 Start Examination ({selectedPoints.length > 0 ? `${selectedPoints.length} Points` : '1 Point'}) →</span>
          </button>
        )}

        {/* Camera Views & Zoom Toolbar */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/60 p-1 rounded-xl shadow-lg backdrop-blur-md pointer-events-auto">
          <button
            onClick={() => setView(0, 0.0, 3.2)}
            title="Frontal (Coronal) View"
            className="text-xs px-2 py-1 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Front
          </button>
          <button
            onClick={() => setView(-3.2, 0.0, 0)}
            title="Right Profile (Lateral)"
            className="text-xs px-2 py-1 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
          >
            Right
          </button>
          <button
            onClick={() => setView(3.2, 0.0, 0)}
            title="Left Profile (Lateral)"
            className="text-xs px-2 py-1 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
          >
            Left
          </button>
          <button
            onClick={() => focusOnSelectedRegion()}
            title={`Focus on ${regionDisplayName || 'Body'}`}
            className="text-xs px-2 py-1 text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Focus</span>
          </button>
          <button
            onClick={setFullBodyView}
            title="Reset to Full Body View"
            className="text-xs px-2.5 py-1 text-white bg-cyan-900/80 hover:bg-cyan-800 border border-cyan-500/70 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm font-semibold"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-300" />
            <span>Full</span>
          </button>
          <button
            onClick={() => handleZoom(-0.4)}
            title="Zoom In"
            className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(0.4)}
            title="Zoom Out"
            className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div className="relative flex-1 w-full min-h-0">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0.0, 3.2]} fov={40} />
          <ambientLight intensity={0.85} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} />
          <directionalLight position={[-5, 5, -5]} intensity={0.6} />
          <pointLight position={[0, 0, 2]} intensity={0.8} color="#06b6d4" />

          {/* Holographic Pedestal Grid at patient feet floor level */}
          <Grid
            position={[0, -0.98, 0]}
            args={[10, 10]}
            cellSize={0.4}
            cellThickness={0.6}
            cellColor="#0e7490"
            sectionSize={1.6}
            sectionThickness={1.2}
            sectionColor="#06b6d4"
            fadeDistance={8}
            fadeStrength={1.5}
          />

          {/* --- 3D MEDICAL EXAMINATION BED (Only rendered during Bed SLR Test) --- */}
          <MedicalExaminationBed visible={doctorExamDirective === 'BED_SLR'} />

          {/* --- VOLUMETRIC ARTICULATED PATIENT MESH (Rendered whenever motion or doctor test is active) --- */}
          {activeFrameData && (viewerMode === 'DIRECTIVES' || doctorExamDirective !== 'STAND_NEUTRAL') && (
            <KinematicMotionSkeleton
              activeFrameData={activeFrameData}
              selectedRegion={selectedRegion}
              affectedSide={affectedSide}
              doctorExamDirective={doctorExamDirective}
              bodyProportions={patientCalibration?.body_proportions}
            />
          )}

          {/* --- STATIC MESH FOR POINT RAYCAST SELECTION (Rendered when in PIN_POINTS mode or standing neutral) --- */}
          {(viewerMode === 'PIN_POINTS' || doctorExamDirective === 'STAND_NEUTRAL' || !isPlayingMotion) && (
            <React.Suspense fallback={null}>
              {patientCalibration ? (
                <PatientSpecificMesh
                  meshUrl={patientCalibration.calibrated_mesh_url}
                  keyJoints={patientCalibration.key_joint_positions}
                  bodyProportions={patientCalibration.body_proportions}
                  selectedRegion={selectedRegion}
                  onSelectRegion={onSelectRegion}
                  affectedSide={affectedSide}
                  measurements={measurements}
                  findings={findings}
                  isExamActive={isExamActive}
                  isMotionActive={false}
                  selectedPoint={activePoint}
                  selectedPoints={selectedPoints}
                  selectionMode={selectionMode}
                  onSelectPoint={handlePointSelect}
                />
              ) : (
                <DenseHumanMesh
                  selectedRegion={selectedRegion}
                  onSelectRegion={onSelectRegion}
                  affectedSide={affectedSide}
                  measurements={measurements}
                  findings={findings}
                  isExamActive={isExamActive}
                  isMotionActive={false}
                  selectedPoint={activePoint}
                  selectedPoints={selectedPoints}
                  selectionMode={selectionMode}
                  onSelectPoint={handlePointSelect}
                />
              )}
            </React.Suspense>
          )}

          <OrbitControls
            ref={controlsRef}
            target={[0, -0.05, 0]}
            minDistance={0.5}
            maxDistance={7.5}
            zoomSpeed={0.75}
            enableDamping={true}
            dampingFactor={0.06}
            enablePan={true}
            maxPolarAngle={Math.PI / 2 + 0.15}
          />
        </Canvas>
      </div>

      {/* ========================================================================= */}
      {/* --- DOCTOR PHYSICAL EXAMINATION MODE CONTROLS & DIAGNOSTIC FINDINGS HUD --- */}
      {/* ========================================================================= */}

      {/* Floating Active Diagnostic Finding & Verbatim Doctor Instruction Banner */}
      {doctorExamDirective !== 'STAND_NEUTRAL' && showDirectiveBanner && (
        <div className="absolute top-14 left-3 right-3 sm:right-auto sm:max-w-xl z-20 pointer-events-auto">
          <div className="bg-slate-950/95 border-2 border-amber-500/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header: Directive Title + Close */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/40 text-sm">
                  🩺
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                      {activeDirectiveConfig.shortBadge}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Target: {activeDirectiveConfig.targetJointOrRegion}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white mt-0.5">
                    {activeDirectiveConfig.titleEn}
                  </h3>
                  <div className="text-[11px] text-amber-200/90 font-hindi">
                    {activeDirectiveConfig.titleHi}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDirectiveBanner(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
                title="Hide Banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Doctor Verbatim Instruction to Patient */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1">
                  🗣️ Verbatim Doctor Instruction to Patient (मरीज को निर्देश):
                </span>
                <button
                  type="button"
                  onClick={handleSpeakDirective}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 transition-all ${
                    isSpeakingInstruction
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 border border-cyan-700'
                  }`}
                  title="Speak instruction to patient in Indian Hindi voice"
                >
                  {isSpeakingInstruction ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  <span>{isSpeakingInstruction ? 'Speaking...' : 'Speak Hindi (बोलें)'}</span>
                </button>
              </div>
              <p className="text-xs text-white font-medium italic leading-relaxed">
                "{activeDirectiveConfig.patientInstructionEn}"
              </p>
              <p className="text-[11px] text-cyan-200 font-hindi leading-snug">
                "{activeDirectiveConfig.patientInstructionHi}"
              </p>
            </div>

            {/* AI Model Exact Clinical Issue Found */}
            <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/80 border border-red-500/60 rounded-xl p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-red-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  🎯 AI Model Exact Issue Found:
                </span>
                <span className="text-[9px] bg-red-900/80 text-red-200 px-1.5 py-0.2 rounded font-mono font-bold border border-red-700">
                  {activeDirectiveConfig.detectedIssueSeverity}
                </span>
              </div>
              <div className="text-xs font-extrabold text-white leading-snug">
                {activeDirectiveConfig.detectedIssueTitle}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {activeDirectiveConfig.detectedIssueDetail}
              </p>
            </div>

            {/* Action: Apply Finding to Exam */}
            {onApplyClinicalFinding && (
              <button
                type="button"
                onClick={handleApplyFinding}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Apply Clinical Finding to Examination (रोग विवरण दर्ज करें)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- DOCTOR PHYSICAL EXAMINATION MODE TOOLBAR DOCK --- */}
      <div className="absolute bottom-16 left-3 right-3 z-10 pointer-events-auto">
        <div className="bg-slate-900/95 border border-cyan-500/60 rounded-2xl p-2 backdrop-blur-md shadow-2xl flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 pl-1.5 pr-2 border-r border-slate-800">
            <span className="text-sm">🩺</span>
            <div className="hidden md:block">
              <div className="text-[10px] font-mono font-bold text-cyan-300 uppercase leading-none">
                Doctor Exam Directives
              </div>
              <div className="text-[9px] text-slate-400 font-hindi leading-none mt-0.5">
                शारीरिक परीक्षण मोड
              </div>
            </div>
          </div>

          {/* Directive Mode Buttons */}
          <div className="flex flex-1 items-center gap-1 overflow-x-auto py-0.5">
            {/* 0. Pin Points & Radiation Lines on Body */}
            <button
              type="button"
              onClick={() => {
                setViewerMode('PIN_POINTS');
                handleSelectDirective('STAND_NEUTRAL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                viewerMode === 'PIN_POINTS' || doctorExamDirective === 'STAND_NEUTRAL'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-lg ring-2 ring-cyan-300'
                  : 'bg-slate-800/90 text-cyan-300 hover:bg-slate-800 border border-cyan-500/40'
              }`}
              title="Pin Pain Points & Draw Radiation Lines on Interactive 3D Mesh"
            >
              <Target className="w-3.5 h-3.5" />
              <span>📍 Pin Points & Lines (A-Pose)</span>
            </button>

            {/* Replicate Uploaded Patient Video */}
            {videoMeasurementFrames.length > 0 && (
              <button
                type="button"
                onClick={() => handleSelectDirective('UPLOADED_VIDEO')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  doctorExamDirective === 'UPLOADED_VIDEO'
                    ? 'bg-rose-500 text-white shadow-lg font-black ring-2 ring-rose-400 animate-pulse'
                    : 'bg-slate-800/90 text-rose-300 hover:bg-slate-800 border border-rose-500/40'
                }`}
                title="Replicate Patient Video in 3D (Moving Forward, Stopping & Leg Articulation)"
              >
                <Video className="w-3.5 h-3.5" />
                <span>🎥 Replicate Uploaded Video ({videoMeasurementFrames.length} frames)</span>
              </button>
            )}

            {/* 1. Lay on Bed & Lift Leg (SLR Test) */}
            <button
              type="button"
              onClick={() => handleSelectDirective('BED_SLR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                doctorExamDirective === 'BED_SLR'
                  ? 'bg-amber-500 text-slate-950 shadow-lg font-black'
                  : 'bg-slate-800/90 text-amber-300 hover:bg-slate-800 border border-amber-500/40'
              }`}
              title="Doctor Treatment: Lay on Bed and Lift Leg (Straight Leg Raise / Sciatica Test)"
            >
              <BedDouble className="w-3.5 h-3.5" />
              <span>1. Lay on Bed & Lift Leg (SLR)</span>
            </button>

            {/* 2. Move Forward & Stop (Gait Walk) */}
            <button
              type="button"
              onClick={() => handleSelectDirective('MOVE_FORWARD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                doctorExamDirective === 'MOVE_FORWARD'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg font-black'
                  : 'bg-slate-800/90 text-emerald-300 hover:bg-slate-800 border border-emerald-500/40'
              }`}
              title="Doctor Treatment: Move Forward and Stop (Gait Walk & Weight-Bearing)"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>2. Move Forward & Stop</span>
            </button>

            {/* 3. Spread Legs (Stance / Abduction) */}
            <button
              type="button"
              onClick={() => handleSelectDirective('SPREAD_LEGS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                doctorExamDirective === 'SPREAD_LEGS'
                  ? 'bg-indigo-500 text-white shadow-lg font-black'
                  : 'bg-slate-800/90 text-indigo-300 hover:bg-slate-800 border border-indigo-500/40'
              }`}
              title="Doctor Treatment: Spread Legs (Wide Stance & Knee Valgus Alignment)"
            >
              <Move className="w-3.5 h-3.5" />
              <span>3. Spread Legs</span>
            </button>

            {/* 4. Leg Up & Down (AROM) */}
            <button
              type="button"
              onClick={() => handleSelectDirective('LEG_UP_DOWN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                doctorExamDirective === 'LEG_UP_DOWN'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg font-black'
                  : 'bg-slate-800/90 text-cyan-300 hover:bg-slate-800 border border-cyan-500/40'
              }`}
              title="Doctor Treatment: Leg Up and Down (Active Flexion & Extension Cycle)"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>4. Leg Up & Down</span>
            </button>

            {/* 5. Turn Neck Around (Cervical Rotation) */}
            <button
              type="button"
              onClick={() => handleSelectDirective('NECK_ROTATION')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                doctorExamDirective === 'NECK_ROTATION'
                  ? 'bg-teal-500 text-slate-950 shadow-lg font-black ring-2 ring-teal-400'
                  : 'bg-slate-800/90 text-teal-300 hover:bg-slate-800 border border-teal-500/40'
              }`}
              title="Doctor Treatment: Turn Neck Around (Cervical Axial Rotation & Facet Joint Screen)"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>5. Turn Neck Around</span>
            </button>

            {/* 6. Raise Arms Overhead (Shoulder Abduction) */}
            <button
              type="button"
              onClick={() => handleSelectDirective('SHOULDER_ABDUCTION')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                doctorExamDirective === 'SHOULDER_ABDUCTION'
                  ? 'bg-blue-500 text-white shadow-lg font-black ring-2 ring-blue-400'
                  : 'bg-slate-800/90 text-blue-300 hover:bg-slate-800 border border-blue-500/40'
              }`}
              title="Doctor Treatment: Raise Arms Overhead (Shoulder Abduction & Rotator Cuff Screen)"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>6. Raise Arms Overhead</span>
            </button>

            {/* 7. Bend Forward Spine (Lumbar Flexion) */}
            <button
              type="button"
              onClick={() => handleSelectDirective('LUMBAR_FLEXION')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                doctorExamDirective === 'LUMBAR_FLEXION'
                  ? 'bg-orange-500 text-slate-950 shadow-lg font-black ring-2 ring-orange-400'
                  : 'bg-slate-800/90 text-orange-300 hover:bg-slate-800 border border-orange-500/40'
              }`}
              title="Doctor Treatment: Bend Forward and Touch Toes (Lumbar Spine Range of Motion)"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>7. Bend Forward Spine</span>
            </button>

            {/* 8. Reset to Standing A-Pose */}
            <button
              type="button"
              onClick={() => handleSelectDirective('STAND_NEUTRAL')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                doctorExamDirective === 'STAND_NEUTRAL'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Reset to Standing A-Pose for 3D Surface Pinning"
            >
              <span>⏹ Standing A-Pose</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- MOTION SCRUBBER & PLAYBACK CONTROLLER --- */}
      {activeSequenceFrames.length > 0 && (
        <div
          className="absolute z-20 pointer-events-auto"
          style={{ bottom: '0.6rem', left: '1rem', right: '1rem' }}
        >
          <div className="bg-slate-900/95 border border-cyan-500/60 rounded-xl p-2 backdrop-blur-md shadow-2xl flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlayingMotion(!isPlayingMotion)}
              className="p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow transition-colors flex items-center justify-center cursor-pointer"
              title={isPlayingMotion ? 'Pause Motion' : 'Play Kinematic Motion'}
            >
              {isPlayingMotion ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>

            <button
              type="button"
              onClick={() => setCurrentFrameIdx(0)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Restart Motion"
            >
              <Repeat className="w-3 h-3" />
            </button>

            <div className="flex-1 flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {doctorExamDirective !== 'STAND_NEUTRAL'
                    ? activeDirectiveConfig.titleEn
                    : 'Recorded Video Kinematic Replay'}
                </span>
                <span className="text-cyan-300 font-mono font-bold">
                  {doctorExamDirective === 'BED_SLR' ? 'SLR Angle' : 'Angle'}:{' '}
                  {activeFrameData?.flexion_angle_deg?.toFixed(1)}° • Time:{' '}
                  {activeFrameData?.time_sec?.toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={activeSequenceFrames.length - 1}
                value={currentFrameIdx}
                onChange={(e) => {
                  setIsPlayingMotion(false);
                  setCurrentFrameIdx(Number(e.target.value));
                }}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Patient Calibrated Photo Preview Modal */}
      {showPhotoModal && patientCalibration && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-xl w-full p-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Calibrated Patient Photo & 3D Skeletal Landmark Alignment
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-black rounded-xl overflow-hidden mb-3 aspect-video flex items-center justify-center border border-slate-800">
              {patientCalibration.annotated_image_url ? (
                <img
                  src={`http://localhost:8000${patientCalibration.annotated_image_url}`}
                  alt="Calibrated Patient Skeleton"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-slate-400">Photo calibration active</div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Est. Height</div>
                <div className="text-sm font-bold text-cyan-300 font-mono">
                  {patientCalibration.body_proportions.estimated_height_cm} cm
                </div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Shoulder Breadth</div>
                <div className="text-sm font-bold text-cyan-300 font-mono">
                  {(patientCalibration.body_proportions.shoulder_width_m * 100).toFixed(1)} cm
                </div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Pelvis Width</div>
                <div className="text-sm font-bold text-cyan-300 font-mono">
                  {(patientCalibration.body_proportions.hip_width_m * 100).toFixed(1)} cm
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyMeshViewer;
