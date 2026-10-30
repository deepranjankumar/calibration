import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.database import init_db

def test_all_regions():
    init_db()
    client = TestClient(app)

    regions_to_test = [
        ("RIGHT_SHOULDER", "RIGHT", "RED_FLAG_SHOULDER_TRAUMA", 5),
        ("RIGHT_ELBOW", "RIGHT", "RED_FLAG_ELBOW_TRAUMA", 5),
        ("RIGHT_WRIST", "RIGHT", "RED_FLAG_WRIST_TRAUMA", 5),
        ("RIGHT_HIP", "RIGHT", "RED_FLAG_HIP_TRAUMA", 6),
        ("RIGHT_ANKLE", "RIGHT", "RED_FLAG_ANKLE_OTTAWA", 5),
        ("LUMBAR_SPINE", "RIGHT", "RED_FLAG_CAUDA_EQUINA", 5),
        ("RIGHT_KNEE", "RIGHT", "RED_FLAG_TRAUMA", 8),
    ]

    print("\n=======================================================")
    print("[TEST] VERIFYING ALL MAJOR ANATOMICAL REGION PROTOCOLS")
    print("=======================================================\n")

    for region, side, expected_first_step, expected_step_count in regions_to_test:
        payload = {
            "patient_id": f"PT-{region}",
            "patient_name": "Test Subject",
            "patient_age": 40,
            "patient_gender": "Unspecified",
            "selected_region": region,
            "affected_side": side,
        }
        res = client.post("/api/v1/examinations", json=payload)
        assert res.status_code == 200, f"Failed init for {region}: {res.text}"
        data = res.json()
        assert data["current_step_id"] == expected_first_step, f"Expected {expected_first_step}, got {data['current_step_id']}"
        assert data["total_steps"] == expected_step_count, f"Expected {expected_step_count} steps, got {data['total_steps']}"

        print(f"[PASS] {region:<16} Protocol: '{data['protocol_name']}' Initial Step: {data['current_step_id']} ({data['total_steps']} steps seeded)")

    print("\n[SUCCESS] ALL MAJOR BODY REGION PROTOCOLS VALIDATED & READY!")

if __name__ == "__main__":
    test_all_regions()
