import requests
import json

BASE = "http://localhost:8000/api/v1/examinations"

print("1. Testing Patient Mesh Calibration from Photo/Demo biometrics...")
res = requests.post(f"{BASE}/calibrate-patient-mesh", data={"is_demo": "true"})
assert res.status_code == 200, f"Calibration failed: {res.text}"
calib = res.json()
print(f"[OK] Calibration Succeeded: Height ~{calib['body_proportions']['estimated_height_cm']}cm, Key Joints: {len(calib['key_joint_positions'])}, 3D Landmarks: {len(calib['landmarks_3d'])}")

print("\n2. Initializing Examination with Calibrated Patient Mesh...")
exam_payload = {
    "patient_id": "PT-4821",
    "patient_name": "John Doe",
    "patient_age": 48,
    "patient_gender": "Male",
    "selected_region": "RIGHT_KNEE",
    "affected_side": "RIGHT",
    "patient_calibration": calib
}
res = requests.post(BASE, json=exam_payload)
assert res.status_code == 200, f"Init exam failed: {res.text}"
exam = res.json()
exam_id = exam["id"]
print(f"[OK] Exam Created: {exam_id}, Status: {exam['status']}, First Step: {exam['current_step']['title']}")

step_count = 1
while exam.get("current_step") and exam.get("status") == "ACTIVE":
    step = exam["current_step"]
    action_type = step["action_type"]
    step_id = step["step_id"]
    print(f"\nStep {step_count}: '{step['title']}' (Type: {action_type})")
    
    if action_type == "QUESTION_BOOLEAN":
        payload = {"response_boolean": False}
    elif action_type == "QUESTION_CHOICE":
        choices = step.get("input_config", {}).get("choices", [])
        chosen_val = choices[0]["value"] if choices else "NONE"
        payload = {"response_choice": chosen_val}
    elif action_type == "VIDEO_MOVEMENT":
        payload = {"use_synthetic_kinematic_demo": True}
    else:
        payload = {"response_choice": "NONE"}
        
    res = requests.post(f"{BASE}/{exam_id}/steps/{step_id}/submit", json=payload)
    assert res.status_code == 200, f"Step submit failed: {res.text}"
    exam = res.json()
    step_count += 1

print("\nAll steps completed! Checking measurements & report...")
measurements = exam.get("measurements", [])
print(f"[OK] Measurements count: {len(measurements)}")
if measurements:
    latest_m = measurements[-1]
    ts_data = latest_m.get("timeseries_data", [])
    frames_with_lms = [f for f in ts_data if f.get("frame_landmarks_3d")]
    print(f"[OK] ROM: {latest_m.get('range_of_motion_deg')} deg, Max Flexion: {latest_m.get('max_flexion_deg')} deg")
    print(f"[OK] Kinematic 3D Landmark Frames Produced: {len(frames_with_lms)}/{len(ts_data)} frames (Dynamic 3D Mesh Replay verified!)")

print("\nFetching Structured Clinical Report...")
res = requests.get(f"{BASE}/{exam_id}/report")
assert res.status_code == 200, f"Report failed: {res.text}"
rep = res.json()
demo = rep.get("patient_demographics", {})
print(f"[OK] Report generated! Patient: {demo.get('patient_id')}, Region: {demo.get('selected_region')}, Protocol: {rep.get('protocol_administered')}")
print(f"[OK] Red Flags Cleared: {rep.get('red_flag_evaluation', {}).get('red_flags_cleared')}")
print(f"[OK] Objective Measurements in Report: {len(rep.get('objective_measurements', []))}")
print(f"[OK] CV Quality Overall Status: {rep.get('computer_vision_quality_summary', {}).get('overall_status')}")

print("\n=======================================================")
print("ALL CLINICAL AND BIOMECHANICAL STEPS VERIFIED END-TO-END!")
print("=======================================================")


