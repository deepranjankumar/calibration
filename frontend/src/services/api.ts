import type { Examination, StructuredClinicalReport, PatientCalibration, Point3D, PointAnalysis, FinalPrescription } from '../types/examination';

const API_BASE = 'http://localhost:8000/api/v1';

function parseApiError(err: any, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (typeof err.detail === 'string') return err.detail;
  if (Array.isArray(err.detail)) {
    return err.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join('; ');
  }
  if (typeof err.detail === 'object' && err.detail !== null) {
    return JSON.stringify(err.detail);
  }
  if (err.message) return err.message;
  return fallback;
}

export async function analyzeBodyPoint(
  point: { x: number; y: number; z: number },
  normal?: { x: number; y: number; z: number },
  sideHint?: string
): Promise<PointAnalysis> {
  const response = await fetch(`${API_BASE}/examinations/analyze-point`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      point,
      normal,
      side_hint: sideHint,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Failed to analyze 3D point' }));
    throw new Error(parseApiError(err, 'Failed to analyze point'));
  }
  return response.json();
}

export async function calibratePatientMesh(
  photoFile?: File | null,
  isDemo?: boolean
): Promise<PatientCalibration> {
  const formData = new FormData();
  if (photoFile) {
    formData.append('photo', photoFile);
  }
  if (isDemo) {
    formData.append('is_demo', 'true');
  }

  const response = await fetch(`${API_BASE}/examinations/calibrate-patient-mesh`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Patient photo calibration failed' }));
    throw new Error(parseApiError(err, 'Photo calibration failed'));
  }
  return response.json();
}

export async function createExamination(data: {
  patient_id?: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  selected_region: string;
  affected_side: string;
  patient_orientation?: string;
  patient_calibration?: PatientCalibration | null;
  selected_point?: Point3D | null;
  point_analysis?: PointAnalysis | null;
}): Promise<Examination> {
  const response = await fetch(`${API_BASE}/examinations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Failed to create examination' }));
    throw new Error(parseApiError(err, 'Network error creating examination'));
  }
  return response.json();
}

export async function getExamination(examId: string): Promise<Examination> {
  const response = await fetch(`${API_BASE}/examinations/${examId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch examination: ${response.statusText}`);
  }
  return response.json();
}

export async function submitStepJson(
  examId: string,
  stepId: string,
  data: {
    response_boolean?: boolean;
    response_choice?: string;
    response_text?: string;
    response_numeric?: number;
    use_synthetic_kinematic_demo?: boolean;
  }
): Promise<Examination> {
  const response = await fetch(`${API_BASE}/examinations/${examId}/steps/${stepId}/submit-json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Submission failed' }));
    throw new Error(err.detail || 'Submission failed');
  }
  return response.json();
}

export async function submitStepFormData(
  examId: string,
  stepId: string,
  formData: FormData
): Promise<Examination> {
  const response = await fetch(`${API_BASE}/examinations/${examId}/steps/${stepId}/submit`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Submission failed' }));
    throw new Error(err.detail || 'Submission failed');
  }
  return response.json();
}

export async function getStructuredReport(examId: string): Promise<StructuredClinicalReport> {
  const response = await fetch(`${API_BASE}/examinations/${examId}/report`);
  if (!response.ok) {
    throw new Error(`Failed to fetch report: ${response.statusText}`);
  }
  return response.json();
}

export async function signOffReport(
  examId: string,
  data: {
    clinician_name: string;
    clinician_license: string;
    diagnostic_impression: string;
    recommended_plan: string;
  }
): Promise<any> {
  const response = await fetch(`${API_BASE}/examinations/${examId}/sign-off`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to sign off report: ${response.statusText}`);
  }
  return response.json();
}

export async function updatePrescription(
  examId: string,
  prescription: FinalPrescription
): Promise<FinalPrescription> {
  const response = await fetch(`${API_BASE}/examinations/${examId}/prescription`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prescription),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Failed to update prescription' }));
    throw new Error(parseApiError(err, 'Failed to update prescription'));
  }
  return response.json();
}
