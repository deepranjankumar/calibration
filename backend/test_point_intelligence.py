"""
Test arbitrary 3D body pointing, anatomical analysis,
dynamic protocol creation, and treatment decisions.
"""
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

init_db()
client = TestClient(app)

def test_point_analysis_api():
    print("\n--- 1. Testing /examinations/analyze-point for multiple body points ---")
    test_points = [
        {
            "name": "Right Anterior Thigh (Quadriceps)",
            "payload": {"point": {"x": -0.14, "y": -0.18, "z": 0.08}, "normal": {"x": 0.0, "y": 0.0, "z": 1.0}}
        },
        {
            "name": "Left Posterior Calf (Gastrocnemius/Achilles)",
            "payload": {"point": {"x": 0.12, "y": -0.58, "z": -0.06}, "normal": {"x": 0.0, "y": 0.0, "z": -1.0}}
        },
        {
            "name": "Thoracic Chest Wall / Pectoralis",
            "payload": {"point": {"x": -0.08, "y": 0.46, "z": 0.10}, "normal": {"x": 0.0, "y": 0.0, "z": 1.0}}
        },
        {
            "name": "Right Forearm / Elbow Extensors",
            "payload": {"point": {"x": -0.32, "y": 0.32, "z": 0.02}, "normal": {"x": -1.0, "y": 0.0, "z": 0.0}}
        },
        {
            "name": "Lumbar Paraspinal Muscle Bed",
            "payload": {"point": {"x": 0.04, "y": 0.26, "z": -0.06}, "normal": {"x": 0.0, "y": 0.0, "z": -1.0}}
        }
    ]

    for item in test_points:
        resp = client.post("/api/v1/examinations/analyze-point", json=item["payload"])
        assert resp.status_code == 200, f"Failed: {resp.text}"
        data = resp.json()
        print(f"[PASS] Point: {item['name']}")
        print(f"       Identified: {data['display_name']} ({data['side']})")
        print(f"       Tissue/Muscle: {data['anatomical_structures']['primary_muscle']}")
        print(f"       Red Flag Screen: {data['clinical_decisions']['red_flags']['condition']}")
        print(f"       Tests Recommended: {[t['title'] for t in data['clinical_decisions']['recommended_tests']]}")
        print(f"       Treatment (Phase 1): {data['clinical_decisions']['treatment_plan']['phase1_acute'][:60]}...")
        assert "clinical_decisions" in data
        assert "treatment_plan" in data["clinical_decisions"]

def test_dynamic_arbitrary_point_examination():
    print("\n--- 2. Testing Full Dynamic Examination for Pointed Location ---")
    point_payload = {
        "patient_id": "PT-POINT-99",
        "patient_name": "Marcus Vance",
        "patient_age": 34,
        "patient_gender": "Male",
        "selected_region": "CUSTOM_POINT",
        "affected_side": "RIGHT",
        "selected_point": {"x": -0.14, "y": -0.18, "z": 0.08} # Right Anterior Thigh
    }
    create_resp = client.post("/api/v1/examinations", json=point_payload)
    assert create_resp.status_code == 200, f"Create failed: {create_resp.text}"
    exam = create_resp.json()
    exam_id = exam["id"]
    print(f"[PASS] Examination Created: {exam_id}")
    print(f"       Protocol: {exam['protocol_name']}")
    print(f"       Total Steps Seeded: {exam['total_steps']}")
    assert exam["total_steps"] >= 4
    assert exam["selected_point"] is not None
    assert exam["point_analysis"] is not None

    # Step 1: Red Flag Answered FALSE (Safe)
    step1 = exam["current_step"]
    sub1_resp = client.post(f"/api/v1/examinations/{exam_id}/steps/{step1['step_id']}/submit-json", json={"response_boolean": False})
    assert sub1_resp.status_code == 200
    exam = sub1_resp.json()
    print(f"[PASS] Step 1 Completed -> Advanced to Step: {exam['current_step_id']}")

    # Step 2: Diagnostic Mechanism
    step2 = exam["current_step"]
    sub2_resp = client.post(f"/api/v1/examinations/{exam_id}/steps/{step2['step_id']}/submit-json", json={"response_choice": "SUDDEN_HIGH_IMPACT"})
    assert sub2_resp.status_code == 200
    exam = sub2_resp.json()
    print(f"[PASS] Step 2 Completed -> Advanced to Step: {exam['current_step_id']}")

    # Step 3: Movement Test (Synthetic Demo)
    step3 = exam["current_step"]
    sub3_resp = client.post(f"/api/v1/examinations/{exam_id}/steps/{step3['step_id']}/submit-json", json={"use_synthetic_kinematic_demo": True})
    assert sub3_resp.status_code == 200
    exam = sub3_resp.json()
    print(f"[PASS] Step 3 Completed -> Advanced to Step: {exam['current_step_id']}")

    # Complete all remaining steps until COMPLETED
    while exam["status"] == "ACTIVE" and exam["current_step"]:
        cur_step = exam["current_step"]
        step_id = cur_step["step_id"]
        action_type = cur_step["action_type"]
        if action_type == "QUESTION_BOOLEAN":
            sub_resp = client.post(f"/api/v1/examinations/{exam_id}/steps/{step_id}/submit-json", json={"response_boolean": False})
        elif action_type == "PALPATION_SCORE":
            sub_resp = client.post(f"/api/v1/examinations/{exam_id}/steps/{step_id}/submit-json", json={"response_numeric": 6.0})
        elif action_type == "VIDEO_MOVEMENT":
            sub_resp = client.post(f"/api/v1/examinations/{exam_id}/steps/{step_id}/submit-json", json={"use_synthetic_kinematic_demo": True})
        else: # QUESTION_CHOICE
            sub_resp = client.post(f"/api/v1/examinations/{exam_id}/steps/{step_id}/submit-json", json={"response_choice": "SUDDEN_HIGH_IMPACT"})
        
        assert sub_resp.status_code == 200
        exam = sub_resp.json()
        print(f"[PASS] Step {step_id} Completed. New Status: {exam['status']}")

    print(f"[PASS] All Steps Completed! Status: {exam['status']}")
    print(f"       Clinical Summary:\n{exam.get('clinical_summary')}")

if __name__ == "__main__":
    test_point_analysis_api()
    test_dynamic_arbitrary_point_examination()
    print("\n[ALL TESTS PASSED] ARBITRARY POINT INTELLIGENCE VERIFIED!")
