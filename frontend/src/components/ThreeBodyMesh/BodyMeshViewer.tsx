import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { DenseHumanMesh } from './DenseHumanMesh';
import { PatientSpecificMesh } from './PatientSpecificMesh';
import type {
  BiomechanicalMeasurement,
  ClinicalFinding,
  PatientCalibration,
  Point3D,
  PointAnalysis,
} from '../../types/examination';
import { analyzeBodyPoint } from '../../services/api';
import {
  RotateCcw,
  Eye,
  ShieldAlert,
  Sparkles,
  Play,
  Pause,
  Repeat,
  Image as ImageIcon,
  UserCheck,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Target,
} from 'lucide-react';

interface BodyMeshViewerProps {
  selectedRegion: string;
  onSelectRegion?: (region: string, side: 'RIGHT' | 'LEFT') => void;
  affectedSide: 'RIGHT' | 'LEFT' | 'BILATERAL';
  measurements?: BiomechanicalMeasurement[];
  findings?: ClinicalFinding[];
  isExamActive: boolean;
  patientCalibration?: PatientCalibration | null;
  selectedPoint?: Point3D | null;
  pointAnalysis?: PointAnalysis | null;
  onSelectPoint?: (point: Point3D, analysis?: PointAnalysis) => void;
  onStartPointExam?: (point: Point3D, analysis: PointAnalysis) => void;
  onClearPoint?: () => void;
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
  patientCalibration,
  selectedPoint,
  pointAnalysis,
  onSelectPoint,
  onStartPointExam: _onStartPointExam,
  onClearPoint,
}) => {
  const controlsRef = useRef<OrbitControlsType>(null);

  // Point Selection & Decision State
  const [localPoint, setLocalPoint] = useState<Point3D | null>(null);
  const [localAnalysis, setLocalAnalysis] = useState<PointAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const activePoint = selectedPoint !== undefined ? selectedPoint : localPoint;
  const activeAnalysis = pointAnalysis !== undefined ? pointAnalysis : localAnalysis;

  const handlePointSelect = async (pt: Point3D) => {
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
    if (onClearPoint) {
      onClearPoint();
    }
    setFullBodyView();
  };

  // Motion replay state
  const [isPlayingMotion, setIsPlayingMotion] = useState(false);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Extract motion sequence frames from latest video measurement
  const motionFrames = useMemo(() => {
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

  // Motion playback timer
  useEffect(() => {
    if (!isPlayingMotion || motionFrames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrameIdx((prev) => (prev + 1) % motionFrames.length);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlayingMotion, motionFrames]);



  const activeFrameData = motionFrames.length > 0 ? motionFrames[currentFrameIdx] : null;

  // Zoom functions
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

  const focusOnSelectedRegion = () => {
    if (!controlsRef.current) return;
    if (activePoint) {
      setView(activePoint.x, activePoint.y, activePoint.z + 1.15, [activePoint.x, activePoint.y, activePoint.z]);
      return;
    }
    if (!selectedRegion) {
      setFullBodyView();
      return;
    }
    const isRight = affectedSide === 'RIGHT' || selectedRegion.includes('RIGHT');
    const xMult = isRight ? -1 : 1;

    let targetJoint: [number, number, number] = [xMult * 0.11, -0.345, 0.04];
    let camPos: [number, number, number] = [xMult * 0.11, -0.345, 1.15];

    const reg = selectedRegion.toUpperCase();
    if (reg.includes('SHOULDER')) {
      targetJoint = [xMult * 0.19, 0.64, 0.01];
      camPos = [xMult * 0.19, 0.64, 1.1];
    } else if (reg.includes('ELBOW')) {
      targetJoint = [xMult * 0.29, 0.38, -0.01];
      camPos = [xMult * 0.29, 0.38, 1.05];
    } else if (reg.includes('WRIST')) {
      targetJoint = [xMult * 0.40, 0.11, -0.02];
      camPos = [xMult * 0.40, 0.11, 0.95];
    } else if (reg.includes('HIP')) {
      targetJoint = [xMult * 0.095, 0.085, 0.02];
      camPos = [xMult * 0.095, 0.085, 1.15];
    } else if (reg.includes('ANKLE')) {
      targetJoint = [xMult * 0.095, -0.81, 0.01];
      camPos = [xMult * 0.095, -0.81, 1.05];
    } else if (reg.includes('SPINE') || reg.includes('LUMBAR')) {
      targetJoint = [0, 0.29, -0.02];
      camPos = [0, 0.29, 1.2];
    } else if (reg.includes('CERVICAL')) {
      targetJoint = [0, 0.69, 0.02];
      camPos = [0, 0.69, 1.1];
    }

    // If patient-specific calibration is active, use the patient's exact 3D joint coordinate
    if (patientCalibration?.key_joint_positions) {
      const calibPos = patientCalibration.key_joint_positions[selectedRegion]
        || patientCalibration.key_joint_positions[selectedRegion.toUpperCase()];
      if (calibPos) {
        targetJoint = calibPos;
        camPos = [calibPos[0], calibPos[1], calibPos[2] + 1.1];
      }
    }

    setView(camPos[0], camPos[1], camPos[2], targetJoint);
  };

  // Automatically frame and zoom onto the detected or selected body part mesh
  useEffect(() => {
    if (selectedRegion) {
      const timer = setTimeout(() => {
        focusOnSelectedRegion();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedRegion, patientCalibration?.calibrated_mesh_url]);

  const regionDisplayName = selectedRegion ? selectedRegion.replace(/_/g, ' ') : '';

  return (
    <div className="relative w-full flex-1 min-h-[420px] flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Header Controls & Camera Presets */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none gap-2">
        {/* Anatomical Status Badge */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">
            {selectedRegion ? regionDisplayName : 'Select Painful Location'}
          </span>
          <span className="text-[10px] text-cyan-400/90 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
            {selectedRegion ? `${affectedSide} SIDE` : 'IDLE'}
          </span>

          {patientCalibration && (
            <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-slate-700">
              {patientCalibration.detected_body_part ? (
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/70 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 shadow-sm">
                  <Target className="w-3 h-3 text-cyan-400" />
                  DETECTED: {patientCalibration.detected_body_part.display_name} ({patientCalibration.detected_body_part.posture})
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600/50 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-400" />
                  PATIENT CALIBRATED ({patientCalibration.body_proportions.estimated_height_cm}cm)
                </span>
              )}

              {patientCalibration.annotated_image_url && (
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(true)}
                  className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                  title="View Calibrated Patient Photo"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Camera Views & Zoom Toolbar */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/60 p-1 rounded-xl shadow-lg backdrop-blur-md pointer-events-auto">
          {/* Preset Angles */}
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
            onClick={() => setView(0, 0.0, -3.2)}
            title="Posterior View"
            className="text-xs px-2 py-1 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
          >
            Back
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* Framing & Zoom Actions */}
          <button
            onClick={focusOnSelectedRegion}
            title={`Focus on ${regionDisplayName}`}
            className="text-xs px-2 py-1 text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Focus</span>
          </button>
          <button
            onClick={setFullBodyView}
            title="Fit Full Body"
            className="text-xs px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Full Body</span>
          </button>

          <button
            onClick={() => handleZoom(0.4)}
            title="Zoom Out"
            className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(-0.4)}
            title="Zoom In"
            className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={setFullBodyView}
            title="Reset Camera"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
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

          {/* If patient photo calibration is active, render PatientSpecificMesh */}
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
                selectedPoint={activePoint}
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
                selectedPoint={activePoint}
                onSelectPoint={handlePointSelect}
              />
            )}
          </React.Suspense>

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

      {/* Floating Tactical Zoom & Framer HUD in Bottom-Right */}
      <div className="absolute right-4 bottom-20 z-20 flex flex-col gap-1 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-xl shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => handleZoom(-0.4)}
          title="Zoom In"
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(0.4)}
          title="Zoom Out"
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-full h-px bg-slate-800 my-0.5" />
        <button
          type="button"
          onClick={setFullBodyView}
          title="Fit Full Body"
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={focusOnSelectedRegion}
          title={`Focus on ${regionDisplayName}`}
          className="p-2 text-cyan-400 hover:text-white hover:bg-cyan-950/80 rounded-lg transition-colors cursor-pointer"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Sleek Top Status & Guidance Indicator (Unobtrusive) */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
        {activePoint ? (
          <div className="bg-slate-900/95 border border-cyan-500/80 text-cyan-200 text-xs px-3.5 py-1.5 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold text-white">
              {activeAnalysis?.display_name || 'Selected Point'}
            </span>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
              [{activePoint.x.toFixed(2)}, {activePoint.y.toFixed(2)}, {activePoint.z.toFixed(2)}]
            </span>
            {isAnalyzing ? (
              <span className="text-[10px] text-amber-300 font-mono animate-pulse border-l border-slate-700 pl-2">
                Analyzing Point Intelligence...
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2 hidden sm:inline">
                Decisions & Protocol loaded in Left AI Panel
              </span>
            )}
            <button
              type="button"
              onClick={handleClearPin}
              className="text-slate-400 hover:text-red-400 p-0.5 rounded transition-colors ml-1 cursor-pointer"
              title="Clear Point Selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : !isExamActive ? (
          <div className="bg-slate-900/90 border border-slate-700/80 text-slate-300 text-xs px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Click any point on the 3D body (muscles, ribs, spine, limbs) to analyze & plan treatment</span>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-cyan-500/50 text-cyan-300 text-[11px] font-mono px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">ANATOMICAL TARGET: {selectedRegion.replace(/_/g, ' ')}</span>
            <span className="text-slate-400">• Real-Time 3D Mesh Kinematics</span>
          </div>
        )}
      </div>

      {/* Motion Replay Player Bar (When Video Kinematics Available) */}
      {motionFrames.length > 0 && (
        <div className="absolute bottom-16 left-4 right-4 z-20">
          <div className="bg-slate-900/95 border border-cyan-500/60 rounded-xl p-2.5 backdrop-blur-md shadow-2xl flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlayingMotion(!isPlayingMotion)}
              className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow transition-colors flex items-center justify-center cursor-pointer"
              title={isPlayingMotion ? 'Pause Motion' : 'Play Kinematic Motion'}
            >
              {isPlayingMotion ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              type="button"
              onClick={() => setCurrentFrameIdx(0)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Restart Motion"
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Patient Kinematic Motion Replay
                </span>
                <span className="text-cyan-300 font-mono font-bold">
                  Angle: {activeFrameData?.flexion_angle_deg?.toFixed(1)}° • Time:{' '}
                  {activeFrameData?.time_sec?.toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={motionFrames.length - 1}
                value={currentFrameIdx}
                onChange={(e) => {
                  setIsPlayingMotion(false);
                  setCurrentFrameIdx(Number(e.target.value));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Regulatory & Biomechanical Disclaimer Footer */}
      <div className="absolute bottom-2 left-3 right-3 z-10 pointer-events-none">
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 backdrop-blur-md shadow-xl flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] leading-tight text-slate-300">
            <span className="font-semibold text-amber-400 uppercase tracking-wider inline mr-1.5">
              Patient-Calibrated Biomechanical Visualization:
            </span>
            <span>
              {patientCalibration
                ? `Anatomical wireframe reconstructed from patient photo (Height: ~${patientCalibration.body_proportions.estimated_height_cm}cm, Shoulder: ${patientCalibration.body_proportions.shoulder_width_m}m). Joint kinematics analyzed via MediaPipe 1.x Pose.`
                : 'Standardized anatomical wireframe. Joint angles and range-of-motion metrics are computed in real time from MediaPipe kinematic tracking.'}
            </span>
          </div>
        </div>
      </div>

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
