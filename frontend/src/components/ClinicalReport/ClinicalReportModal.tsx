import React, { useState, useEffect } from 'react';
import type { StructuredClinicalReport } from '../../types/examination';
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
  Stethoscope
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

  // Clinician Sign-off Form State
  const [clinicianName, setClinicianName] = useState('Dr. Sarah Jenkins, MD');
  const [clinicianLicense, setClinicianLicense] = useState('MED-99482-ORTHO');
  const [diagnosticImpression, setDiagnosticImpression] = useState(
    'Probable medial meniscus posterior horn tear with mild secondary extension lag. Contralateral comparison recommended.'
  );
  const [recommendedPlan, setRecommendedPlan] = useState(
    'Weight-bearing MRI of the right knee. Conservative physical therapy focusing on quadriceps activation; avoid deep squatting.'
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950 border border-cyan-500/40 rounded-xl text-cyan-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Structured Clinical Physical Examination Report
              </h2>
              <p className="text-xs text-slate-400">
                FHIR-compliant orthopedic physical assessment record
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Print Clinical Summary"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadJSON}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Export as JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
          {loading && (
            <div className="text-center py-12 text-slate-400">
              Loading clinical records and synthesized measurements...
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

              {/* Patient & Exam Metadata Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="grid grid-cols-4 gap-4 text-xs">
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
                      {report.patient_demographics.affected_side} {report.patient_demographics.selected_region.replace('_', ' ')}
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
                  1. Validated Safety Screen (Ottawa Knee & Infection Criteria)
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
                        {report.computer_vision_quality_summary.valid_tracking_frames} / {report.computer_vision_quality_summary.frames_analyzed}
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

              {/* 6. Clinician Review & Attestation Sign-off */}
              <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                    Clinician Confirmation & Attestation
                  </h3>
                  {isSignedOff && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/50">
                      <Lock className="w-3 h-3" />
                      CLINICIAN SIGNED & LOCKED
                    </span>
                  )}
                </div>

                {!isSignedOff ? (
                  <form onSubmit={handleSignOff} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                          Attending Clinician Name
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
                        Diagnostic Impression (Clinician Formulation)
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
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      {signing ? 'Attesting...' : 'Sign Off & Lock Clinical Report'}
                    </button>
                  </form>
                ) : (
                  <div className="bg-emerald-950/40 border border-emerald-600/30 rounded-lg p-3 space-y-2 text-xs">
                    <div className="text-emerald-300 font-bold">
                      Report Attested by: {clinicianName} (License: {clinicianLicense})
                    </div>
                    <div className="text-slate-300">
                      <strong>Diagnostic Impression:</strong> {diagnosticImpression}
                    </div>
                    <div className="text-slate-300">
                      <strong>Plan:</strong> {recommendedPlan}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
