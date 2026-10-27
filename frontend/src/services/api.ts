import type { Examination, StructuredClinicalReport } from '../types/examination';

const API_BASE = 'http://localhost:8000/api/v1';

export async function createExamination(data: {
  patient_id?: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  selected_region: string;
  affected_side: string;
  patient_orientation?: string;
}): Promise<Examination> {
  const response = await fetch(`${API_BASE}/examinations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Failed to create examination' }));
    throw new Error(err.detail || 'Network error creating examination');
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
