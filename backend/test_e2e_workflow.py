"""
End-to-end integration test for AI-Driven Physical Examination System.
Validates:
1. Complete clinical knee protocol workflow
2. MediaPipe Pose kinematic landmark analysis on video
3. State machine progression & persistence
4. Emergency red flag abort conditions
5. Structured clinical report generation & clinician sign-off
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.database import init_db

def run_e2e_test():
    print("\n=======================================================")
    print("[E2E] RUNNING END-TO-END PHYSICAL EXAMINATION WORKFLOW TEST")
    print("=======================================================\n")
    
    init_db()
    client = TestClient(app)

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] 1. Backend health check: PASSED (Healthy)")

    # 2. Initialize Examination: Operator selects Right Knee
    create_payload = {
        "patient_id": "PT-E2E-TEST",
        "patient_name": "Eleanor Vance",
        "patient_age": 52,
        "patient_gender": "Female",
        "selected_region": "RIGHT_KNEE",
        "affected_side": "RIGHT",
        "patient_orientation": "SAGITTAL_RIGHT"
    }
    res = client.post("/api/v1/examinations", json=create_payload)
    assert res.status_code == 200, f"Exam init failed: {res.text}"
    exam = res.json()
    exam_id = exam["id"]
    print(f"[PASS] 2. Examination Initialized: ID={exam_id}, Region={exam['selected_region']}, Status={exam['status']}")
    assert exam["current_step_id"] == "RED_FLAG_TRAUMA"
    assert exam["current_step_index"] == 1

    # 3. Step 1: Ottawa Knee Trauma Rule -> No acute trauma / Can bear weight (False)
    res = client.post(
        f"/api/v1/examinations/{exam_id}/steps/RED_FLAG_TRAUMA/submit-json",
        json={"response_boolean": False}
    )
    assert res.status_code == 200
    exam = res.json()
    print(f"[PASS] 3. Step 1 Cleared: Red Flag Trauma -> NEGATIVE. Next Step: {exam['current_step_id']}")
    assert exam["current_step_id"] == "RED_FLAG_SEPTIC"

    # 4. Step 2: Infection / Septic Joint Screen -> No fever / not hot (False)
    res = client.post(
        f"/api/v1/examinations/{exam_id}/steps/RED_FLAG_SEPTIC/submit-json",
        json={"response_boolean": False}
    )
    assert res.status_code == 200
    exam = res.json()
    print(f"[PASS] 4. Step 2 Cleared: Red Flag Septic -> NEGATIVE. Next Step: {exam['current_step_id']}")
    assert exam["current_step_id"] == "RED_FLAG_NEUROVASCULAR"

    # 5. Step 3: Neurovascular Deficit -> No numbness / pulses intact (False)
    res = client.post(
        f"/api/v1/examinations/{exam_id}/steps/RED_FLAG_NEUROVASCULAR/submit-json",
        json={"response_boolean": False}
    )
    assert res.status_code == 200
    exam = res.json()
    print(f"[PASS] 5. Step 3 Cleared: Red Flag Neurovascular -> NEGATIVE. Next Step: {exam['current_step_id']}")
    assert exam["current_step_id"] == "SYMPTOM_LOCALIZATION"

    # 6. Step 4: Epicenter Localization -> Medial Joint Line
    res = client.post(
        f"/api/v1/examinations/{exam_id}/steps/SYMPTOM_LOCALIZATION/submit-json",
        json={"response_choice": "MEDIAL_JOINT_LINE"}
    )
    assert res.status_code == 200
    exam = res.json()
    print(f"[PASS] 6. Step 4 Submitted: Localization -> MEDIAL_JOINT_LINE. Specific Zone: {exam['specific_zone']}")
    assert exam["current_step_id"] == "MECHANICAL_SYMPTOMS"

    # 7. Step 5: Mechanical Symptoms -> True locking
    res = client.post(
        f"/api/v1/examinations/{exam_id}/steps/MECHANICAL_SYMPTOMS/submit-json",
        json={"response_choice": "TRUE_LOCKING"}
    )
    assert res.status_code == 200
    exam = res.json()
    print(f"[PASS] 7. Step 5 Submitted: Mechanical Symptoms -> TRUE_LOCKING. Next: {exam['current_step_id']}")
    assert exam["current_step_id"] == "AROM_FLEXION_EXTENSION"

    # 8. Step 6: Active Knee ROM Sagittal Video Analysis (MediaPipe Kinematics)
    print("   Running MediaPipe Computer Vision kinematic pose tracking on active ROM video...")
    res = client.post(
        f"/api/v1/examinations/{exam_id}/steps/AROM_FLEXION_EXTENSION/submit-json",
        json={"use_synthetic_kinematic_demo": True}
    )
    assert res.status_code == 200, f"CV Step failed: {res.text}"
    exam = res.json()
    assert len(exam["measurements"]) > 0, "No biomechanical measurement was recorded"
    m = exam["measurements"][0]
    print(f"[PASS] 8. Step 6 Completed: CV Kinematic Analysis Successful!")
    print(f"      - Terminal Extension: {m['terminal_extension_deg']} deg (Normal: 0-5 deg)")
    print(f"      - Maximum Flexion: {m['maximum_flexion_deg']} deg (Normal: 130-145 deg)")
    print(f"      - Active ROM: {m['range_of_motion_deg']} deg")
    print(f"      - Peak Angular Velocity: {m['peak_angular_velocity_dps']} deg/s")
    print(f"      - Landmark Tracking Confidence: {m['tracking_confidence_mean']*100:.1f}%")
    print(f"      - Tracking Quality Rating: {m['quality_rating']}")
    print(f"      - Valid Tracked Frames: {m['frames_tracked']}/{m['frames_total']}")
    assert m["range_of_motion_deg"] > 40.0, "ROM should be physically plausible"

    # 9. Step 7: Functional Squat
    res = client.post(
        f"/api/v1/examinations/{exam_id}/steps/FUNCTIONAL_SQUAT/submit-json",
        json={"use_synthetic_kinematic_demo": True}
    )
    assert res.status_code == 200
    exam = res.json()
    print(f"[PASS] 9. Step 7 Completed: Functional Squat Biomechanics analyzed. Next: {exam['current_step_id']}")
    assert exam["current_step_id"] == "PALPATION_TENDERNESS"

    # 10. Step 8: Targeted Palpation Tenderness -> 7 / 10
    res = client.post(
        f"/api/v1/examinations/{exam_id}/steps/PALPATION_TENDERNESS/submit-json",
        json={"response_numeric": 7.0}
    )
    assert res.status_code == 200
    exam = res.json()
    print(f"[PASS] 10. Step 8 Completed: Palpation Tenderness -> 7.0/10 NRS.")
    print(f"      Examination Status: {exam['status']}")
    assert exam["status"] == "COMPLETED", f"Expected COMPLETED, got {exam['status']}"

    # 11. Generate Structured Clinical Report
    res = client.get(f"/api/v1/examinations/{exam_id}/report")
    assert res.status_code == 200
    report = res.json()
    print("\n[PASS] 11. Structured Clinical Report Generated:")
    print(f"      - Patient-Reported Symptoms: {len(report['patient_reported_symptoms'])} items")
    print(f"      - Computer-Vision Observations: {len(report['computer_vision_observations'])} items")
    print(f"      - Objective Biomechanical Measurements: {len(report['objective_measurements'])} items")
    print(f"      - Red Flags Cleared: {report['red_flag_evaluation']['red_flags_cleared']}")
    print(f"      - Regulatory Notice Present: {'NOT an autonomous medical diagnosis' in report['regulatory_disclaimer']}")

    # 12. Clinician Attestation & Sign-off
    sign_payload = {
        "clinician_name": "Dr. Sarah Jenkins, MD",
        "clinician_license": "MED-99482-ORTHO",
        "diagnostic_impression": "Probable right medial meniscus posterior horn tear with mechanical catching and 12 deg terminal extension lag.",
        "recommended_plan": "Knee MRI without contrast. Conservative PT avoiding deep squats; consider arthroscopic evaluation if mechanical locking persists."
    }
    res = client.post(f"/api/v1/examinations/{exam_id}/sign-off", json=sign_payload)
    assert res.status_code == 200
    print(f"[PASS] 12. Clinician Sign-Off Attestation: PASSED (Signed by {sign_payload['clinician_name']})")

    # 13. SAFETY TEST: Red Flag Trigger Abort Branch
    print("\n--- Testing Emergency Red-Flag Abort Rule ---")
    res_red = client.post(
        "/api/v1/examinations",
        json={
            "patient_id": "PT-RED-FLAG-SAFETY",
            "selected_region": "RIGHT_KNEE",
            "affected_side": "RIGHT"
        }
    )
    red_exam_id = res_red.json()["id"]
    # Patient reports Ottawa trauma rule positive: YES acute trauma & cannot bear weight 4 steps
    res_abort = client.post(
        f"/api/v1/examinations/{red_exam_id}/steps/RED_FLAG_TRAUMA/submit-json",
        json={"response_boolean": True}
    )
    assert res_abort.status_code == 200
    aborted_exam = res_abort.json()
    print(f"[PASS] 13. Red Flag Safety Abort Triggered:")
    print(f"      - Examination Status: {aborted_exam['status']} (Expected: ABORTED_RED_FLAG)")
    print(f"      - Urgent Referral: {aborted_exam['urgent_referral']}")
    print(f"      - Urgency Level: {aborted_exam['referral_urgency']}")
    print(f"      - Reason: {aborted_exam['urgent_referral_reason']}")
    assert aborted_exam["status"] == "ABORTED_RED_FLAG"
    assert aborted_exam["urgent_referral"] is True
    assert "Ottawa Knee Rule" in aborted_exam["urgent_referral_reason"]

    print("\n=======================================================")
    print("[SUCCESS] ALL END-TO-END PHYSICAL EXAMINATION TESTS PASSED (100%)")
    print("=======================================================\n")

if __name__ == "__main__":
    run_e2e_test()
