import sys
from pathlib import Path
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.database import init_db

def test_hindi_questions():
    init_db()
    client = TestClient(app)

    # 1. Initialize Knee Exam
    res = client.post("/api/v1/examinations", json={
        "patient_id": "PT-HINDI-TEST",
        "patient_name": "राम कुमार (Ram Kumar)",
        "patient_age": 55,
        "patient_gender": "Male",
        "selected_region": "RIGHT_KNEE",
        "affected_side": "RIGHT"
    })
    assert res.status_code == 200, res.text
    exam = res.json()
    first_step = exam["current_step"]
    
    print("\n[TEST 1] First Step Hindi Field Verification:")
    print("Step ID:", first_step["step_id"])
    print("English:", first_step["patient_question"])
    print("Hindi  :", first_step.get("patient_question_hi"))
    assert first_step.get("patient_question_hi") is not None
    assert "घुटने" in first_step["patient_question_hi"]
    print("[PASS] Knee first step contains accurate Hindi translation!")

    # 2. Initialize Lumbar Spine (Bending) Exam
    res_spine = client.post("/api/v1/examinations", json={
        "patient_id": "PT-SPINE-HINDI",
        "patient_name": "सीता देवी (Sita Devi)",
        "patient_age": 48,
        "patient_gender": "Female",
        "selected_region": "LUMBAR_SPINE",
        "affected_side": "RIGHT"
    })
    assert res_spine.status_code == 200
    exam_spine = res_spine.json()
    spine_first_step = exam_spine["current_step"]
    print("\n[TEST 2] Lumbar Spine First Step Hindi Verification:")
    print("Step ID:", spine_first_step["step_id"])
    print("Hindi  :", spine_first_step.get("patient_question_hi"))
    assert spine_first_step.get("patient_question_hi") is not None
    assert "जांघों" in spine_first_step["patient_question_hi"] or "कमर" in spine_first_step["patient_question_hi"]
    print("[PASS] Lumbar spine step contains accurate Hindi translation!")

    # 3. Initialize Hip (Walking / Gait) Exam
    res_hip = client.post("/api/v1/examinations", json={
        "patient_id": "PT-HIP-HINDI",
        "patient_name": "मोहन लाल (Mohan Lal)",
        "patient_age": 62,
        "patient_gender": "Male",
        "selected_region": "RIGHT_HIP",
        "affected_side": "RIGHT"
    })
    assert res_hip.status_code == 200
    exam_hip = res_hip.json()
    hip_steps = exam_hip["steps"]
    gait_step = next((s for s in hip_steps if s["step_id"] == "HIP_GAIT_WALK_ANALYSIS"), None)
    assert gait_step is not None
    print("\n[TEST 3] Hip Walking / Gait Step Hindi Verification:")
    print("Step ID:", gait_step["step_id"])
    print("English:", gait_step["patient_question"])
    print("Hindi  :", gait_step.get("patient_question_hi"))
    assert "कदम" in gait_step["patient_question_hi"]
    print("[PASS] Hip Walking/Gait step contains accurate Hindi instruction for village patients!")

    print("\n=======================================================")
    print("[SUCCESS] ALL HINDI TRANSLATION API TESTS PASSED 100%!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_hindi_questions()
