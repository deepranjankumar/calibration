import React, { useState, useEffect } from 'react';
import { BodyMeshViewer } from './components/ThreeBodyMesh/BodyMeshViewer';
import { AIWorkflowPanel } from './components/AIWorkflow/AIWorkflowPanel';
import { BiomechanicalPanel } from './components/BiomechanicalAnalytics/BiomechanicalPanel';
import { ClinicalReportModal } from './components/ClinicalReport/ClinicalReportModal';
import type { Examination, PatientCalibration, Point3D, PointAnalysis, PainPathAnalysis } from './types/examination';
import {
  createExamination,
  getExamination,
  submitStepJson,
  submitStepFormData,
  analyzePainPath,
} from './services/api';
import {
  Stethoscope,
  PlusCircle,
  FileText,
  Activity,
  UserCheck,
} from 'lucide-react';

export const App: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [affectedSide, setAffectedSide] = useState<'RIGHT' | 'LEFT'>('RIGHT');
  const [examination, setExamination] = useState<Examination | null>(null);
  const [patientCalibration, setPatientCalibration] = useState<PatientCalibration | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<Point3D | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<Point3D[]>([]);
  const [selectionMode, setSelectionMode] = useState<'POINT' | 'LINE'>('LINE');
  const [painPathAnalysis, setPainPathAnalysis] = useState<PainPathAnalysis | null>(null);
  const [pointAnalysis, setPointAnalysis] = useState<PointAnalysis | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Restore existing active examination on page reload or reconnect
  useEffect(() => {
    const savedExamId = localStorage.getItem('active_examination_id');
    if (savedExamId && !examination) {
      getExamination(savedExamId)
        .then((exam) => {
          if (exam) {
            setExamination(exam);
            if (exam.selected_region) setSelectedRegion(exam.selected_region);
            if (exam.affected_side) setAffectedSide(exam.affected_side as 'RIGHT' | 'LEFT');
            if (exam.patient_calibration) setPatientCalibration(exam.patient_calibration);
            if (exam.selected_point) setSelectedPoint(exam.selected_point);
            if (exam.selected_points && exam.selected_points.length > 0) setSelectedPoints(exam.selected_points);
            if (exam.point_analysis) setPointAnalysis(exam.point_analysis);
            if (exam.pain_path_analysis) setPainPathAnalysis(exam.pain_path_analysis);
          }
        })
        .catch((err) => {
          console.warn('Could not restore previous examination session:', err);
        });
    }
  }, []);

  // Sync active exam ID to localStorage
  useEffect(() => {
    if (examination?.id) {
      localStorage.setItem('active_examination_id', examination.id);
    }
  }, [examination]);

  const handleAddPointToPath = async (point: Point3D) => {
    const updatedPoints = [...selectedPoints, point];
    setSelectedPoints(updatedPoints);
    setSelectedPoint(point);

    try {
      const pathReq = updatedPoints.map((p) => ({
        point: { x: p.x, y: p.y, z: p.z },
        normal: p.normal,
      }));
      const analysis = await analyzePainPath(
        pathReq,
        selectionMode,
        affectedSide,
        patientCalibration
      );
      setPainPathAnalysis(analysis);
      if (analysis.primary_region) {
        setSelectedRegion(analysis.primary_region);
      }
      if (analysis.affected_side && analysis.affected_side !== 'BILATERAL') {
        setAffectedSide(analysis.affected_side as 'RIGHT' | 'LEFT');
      }
      if (analysis.points_detail && analysis.points_detail.length > 0) {
        setPointAnalysis(analysis.points_detail[0]);
      }
    } catch (err) {
      console.error('Failed to analyze pain path:', err);
    }
  };

  const handleUndoPoint = async () => {
    if (selectedPoints.length === 0) return;
    const updated = selectedPoints.slice(0, -1);
    setSelectedPoints(updated);
    if (updated.length > 0) {
      const last = updated[updated.length - 1];
      setSelectedPoint(last);
      try {
        const pathReq = updated.map((p) => ({
          point: { x: p.x, y: p.y, z: p.z },
          normal: p.normal,
        }));
        const analysis = await analyzePainPath(
          pathReq,
          selectionMode,
          affectedSide,
          patientCalibration
        );
        setPainPathAnalysis(analysis);
      } catch (err) {
        console.error('Failed to update pain path on undo:', err);
      }
    } else {
      setSelectedPoint(null);
      setPainPathAnalysis(null);
      setPointAnalysis(null);
    }
  };

  const handleClearPoints = () => {
    setSelectedPoints([]);
    setSelectedPoint(null);
    setPainPathAnalysis(null);
    setPointAnalysis(null);
  };

  const handleChangeSelectionMode = async (mode: 'POINT' | 'LINE') => {
    setSelectionMode(mode);
    if (selectedPoints.length > 0) {
      try {
        const pathReq = selectedPoints.map((p) => ({
          point: { x: p.x, y: p.y, z: p.z },
          normal: p.normal,
        }));
        const analysis = await analyzePainPath(
          pathReq,
          mode,
          affectedSide,
          patientCalibration
        );
        setPainPathAnalysis(analysis);
      } catch (err) {
        console.error('Failed to re-analyze path on mode change:', err);
      }
    }
  };

  const handleStartExam = async (data: {
    patient_id: string;
    patient_name: string;
    patient_age: number;
    patient_gender: string;
    selected_region: string;
    affected_side: 'RIGHT' | 'LEFT';
    selected_point?: Point3D | null;
    selected_points?: Point3D[] | null;
    point_analysis?: PointAnalysis | null;
    pain_path_analysis?: PainPathAnalysis | null;
  }) => {
    setIsSubmitting(true);
    try {
      const pointToUse = data.selected_point !== undefined ? data.selected_point : selectedPoint;
      const pointsToUse = data.selected_points !== undefined && data.selected_points !== null ? data.selected_points : selectedPoints;
      const analysisToUse = data.point_analysis !== undefined ? data.point_analysis : pointAnalysis;
      const pathAnalysisToUse = data.pain_path_analysis !== undefined ? data.pain_path_analysis : painPathAnalysis;

      const newExam = await createExamination({
        patient_id: data.patient_id,
        patient_name: data.patient_name,
        patient_age: data.patient_age,
        patient_gender: data.patient_gender,
        selected_region: data.selected_region,
        affected_side: data.affected_side,
        patient_calibration: patientCalibration,
        selected_point: pointToUse,
        selected_points: pointsToUse && pointsToUse.length > 0 ? pointsToUse : undefined,
        point_analysis: analysisToUse,
        pain_path_analysis: pathAnalysisToUse || undefined,
      });
      setExamination(newExam);
      setSelectedRegion(data.selected_region);
      setAffectedSide(data.affected_side);
      if (newExam.selected_point) setSelectedPoint(newExam.selected_point);
      if (newExam.selected_points) setSelectedPoints(newExam.selected_points);
      if (newExam.point_analysis) setPointAnalysis(newExam.point_analysis);
      if (newExam.pain_path_analysis) setPainPathAnalysis(newExam.pain_path_analysis);
    } catch (err: any) {
      alert(`Error starting examination: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectRegion = (region: string, side: 'RIGHT' | 'LEFT') => {
    setSelectedRegion(region);
    setAffectedSide(side);
  };

  const handleSubmitStep = async (payload: {
    response_boolean?: boolean;
    response_choice?: string;
    response_text?: string;
    response_numeric?: number;
    use_synthetic_kinematic_demo?: boolean;
    videoFile?: File | null;
  }) => {
    if (!examination || !examination.current_step) return;

    setIsSubmitting(true);
    try {
      let updatedExam: Examination;

      if (payload.videoFile) {
        // Send multipart form data with uploaded or webcam recorded video
        const formData = new FormData();
        formData.append('video', payload.videoFile);
        if (payload.response_boolean !== undefined) {
          formData.append('response_boolean', String(payload.response_boolean));
        }
        if (payload.response_choice) {
          formData.append('response_choice', payload.response_choice);
        }
        if (payload.response_numeric !== undefined) {
          formData.append('response_numeric', String(payload.response_numeric));
        }
        if (payload.response_text) {
          formData.append('response_text', payload.response_text);
        }
        formData.append('use_synthetic_kinematic_demo', String(payload.use_synthetic_kinematic_demo || false));

        updatedExam = await submitStepFormData(
          examination.id,
          examination.current_step.step_id,
          formData
        );
      } else {
        // Send JSON submission
        updatedExam = await submitStepJson(
          examination.id,
          examination.current_step.step_id,
          {
            response_boolean: payload.response_boolean,
            response_choice: payload.response_choice,
            response_text: payload.response_text,
            response_numeric: payload.response_numeric,
            use_synthetic_kinematic_demo: payload.use_synthetic_kinematic_demo,
          }
        );
      }

      setExamination(updatedExam);
      // Automatically open structured clinical report & prescription upon protocol completion
      if (updatedExam.status === 'COMPLETED' || updatedExam.urgent_referral) {
        setIsReportOpen(true);
      }
    } catch (err: any) {
      alert(`Error submitting step response: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSession = () => {
    if (confirm('Start a new physical examination session? Current progress will be archived.')) {
      localStorage.removeItem('active_examination_id');
      setExamination(null);
      setSelectedRegion('');
      setAffectedSide('RIGHT');
      // Preserve patient's 3D mesh calibration so operator can immediately select new areas without retaking photo
      setSelectedPoint(null);
      setSelectedPoints([]);
      setPainPathAnalysis(null);
      setPointAnalysis(null);
    }
  };

  const effectiveCalibration = patientCalibration || examination?.patient_calibration || null;

  return (
    <div className="exam-app">
      {/* --- TOP GLOBAL NAVIGATION BAR --- */}
      <header className="exam-header">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl shadow-md">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide uppercase text-white">
                Physical Examination System
              </h1>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full font-mono font-bold">
                AI CLINICAL PROTOCOL
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              MediaPipe Kinematics • OpenCV Biomechanics • Three.js Dense Anatomical Mesh
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-3">
          {effectiveCalibration && (
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-600/50 px-2.5 py-1 rounded-xl text-[11px] text-emerald-300">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Patient Mesh Calibrated ({effectiveCalibration.body_proportions.estimated_height_cm}cm)</span>
            </div>
          )}

          {examination ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-cyan-500/40 px-3 py-1 rounded-xl text-xs">
              <span className="text-slate-400">Patient:</span>
              <span className="font-bold text-white font-mono">{examination.patient_id}</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400 font-bold">
                {examination.affected_side} {examination.selected_region.replace('_', ' ')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3 py-1 rounded-xl text-xs text-slate-400">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{effectiveCalibration ? 'Mesh Calibrated: Select Pain Point or Line' : 'Step 1: Patient Photo Intake'}</span>
            </div>
          )}

          {examination && (
            <button
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Structured Clinical Report
            </button>
          )}

          <button
            onClick={handleResetSession}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Session
          </button>
        </div>
      </header>

      {/* --- MAIN SPLIT WORKSPACE (GUARANTEED FLEXBOX SIDE-BY-SIDE) --- */}
      <main className="exam-workspace">
        {/* LEFT COLUMN: AI Controller (Fixed ~460px width) */}
        <div className="exam-left-panel">
          <AIWorkflowPanel
            examination={examination}
            patientCalibration={effectiveCalibration}
            onCalibratePatient={(calib) => {
              setPatientCalibration(calib);
              if (calib.detected_body_part) {
                setSelectedRegion(calib.detected_body_part.region_id);
                setAffectedSide(calib.detected_body_part.side === 'BILATERAL' ? 'RIGHT' : calib.detected_body_part.side);
              }
            }}
            onResetCalibration={() => setPatientCalibration(null)}
            onStartExam={handleStartExam}
            onSubmitStep={handleSubmitStep}
            onOpenReport={() => setIsReportOpen(true)}
            isSubmitting={isSubmitting}
            selectedRegion={selectedRegion}
            affectedSide={affectedSide}
            onSelectRegion={handleSelectRegion}
            selectedPoint={selectedPoint || examination?.selected_point}
            selectedPoints={selectedPoints}
            selectionMode={selectionMode}
            onChangeSelectionMode={handleChangeSelectionMode}
            pointAnalysis={pointAnalysis || examination?.point_analysis}
            painPathAnalysis={painPathAnalysis || examination?.pain_path_analysis}
            onClearPoint={() => {
              setSelectedPoint(null);
              setPointAnalysis(null);
            }}
            onClearPoints={handleClearPoints}
          />
        </div>

        {/* RIGHT COLUMN: 3D Body Mesh & Biomechanical Telemetry (Remaining 65-70% width) */}
        <div className="exam-right-panel">
          {/* Top 3D Dense Human Mesh Viewer */}
          <div className="mesh-canvas-wrapper">
            <BodyMeshViewer
              selectedRegion={examination ? examination.selected_region : selectedRegion}
              onSelectRegion={handleSelectRegion}
              affectedSide={examination ? examination.affected_side : affectedSide}
              measurements={examination?.measurements || []}
              findings={examination?.findings || []}
              isExamActive={Boolean(examination && examination.status === 'ACTIVE')}
              patientCalibration={effectiveCalibration}
              selectedPoint={selectedPoint || examination?.selected_point}
              selectedPoints={selectedPoints.length > 0 ? selectedPoints : (examination?.selected_points || [])}
              selectionMode={selectionMode}
              onChangeSelectionMode={handleChangeSelectionMode}
              pointAnalysis={pointAnalysis || examination?.point_analysis}
              painPathAnalysis={painPathAnalysis || examination?.pain_path_analysis}
              onSelectPoint={(pt, analysis) => {
                setSelectedPoint(pt);
                if (analysis) {
                  setPointAnalysis(analysis);
                  setSelectedRegion(analysis.region_id);
                  setAffectedSide(analysis.side === 'BILATERAL' ? 'RIGHT' : analysis.side);
                }
              }}
              onAddPointToPath={handleAddPointToPath}
              onUndoPoint={handleUndoPoint}
              onClearPoints={handleClearPoints}
              onStartPointExam={async (pt, analysis) => {
                setSelectedPoint(pt);
                setPointAnalysis(analysis);
                await handleStartExam({
                  patient_id: 'PT-4821',
                  patient_name: 'John Doe',
                  patient_age: 48,
                  patient_gender: 'Male',
                  selected_region: analysis.region_id,
                  affected_side: analysis.side === 'BILATERAL' ? 'RIGHT' : analysis.side,
                  selected_point: pt,
                  point_analysis: analysis,
                });
              }}
              onClearPoint={() => {
                setSelectedPoint(null);
                setPointAnalysis(null);
              }}
            />
          </div>

          {/* Bottom Biomechanical Analytics Panel */}
          <div className="telemetry-bar-wrapper">
            <BiomechanicalPanel
              measurements={examination?.measurements || []}
              findings={examination?.findings || []}
            />
          </div>
        </div>
      </main>

      {/* --- CLINICAL REPORT MODAL --- */}
      {examination && (
        <ClinicalReportModal
          examinationId={examination.id}
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
