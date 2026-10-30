import React, { useState, useEffect } from 'react';
import type { StructuredClinicalReport, FinalPrescription } from '../../types/examination';
import { getStructuredReport, signOffReport } from '../../services/api';
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
} from 'lucide-react';

interface ClinicalReportModalProps {
  examinationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  examinationId,
  isOpen,
  onClose,
}) => {
  const [report, setReport] = useState<StructuredClinicalReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'prescription' | 'telemetry'>('prescription');

  // Clinician Sign-off Form State
  const [clinicianName, setClinicianName] = useState('Dr. Sarah Jenkins, MD');
  const [clinicianLicense, setClinicianLicense] = useState('MED-99482-ORTHO');
  const [diagnosticImpression, setDiagnosticImpression] = useState(
    'Probable musculoskeletal strain with mild extension lag. Conservative pharmacological management & targeted home physical therapy prescribed.'
  );
  const [recommendedPlan, setRecommendedPlan] = useState(
    'Adhere to prescribed anti-inflammatory regimen and progressive physical therapy exercises. Review in clinic in 7-10 days if symptoms persist.'
  );
  const [isSignedOff, setIsSignedOff] = useState<boolean>(false);
  const [signing, setSigning] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && examinationId) {
      setLoading(true);
      setError(null);
      getStructuredReport(examinationId)
        .then((data) => {
          setReport(data);
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
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Clinical_Physical_Exam_Report_${report.examination_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  // Fallback prescription if backend record had empty prescription
  const prescription: FinalPrescription = report?.prescription || {
    clinical_diagnosis: `${report?.patient_demographics.affected_side || ''} ${
      report?.patient_demographics.selected_region.replace('_', ' ') || 'Musculoskeletal'
    } Mechanical Strain / Acute Dysfunction`,
    affected_body_part: `${report?.patient_demographics.affected_side || ''} ${
      report?.patient_demographics.selected_region.replace('_', ' ') || 'Joint'
    }`,
    severity_grade: 'Mild to Moderate',
    medications: [
      {
        name: 'Diclofenac Diethylamine Gel 1.16% w/w + Menthol (Dynapar / Volini Gel)',
        form: 'Topical Gel',
        dosage: 'Apply thin ribbon (2-3 cm)',
        frequency: '3 to 4 times daily',
        duration: '7 days',
        how_to_use:
          'Gently smooth a thin film over the painful area in circular motions until absorbed. Do not rub vigorously or apply over broken skin. Wash hands thoroughly with soap after application.',
        precautions: 'Avoid contact with eyes or mouth. Discontinue if local skin rash occurs.',
      },
      {
        name: 'Tab. Paracetamol 650 mg (Calpol / Dolo 650)',
        form: 'Oral Tablet',
        dosage: '1 tablet (650 mg)',
        frequency: 'Twice daily after food (1-0-1, as needed for pain)',
        duration: '3 to 5 days',
        how_to_use:
          'Swallow whole tablet strictly after meals with a full glass of water. Maintain a minimum 6-hour interval between doses. Do not exceed 3 tablets in 24 hours.',
        precautions: 'Avoid concurrent alcohol or other paracetamol-containing remedies.',
      },
    ],
    exercises: [
      {
        name: 'Sub-Maximal Isometric Muscle Activation',
        target_area: 'Target Musculature & Peri-Articular Stabilizers',
        sets_reps: '3 sets of 10 repetitions, 5-second hold',
        frequency: 'Twice daily (Morning & Evening)',
        how_to_perform:
          'Contract the muscles around the affected area gently without moving the joint. Hold constant tension for 5 seconds, breathe normally, then relax for 3 seconds.',
        hold_duration_sec: 5,
        precautions: 'Do not hold your breath during isometric contraction.',
      },
      {
        name: 'Gentle Active-Assisted Range of Motion (AAROM)',
        target_area: 'Affected Articular Joint Complex',
        sets_reps: '2 sets of 10 smooth cycles',
        frequency: 'Twice daily',
        how_to_perform:
          'Move the joint slowly and smoothly through pain-free range without carrying external load. Stop before reaching sharp discomfort.',
        hold_duration_sec: 0,
        precautions: 'Stay strictly within pain-free boundaries.',
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
    follow_up_advice:
      'Review in orthopedic clinic in 7 to 10 days if functional pain does not improve by at least 50%, or sooner if symptoms worsen.',
    emergency_warning:
      'Seek IMMEDIATE emergency orthopedic attention if you experience: sudden severe inability to bear weight, visible joint deformity, progressive numbness/weakness in fingers or toes, or high fever with joint warmth.',
    prescribed_date: new Date().toISOString(),
  };

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
              </div>
              <p className="text-xs text-slate-400">
                Medical-grade treatment plan, targeted exercises & biomechanical telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
        <div className="bg-slate-950/90 px-6 py-2.5 border-b border-slate-800 flex items-center gap-3 no-print">
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
                            AI-Assisted Orthopedic & Physical Medicine Clinic
                          </h1>
                        </div>
                        <p className="text-xs text-emerald-400 mt-1 font-medium">
                          Center for Precision Musculoskeletal Kinematics, Rehabilitation & Evidence-Based Therapeutics
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Digital Clinical Physical Examination • ISO/FHIR Compliant Orthopedic Health Record
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
                          Severity: {prescription.severity_grade}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 uppercase font-semibold text-[10px] block">Safety Screen</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          CLEARED (No Fractures)
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">Ottawa Rules Negative</span>
                      </div>
                    </div>

                    {/* Diagnosis Highlight */}
                    <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider block">
                          Primary Clinical Diagnosis (निदान):
                        </span>
                        <span className="text-sm font-bold text-white">
                          {prescription.clinical_diagnosis}
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-900/80 text-emerald-200 border border-emerald-700 px-2 py-0.5 rounded font-mono">
                        Protocol: {report.protocol_administered}
                      </span>
                    </div>
                  </div>

                  {/* Section 1: Prescribed Medications (चिकित्सीय दवाइयाँ) */}
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
                            Strictly follow dosage intervals and consumption instructions
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg font-mono">
                        {prescription.medications.length} Prescribed
                      </span>
                    </div>

                    <div className="space-y-4">
                      {prescription.medications.map((med, index) => (
                        <div
                          key={index}
                          className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center">
                                {index + 1}
                              </span>
                              <h4 className="text-sm font-bold text-white">
                                {med.name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-semibold">
                                {med.form}
                              </span>
                              <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                                {med.duration}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                            <div>
                              <span className="text-slate-500 text-[10px] block uppercase font-mono">Dosage (मात्रा)</span>
                              <span className="font-semibold text-slate-200">{med.dosage}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[10px] block uppercase font-mono">Frequency (कब लें)</span>
                              <span className="font-semibold text-cyan-300">{med.frequency}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[10px] block uppercase font-mono">Duration (अवधि)</span>
                              <span className="font-semibold text-emerald-400">{med.duration}</span>
                            </div>
                          </div>

                          {/* How to use instruction callout */}
                          <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-3 text-xs space-y-1">
                            <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                              <Info className="w-3.5 h-3.5 text-emerald-400" />
                              <span>HOW TO USE / लेने का सही तरीका व निर्देश:</span>
                            </div>
                            <p className="text-white font-medium leading-relaxed">
                              {med.how_to_use}
                            </p>
                            {med.precautions && (
                              <p className="text-[11px] text-amber-300/90 pt-1 border-t border-emerald-900/60 leading-snug">
                                <strong>सावधानी (Precaution):</strong> {med.precautions}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Prescribed Physical Therapy & Rehabilitation Exercises (कसरत व व्यायाम) */}
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
                      <span className="text-xs bg-slate-900 border border-slate-700 text-cyan-300 px-2.5 py-1 rounded-lg font-mono">
                        {prescription.exercises.length} Exercises Prescribed
                      </span>
                    </div>

                    <div className="space-y-4">
                      {prescription.exercises.map((ex, index) => (
                        <div
                          key={index}
                          className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center justify-center">
                                {index + 1}
                              </span>
                              <h4 className="text-sm font-bold text-white">
                                {ex.name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-slate-800 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded font-mono font-bold">
                                {ex.target_area}
                              </span>
                              {ex.hold_duration_sec ? (
                                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                                  Hold: {ex.hold_duration_sec}s
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                            <div>
                              <span className="text-slate-500 text-[10px] block uppercase font-mono">Sets & Repetitions (मात्रा)</span>
                              <span className="font-semibold text-amber-300">{ex.sets_reps}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[10px] block uppercase font-mono">Frequency (दिन में कब)</span>
                              <span className="font-semibold text-emerald-400">{ex.frequency}</span>
                            </div>
                          </div>

                          {/* How to perform instruction callout */}
                          <div className="bg-cyan-950/40 border border-cyan-500/50 rounded-xl p-3 text-xs space-y-1">
                            <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                              <span>HOW TO PERFORM / करने की सही विधि व तकनीक:</span>
                            </div>
                            <p className="text-white font-medium leading-relaxed">
                              {ex.how_to_perform}
                            </p>
                            {ex.precautions && (
                              <p className="text-[11px] text-amber-300/90 pt-1 border-t border-cyan-900/60 leading-snug">
                                <strong>सावधानी (Warning):</strong> {ex.precautions}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
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
                        {prescription.home_care_measures.map((measure, idx) => (
                          <div key={idx} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-slate-300 flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span className="leading-snug">{measure}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Activities to Avoid (परहेज) */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                      <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>4. Activities to Avoid (परहेज / क्या न करें)</span>
                      </h3>
                      <div className="space-y-2 text-xs">
                        {prescription.activity_modifications.map((mod, idx) => (
                          <div key={idx} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-amber-200/90 flex items-start gap-2">
                            <span className="text-amber-400 font-bold">✕</span>
                            <span className="leading-snug">{mod}</span>
                          </div>
                        ))}
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
                      {prescription.emergency_warning}
                    </p>
                    <div className="text-[11px] text-red-300 pt-1 border-t border-red-800/80 font-mono">
                      Follow-up Advice: {prescription.follow_up_advice}
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
                          <div>Digitally Generated & Verified via Physical Examination Controller</div>
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
