import React, { useState } from 'react';
import { BodyMeshViewer } from './components/ThreeBodyMesh/BodyMeshViewer';
import { AIWorkflowPanel } from './components/AIWorkflow/AIWorkflowPanel';
import { BiomechanicalPanel } from './components/BiomechanicalAnalytics/BiomechanicalPanel';
import { ClinicalReportModal } from './components/ClinicalReport/ClinicalReportModal';
import type { Examination } from './types/examination';
import {
  createExamination,
  submitStepJson,
  submitStepFormData,
} from './services/api';
import {
  Stethoscope,
  PlusCircle,
  FileText,
  Activity,
} from 'lucide-react';

export const App: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('RIGHT_KNEE');
  const [affectedSide, setAffectedSide] = useState<'RIGHT' | 'LEFT'>('RIGHT');
  const [examination, setExamination] = useState<Examination | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  const handleStartExam = async (data: {
    patient_id: string;
    patient_name: string;
    patient_age: number;
    patient_gender: string;
    selected_region: string;
    affected_side: 'RIGHT' | 'LEFT';
  }) => {
    setIsSubmitting(true);
    try {
      const newExam = await createExamination({
        patient_id: data.patient_id,
        patient_name: data.patient_name,
        patient_age: data.patient_age,
        patient_gender: data.patient_gender,
        selected_region: data.selected_region,
        affected_side: data.affected_side,
      });
      setExamination(newExam);
      setSelectedRegion(data.selected_region);
      setAffectedSide(data.affected_side);
    } catch (err: any) {
      alert(`Error starting examination: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Immediate start when operator selects a region on the 3D body mesh or quick tags
  const handleSelectRegionAndStart = async (region: string, side: 'RIGHT' | 'LEFT') => {
    setSelectedRegion(region);
    setAffectedSide(side);

    // If examination is not already active, immediately identify the anatomical region and start AI protocol
    if (!examination) {
      await handleStartExam({
        patient_id: 'PT-4821',
        patient_name: 'John Doe',
        patient_age: 48,
        patient_gender: 'Male',
        selected_region: region,
        affected_side: side,
      });
    }
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

      // Auto-open report if completed or urgent referral triggered
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
      setExamination(null);
      setSelectedRegion('RIGHT_KNEE');
      setAffectedSide('RIGHT');
    }
  };

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
              <span>Ready for Localization</span>
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
            onStartExam={handleStartExam}
            onSubmitStep={handleSubmitStep}
            onOpenReport={() => setIsReportOpen(true)}
            isSubmitting={isSubmitting}
            selectedRegion={selectedRegion}
            affectedSide={affectedSide}
            onSelectRegion={handleSelectRegionAndStart}
          />
        </div>

        {/* RIGHT COLUMN: 3D Body Mesh & Biomechanical Telemetry (Remaining 65-70% width) */}
        <div className="exam-right-panel">
          {/* Top 3D Dense Human Mesh Viewer */}
          <div className="mesh-canvas-wrapper">
            <BodyMeshViewer
              selectedRegion={examination ? examination.selected_region : selectedRegion}
              onSelectRegion={handleSelectRegionAndStart}
              affectedSide={examination ? examination.affected_side : affectedSide}
              measurements={examination?.measurements || []}
              findings={examination?.findings || []}
              isExamActive={Boolean(examination && examination.status === 'ACTIVE')}
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
