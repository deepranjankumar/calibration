"""
Clinical Point Intelligence & Anatomical Decision Engine
Analyzes arbitrary 3D spatial points on the patient's body mesh.
Determines exact anatomical structures, tissues, nerve supplies, and formulates:
1. Red-flag safety screening questions (with natural Hindi translations)
2. Targeted diagnostic interview questions
3. Recommended further physical/functional tests
4. Evidence-based treatment & rehabilitation plans
"""

from typing import Dict, Any, List, Optional
import math
import urllib.request
import json
import logging
from app.protocols.base import ProtocolStepDef
from app.config import settings

logger = logging.getLogger(__name__)

class AnatomicalPointAnalyzer:
    @staticmethod
    def analyze_point(
        point: Dict[str, float],
        normal: Optional[Dict[str, float]] = None,
        side_hint: Optional[str] = None,
        enrich_llm: bool = True
    ) -> Dict[str, Any]:
        """
        Takes 3D coordinates (x, y, z) and optional normal vector,
        determines the anatomical region, structure, and clinical decision profile.
        """
        x = float(point.get("x", 0.0))
        y = float(point.get("y", 0.0))
        z = float(point.get("z", 0.0))

        nx = float(normal.get("x", 0.0)) if normal else 0.0
        ny = float(normal.get("y", 0.0)) if normal else 0.0
        nz = float(normal.get("z", 1.0)) if normal else (1.0 if z >= 0 else -1.0)

        # 1. Determine Side (Right vs Left vs Midline/Bilateral)
        abs_x = abs(x)
        if abs_x < 0.035:
            side = "BILATERAL"
            side_str = "Midline"
        elif x < 0:
            side = "RIGHT"
            side_str = "Right"
        else:
            side = "LEFT"
            side_str = "Left"

        if side_hint and side_hint in ["RIGHT", "LEFT"] and abs_x < 0.08:
            side = side_hint
            side_str = side_hint.title()

        # 2. Determine Aspect (Anterior vs Posterior vs Lateral vs Medial)
        if nz > 0.35 or (normal is None and z >= -0.01):
            aspect = "ANTERIOR"
            aspect_str = "Anterior (Front)"
        elif nz < -0.35 or (normal is None and z < -0.01):
            aspect = "POSTERIOR"
            aspect_str = "Posterior (Back)"
        elif abs(nx) > 0.5:
            aspect = "LATERAL" if ((x < 0 and nx < 0) or (x > 0 and nx > 0)) else "MEDIAL"
            aspect_str = aspect.title()
        else:
            aspect = "ANTERIOR" if z >= 0 else "POSTERIOR"
            aspect_str = aspect.title()

        # 3. Anatomical Regional Classification
        point_dict = {"x": x, "y": y, "z": z}
        normal_dict = {"x": nx, "y": ny, "z": nz}

        # Upper Extremities (Arms, Forearms, Hands)
        is_upper_limb = abs_x > 0.16 and (-0.15 <= y <= 0.68)

        if is_upper_limb:
            raw_res = AnatomicalPointAnalyzer._classify_upper_limb(point_dict, normal_dict, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str)
        elif y > 0.72:
            raw_res = AnatomicalPointAnalyzer._classify_head_cranium(point_dict, normal_dict, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str)
        elif 0.60 < y <= 0.72:
            raw_res = AnatomicalPointAnalyzer._classify_neck_cervical(point_dict, normal_dict, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str)
        elif 0.38 < y <= 0.60:
            raw_res = AnatomicalPointAnalyzer._classify_thorax_chest_back(point_dict, normal_dict, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str)
        elif 0.16 < y <= 0.38:
            raw_res = AnatomicalPointAnalyzer._classify_abdomen_lumbar(point_dict, normal_dict, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str)
        elif -0.02 < y <= 0.16:
            raw_res = AnatomicalPointAnalyzer._classify_pelvis_hip_gluteal(point_dict, normal_dict, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str)
        elif -0.32 < y <= -0.02:
            raw_res = AnatomicalPointAnalyzer._classify_thigh(point_dict, normal_dict, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str)
        elif -0.48 < y <= -0.32:
            raw_res = AnatomicalPointAnalyzer._classify_knee(point_dict, normal_dict, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str)
        elif -0.74 < y <= -0.48:
            raw_res = AnatomicalPointAnalyzer._classify_leg_calf_shin(point_dict, normal_dict, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str)
        else: # y <= -0.74
            raw_res = AnatomicalPointAnalyzer._classify_ankle_foot(point_dict, normal_dict, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str)

        if enrich_llm:
            return AnatomicalPointAnalyzer._enrich_with_cloud_llm(raw_res)
        return raw_res

    @staticmethod
    def _enrich_with_cloud_llm(result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Queries Ollama Cloud API (using settings.OLLAMA_MODEL e.g. nemotron-3-nano:30b)
        to dynamically enrich the point analysis with differential diagnosis, pearls, and questions.
        Includes a 3.5s timeout with silent fallback so local rules always succeed instantly.
        """
        base_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
        api_key = getattr(settings, "OLLAMA_CLOUD_API", None)
        diffs = result.get("clinical_decisions", {}).get("differential_diagnosis", [])
        pearl = result.get("clinical_decisions", {}).get("clinical_pearl", "")

        is_local = "localhost" in base_url or "127.0.0.1" in base_url
        if not api_key and not is_local:
            result["cloud_ai_insights"] = {
                "model_used": "Built-in Clinical Knowledge Engine",
                "differential_diagnosis": diffs,
                "clinical_pearl": pearl,
                "targeted_treatment_insight": "Evidence-based regional protocol active.",
                "status": "LOCAL_ENGINE"
            }
            return result

        try:
            pt = result.get("point", {})
            structures = result.get("anatomical_structures", {})
            prompt = (
                f"Patient pinpointed 3D coordinates: x={pt.get('x', 0):.2f}, y={pt.get('y', 0):.2f}, z={pt.get('z', 0):.2f}. "
                f"Region: {result.get('display_name')}, Aspect: {result.get('aspect')}. "
                f"Suspected tissue: {structures.get('primary_muscle')}, Nerve: {structures.get('innervation')}. "
                "Provide a JSON object with: "
                "1. differential_diagnosis: list of 3-4 specific clinical conditions, "
                "2. clinical_pearl: high-yield 1-sentence physical exam tip for this location, "
                "3. dynamic_questions: list of 2 diagnostic questions with prompt_en and prompt_hi (in natural Hindi), "
                "4. targeted_treatment_insight: 1-sentence recovery recommendation."
            )
            req_data = {
                "model": settings.OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a clinical orthopedic and physical examination AI. Output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                "format": "json",
                "stream": False
            }
            url = f"{settings.OLLAMA_BASE_URL}/api/chat"
            headers = {"Content-Type": "application/json"}
            if api_key and not is_local:
                headers["Authorization"] = f"Bearer {api_key}"
            req = urllib.request.Request(
                url,
                data=json.dumps(req_data).encode("utf-8"),
                headers=headers
            )
            with urllib.request.urlopen(req, timeout=12.0) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))
                content = resp_json.get("message", {}).get("content", "").strip()
                if "```json" in content:
                    content = content.split("```json", 1)[1].split("```", 1)[0]
                elif "```" in content:
                    content = content.split("```", 1)[1].split("```", 1)[0]
                content = content.strip()
                try:
                    parsed = json.loads(content)
                except Exception:
                    parsed = {}

                model_diffs = parsed.get("differential_diagnosis", [])
                if not isinstance(model_diffs, list) or len(model_diffs) == 0:
                    model_diffs = diffs

                model_pearl = parsed.get("clinical_pearl", "") or pearl
                model_insight = parsed.get("targeted_treatment_insight", "") or "Evidence-based regional protocol active."

                result["cloud_ai_insights"] = {
                    "model_used": f"{settings.OLLAMA_MODEL} (Local Free Ollama)",
                    "differential_diagnosis": model_diffs,
                    "clinical_pearl": model_pearl,
                    "targeted_treatment_insight": model_insight,
                    "status": "ONLINE"
                }

                # If cloud AI returned additional dynamic questions, enrich diagnostic_questions
                extra_q = parsed.get("dynamic_questions", [])
                if isinstance(extra_q, list) and len(extra_q) > 0:
                    existing_prompts = {q.get("prompt_en") for q in result["clinical_decisions"]["diagnostic_questions"]}
                    for eq in extra_q:
                        if isinstance(eq, dict) and eq.get("prompt_en") and eq.get("prompt_en") not in existing_prompts:
                            result["clinical_decisions"]["diagnostic_questions"].append({
                                "id": f"Q_LLM_{len(result['clinical_decisions']['diagnostic_questions']) + 1}",
                                "prompt_en": eq.get("prompt_en"),
                                "prompt_hi": eq.get("prompt_hi")
                            })

        except Exception as e:
            logger.info(f"Ollama Cloud API offline, unbilled, or timeout ({e}), using built-in clinical engine.")
            result["cloud_ai_insights"] = {
                "model_used": "Built-in Clinical Knowledge Engine",
                "differential_diagnosis": diffs,
                "clinical_pearl": pearl,
                "targeted_treatment_insight": "Evidence-based regional protocol active.",
                "status": "OFFLINE_FALLBACK"
            }

        return result

    # --- REGION CLASSIFIERS & DECISION GENERATORS ---

    @staticmethod
    def _classify_thigh(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        if aspect == "ANTERIOR":
            region_id = f"{side}_ANTERIOR_THIGH"
            display_name = f"{side_str} Anterior Thigh (Quadriceps Femoris / Rectus Femoris)"
            muscle = "Quadriceps Femoris (Rectus Femoris, Vastus Medialis, Vastus Lateralis)"
            nerve = "Femoral Nerve (L2, L3, L4)"
            tissue = "Skeletal Muscle Belly & Tendinous Insertion"
            action = "Knee extension and hip flexion"

            rf_en = "Did you hear or feel an explosive 'pop' or snap in the front of your thigh, is there a visible sunken dent/gap, or are you completely unable to bear weight?"
            rf_hi = "क्या जांघ के आगे तेज पटाखे जैसी आवाज या झटका महसूस हुआ, क्या मांसपेशी में गड्ढा दिख रहा है या पैर पर बिल्कुल वजन नहीं रख पा रहे हैं?"
            rf_cond = "Acute High-Grade Quadriceps Tear / Avulsion / Femoral Neck Fracture"

            dq = [
                {"id": "Q_MECHANISM", "prompt_en": "Did this pain start suddenly while sprinting, kicking, or jumping, or after a direct blunt impact (contusion)?", "prompt_hi": "क्या यह दर्द दौड़ते, किक मारते समय अचानक हुआ, या किसी चीज की तेज टक्कर लगने से?"},
                {"id": "Q_PAIN_BEHAVIOR", "prompt_en": "Does bending your knee backwards (stretching the front of your thigh) sharply aggravate the pain?", "prompt_hi": "क्या घुटने को पीछे मोड़कर जांघ को खींचने पर तेज दर्द महसूस होता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_ACTIVE_SLR",
                    "title": "Active Straight Leg Raise & Resisted Knee Extension",
                    "instruction_en": "Sit or lie supine. Lift the leg straight up with knee fully extended, then extend against gentle resistance.",
                    "instruction_hi": "सीधे बैठकर या लेटकर घुटने को बिना मोड़े पैर को ऊपर सीधा उठाएं।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "KNEE"
                },
                {
                    "test_id": "TEST_PRONE_ELY",
                    "title": "Ely's Rectus Femoris Passive Stretch Test",
                    "instruction_en": "In prone position, gently flex the patient's knee towards the buttock to assess quadriceps tightness and pain reproduction.",
                    "instruction_hi": "पेट के बल लेटकर घुटने को पीछे कूल्हे की तरफ मोड़ने पर खिंचाव और दर्द की जांच करें।",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_PALPATION_QUAD",
                    "title": "Focal Quadriceps Belly Palpation",
                    "instruction_en": "Palpate along the anterior thigh muscle fibers. Check for focal tenderness, muscle spasm, or a palpable defect.",
                    "instruction_hi": "जांघ की उस मांसपेशी पर सीधे उंगली से दबाकर देखें कि कितना दर्द या सूजन है।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "POLICE protocol: Avoid painful stretching. Apply cold packs for 15-20 min every 3 hours. Use compressive elastic wrap.",
                "phase2_rehab": "Sub-maximal isometric quadriceps sets (quad sets), progression to straight leg raises and seated active knee extensions once pain-free.",
                "phase3_medical": "Diagnostic musculoskeletal ultrasound if focal defect or large hematoma suspected. Gradual return to sports over 2-6 weeks depending on tear grade.",
                "recovery_timeline": "Mild Strain: 1-2 weeks; Moderate Partial Tear: 3-6 weeks."
            }

            differentials = [
                "Quadriceps Muscle Strain / Contusion (जांघ के आगे की मांसपेशी में खिंचाव)",
                "Rectus Femoris Tendinopathy",
                "Femoral Nerve Compression / L3-L4 Radiculopathy",
                "Meralgia Paresthetica (Anterolateral Burning)"
            ]
            pearl = "Inability to perform straight leg raise or localized defect in rectus femoris indicates high-grade quadriceps tear; burning over anterolateral thigh indicates meralgia paresthetica."

        elif aspect == "POSTERIOR":
            region_id = f"{side}_POSTERIOR_THIGH"
            display_name = f"{side_str} Posterior Thigh (Hamstring Muscle Complex)"
            muscle = "Hamstrings (Biceps Femoris long & short heads, Semitendinosus, Semimembranosus)"
            nerve = "Sciatic Nerve (Tibial & Common Peroneal divisions L5, S1, S2)"
            tissue = "Muscle Belly & Proximal Ischial Tendon"
            action = "Knee flexion and hip extension"

            rf_en = "Did you experience sudden tearing pain at top speed, extreme bruising spreading down the back of your knee, or inability to walk without severe limp?"
            rf_hi = "क्या तेज दौड़ते समय जांघ के पीछे तेज खिंचाव या फटने जैसा दर्द हुआ, क्या पीछे नीला निशान पड़ गया है या चलने में भारी लंगड़ाहट है?"
            rf_cond = "Acute High-Grade Hamstring Avulsion / Rupture"

            dq = [
                {"id": "Q_HAMSTRING_SIT", "prompt_en": "Does prolonged sitting on hard chairs or bending forward to touch your toes trigger sharp pain in the back of your thigh?", "prompt_hi": "क्या सख्त कुर्सी पर बैठने से या आगे झुकने पर जांघ के पीछे तेज दर्द उठता है?"},
                {"id": "Q_HAMSTRING_POP", "prompt_en": "Did you feel an audible pop or snap during deceleration or high kicking?", "prompt_hi": "क्या दौड़ते समय रुकते हुए या पैर ऊपर उठाते समय कोई चटकने की आवाज आई?"}
            ]

            tests = [
                {
                    "test_id": "TEST_RESISTED_KNEE_FLEXION",
                    "title": "Resisted Knee Flexion (Hamstring Activation)",
                    "instruction_en": "Lie prone or sit. Flex knee against manual resistance at 30°, 60°, and 90° to isolate biceps femoris and semitendinosus.",
                    "instruction_hi": "पेट के बल लेटकर घुटने को मोड़ें और दबाव के खिलाफ खींचें।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "KNEE"
                },
                {
                    "test_id": "TEST_SLUMP_SCIATIC",
                    "title": "Slump Test (Sciatic Nerve vs Hamstring Differentiation)",
                    "instruction_en": "Assess whether seated slump with ankle dorsiflexion reproduces the pain to distinguish neural tension from muscular strain.",
                    "instruction_hi": "बैठकर गर्दन और पीठ झुकाकर पैर सीधा करने पर क्या करंट जैसा दर्द दौड़ता है?",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_PALPATION_HAMSTRING",
                    "title": "Targeted Hamstring Palpation & Defect Check",
                    "instruction_en": "Systematically palpate the hamstring muscle bellies and proximal origin at the ischial tuberosity.",
                    "instruction_hi": "जांघ के पीछे की नस और कूल्हे की हड्डी के पास दबाकर दर्द का स्तर मापें।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Immediate relative rest; avoid aggressive straight-leg stretching. Ice packs for 20 mins. Compressive thigh sleeve.",
                "phase2_rehab": "Progress from prone isometric knee flexion to Nordic hamstring curls and Romanian deadlifts with light resistance.",
                "phase3_medical": "MRI indicated if suspected proximal ischial tendon avulsion (>2cm retraction requires surgical repair).",
                "recovery_timeline": "Grade 1: 2-3 weeks; Grade 2: 4-8 weeks; Complete Avulsion: surgical consult."
            }

            differentials = [
                "Sciatic Nerve Radicular Radiation Track (L4-S1 सायटिका का जांघ के पीछे उतरना)",
                "Hamstring Tendon / Muscle Strain (जांघ के पीछे खिंचाव)",
                "Deep Sciatic Neural Adhesion / Entrapment",
                "Ischial Tuberosity Enthesopathy"
            ]
            pearl = "Radiating posterior thigh pain that shoots past the knee without local muscle tenderness on palpation is referred Sciatica from lumbar or piriformis origin."

        else: # Lateral or Medial Thigh (ITB or Adductors)
            is_lateral = aspect == "LATERAL" or (x < 0 and nx < -0.3) or (x > 0 and nx > 0.3)
            sub_name = "Iliotibial Band (ITB) / Tensor Fasciae Latae" if is_lateral else "Adductor Longus / Groin Muscle Bed"
            region_id = f"{side}_LATERAL_THIGH" if is_lateral else f"{side}_MEDIAL_THIGH"
            display_name = f"{side_str} {sub_name}"
            muscle = "Iliotibial Tract & Tensor Fasciae Latae" if is_lateral else "Adductor Longus, Adductor Magnus, Gracilis"
            nerve = "Superior Gluteal Nerve (L4-S1)" if is_lateral else "Obturator Nerve (L2-L4)"
            tissue = "Dense Fascial Band / Muscle Tendon"
            action = "Hip abduction & pelvic stability" if is_lateral else "Hip adduction & stabilization"

            rf_en = "Do you have sudden severe groin swelling, inability to move the hip in any direction, or fever with warm tender mass?"
            rf_hi = "क्या ग्रोइन या जांघ में अचानक भारी सूजन आई है, पैर किसी भी दिशा में नहीं हिल रहा है, या तेज बुखार है?"
            rf_cond = "Acute Adductor Avulsion / Septic Joint / Inguinal Hernia"

            dq = [
                {"id": "Q_SIDE_PAIN", "prompt_en": "Does squeezing a ball between your knees or running on hard surfaces provoke the pain?", "prompt_hi": "क्या दोनों घुटनों के बीच तकिया दबाने पर या दौड़ने पर यह दर्द उभरता है?"}
            ]
            tests = [
                {
                    "test_id": "TEST_OBER_ITB",
                    "title": "Ober's Test (IT Band Tightness) or Squeeze Test (Adductors)",
                    "instruction_en": "Side-lying Ober test for lateral thigh or supine isometric adductor squeeze at 0° and 45° knee flexion.",
                    "instruction_hi": "करवट लेटकर पैर को पीछे खींचकर देखें कि जांघ के किनारे कितना खिंचाव है।",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_PALPATION_THIGH_BORDER",
                    "title": "Focal ITB / Adductor Origin Palpation",
                    "instruction_en": "Palpate the IT band along lateral femoral condyle and Gerdy's tubercle, or adductor longus origin at pubic tubercle.",
                    "instruction_hi": "जांघ के बाहरी किनारे या भीतरी जोड़ पर दबाकर दर्द की जांच करें।",
                    "action_type": "PALPATION_SCORE"
                }
            ]
            rx = {
                "phase1_acute": "Foam rolling / soft tissue release to ITB/TFL or adductors. Avoid aggressive cutting/sprinting.",
                "phase2_rehab": "Side-planks, clamshells, Copenhagen adductor planks (isometric hold progression).",
                "phase3_medical": "Pelvic/Hip X-ray if persistent groin pain to rule out femoral acetabular impingement (FAI) or sports hernia.",
                "recovery_timeline": "2-4 weeks with consistent load management."
            }

            differentials = [
                "Iliotibial Band (ITB) Friction Syndrome (बाहरी जांघ में खिंचाव)",
                "Adductor Muscle / Groin Strain (भीतरी जांघ में खिंचाव)",
                "Tensor Fasciae Latae Strain",
                "Greater Trochanteric Referral"
            ]
            pearl = "Lateral thigh aching exacerbated by prolonged walking or running points to ITB tightness, while pain on squeezing knees together indicates adductor strain."

        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx, differentials, pearl)

    def _classify_leg_calf_shin(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        if aspect == "POSTERIOR":
            region_id = f"{side}_CALF_POSTERIOR"
            display_name = f"{side_str} Posterior Calf (Gastrocnemius / Soleus / Achilles)"
            muscle = "Gastrocnemius (Medial & Lateral heads), Soleus, Plantaris"
            nerve = "Tibial Nerve (S1, S2)"
            tissue = "Triceps Surae Muscle Belly & Musculotendinous Junction"
            action = "Plantarflexion of the ankle and knee flexion assist"

            rf_en = "Did you feel an intense gunshot/kick sensation behind your ankle, is your calf hot, visibly swollen and tender to touch, or can you not push off on your toes?"
            rf_hi = "क्या पिंडली के पीछे ऐसा लगा जैसे किसी ने पत्थर मारा हो, क्या पिंडली में तेज गर्मी, सूजन और छूने पर तेज दर्द है (खून का थक्का/DVT), या पंजे पर खड़े नहीं हो पा रहे हैं?"
            rf_cond = "Achilles Tendon Complete Rupture / Deep Vein Thrombosis (DVT) Risk"

            dq = [
                {"id": "Q_CALF_ONSET", "prompt_en": "Did the calf pain start during push-off or jumping (tennis/running), or does it cramp mostly at night in bed?", "prompt_hi": "क्या दौड़ते या कूदते समय झटका लगा, या रात को सोते समय पिंडली में नस चढ़ने जैसा दर्द होता है?"},
                {"id": "Q_CALF_STRETCH", "prompt_en": "Does pulling your toes up towards your shin produce a sharp pulling pain in the calf muscle?", "prompt_hi": "क्या पैर के पंजे को ऊपर अपनी तरफ खींचने पर पिंडली की नस में तेज खिंचाव होता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_THOMPSON_ACHILLES",
                    "title": "Thompson Calf Squeeze Test (Achilles Integrity)",
                    "instruction_en": "Patient prone with feet hanging off edge. Squeeze calf belly firmly. Absence of passive plantarflexion confirms complete Achilles rupture.",
                    "instruction_hi": "पेट के बल लेटें। डॉक्टर पिंडली को दबाकर देखेंगे कि पंजा हिलता है या नस टूट गई है।",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_SINGLE_HEEL_RAISE",
                    "title": "Active Single-Leg Heel Raise & Calf Endurance",
                    "instruction_en": "Instruct patient to perform single-leg calf raise standing. Monitor for pain, weakness, or inability to achieve full height.",
                    "instruction_hi": "सिर्फ एक पैर के पंजे पर ऊपर उठें और देखें कि पिंडली में दर्द या कमजोरी तो नहीं है।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "ANKLE"
                },
                {
                    "test_id": "TEST_PALPATION_CALF",
                    "title": "Targeted Gastrocnemius Musculotendinous Junction Palpation",
                    "instruction_en": "Palpate the medial gastrocnemius belly and proximal Achilles tendon for gap, swelling, or focal tenderness.",
                    "instruction_hi": "पिंडली की नस पर हाथ से दबाकर दर्द और सूजन की जांच करें।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Temporary heel lift (1-1.5cm) in shoe to reduce Achilles/calf tension. RICE protocol. Compression stocking if DVT excluded.",
                "phase2_rehab": "Alfredson eccentric heel drops on a step (3x15 reps twice daily), progressing to weighted calf raises.",
                "phase3_medical": "Venous Doppler ultrasound immediately if calf swelling/DVT suspected. Orthopedic consult if positive Thompson test.",
                "recovery_timeline": "Medial Gastrocnemius Strain: 2-4 weeks; Achilles Tendinopathy: 6-12 weeks."
            }

            differentials = [
                "Sciatica L5-S1 Radicular Radiation into Calf & Foot (पिंडली व पंजे तक नस का दर्द)",
                "Gastrocnemius Nocturnal Muscle Cramps & Venous Stasis (पिंडलियों में रात की ऐंठन व भारीपन)",
                "Medial Gastrocnemius Muscle Strain (Tennis Leg)",
                "Diabetic / Nutritional (B12 Deficiency) Peripheral Neuropathy (पैरों व तलवों में जलन, सुन्नपन व झुनझुनी)"
            ]
            pearl = "Symmetrical bilateral burning/tingling in the soles worse at night indicates metabolic/nutritional neuropathy (Vitamin B12 deficiency/diabetes), whereas unilateral shooting electric pain from back/buttock is root Sciatica."

        else: # Anterior / Lateral (Tibia Shin / Tibialis Anterior)
            region_id = f"{side}_SHIN_ANTERIOR"
            display_name = f"{side_str} Anterior Leg & Shin (Tibialis Anterior / Tibial Shaft)"
            muscle = "Tibialis Anterior, Extensor Digitorum Longus, Periosteum of Tibia"
            nerve = "Deep Peroneal Nerve (L4, L5)"
            tissue = "Periosteum & Anterior Muscle Compartment"
            action = "Ankle dorsiflexion and foot inversion"

            rf_en = "Is your shin numb, do your toes feel cold, or is there extreme tightness/pain out of proportion to injury that is worsening hourly?"
            rf_hi = "क्या पैर का पंजा ऊपर नहीं उठ रहा (ड्रॉप फुट), पैर की उंगलियां सुन्न और ठंडी हैं, या पिंडली में पत्थर जैसी सख्त सूजन और असहनीय दर्द है (कंपार्टमेंट सिंड्रोम)?"
            rf_cond = "Acute Anterior Compartment Syndrome / Tibial Stress Fracture"

            dq = [
                {"id": "Q_SHIN_PAIN", "prompt_en": "Is the pain located along the inner edge of the shin bone after running/walking, and does it ache even at rest?", "prompt_hi": "क्या दौड़ने या तेज चलने के बाद पिंडली की हड्डी पर दर्द होता है, और क्या आराम करते समय भी मीठा-मीठा दर्द रहता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_ACTIVE_DORSIFLEXION",
                    "title": "Active Resisted Ankle Dorsiflexion & Heel Walk",
                    "instruction_en": "Have patient walk on heels for 6 steps and dorsiflex against firm resistance. Assess tibialis anterior strength and pain reproduction.",
                    "instruction_hi": "एड़ियों के बल चलकर दिखाएं और पंजे को पूरी ताकत से ऊपर उठाएं।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "ANKLE"
                },
                {
                    "test_id": "TEST_PALPATION_SHIN",
                    "title": "Tibial Periosteal Palpation (Shin Splints Screen)",
                    "instruction_en": "Palpate the posteromedial border of the tibia over a 5cm span to assess Medial Tibial Stress Syndrome (MTSS).",
                    "instruction_hi": "पिंडली की आगे वाली हड्डी पर उंगली दबाकर दर्द की जांच करें।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "De-load running and high-impact activities. Cross-train with swimming or cycling. Ice massage over tibial border.",
                "phase2_rehab": "Strengthen tibialis anterior and intrinsic foot muscles; calf flexibility drills; supportive footwear / orthotics.",
                "phase3_medical": "Order bone scan or MRI if focal pinpoint bone tenderness suggests tibial stress fracture (tuning fork / percussion test).",
                "recovery_timeline": "Medial Tibial Stress Syndrome: 3-8 weeks with activity modification."
            }

            differentials = [
                "Medial Tibial Stress Syndrome (Shin Splints from hard field walking - पिंडली के आगे की हड्डी में दर्द)",
                "Tibialis Anterior Muscle Strain / Tendinopathy",
                "Tibial Stress Fracture (हड्डी में हेयरलाइन क्रैक)",
                "Exertional Anterior Compartment Syndrome"
            ]
            pearl = "Diffuse tenderness along the lower third of the posteromedial tibial border represents shin splints (MTSS), while sharp focal pinpoint bone tenderness <2cm warrants stress fracture rule-out."

        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx, differentials, pearl)

    def _classify_thorax_chest_back(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        if aspect == "ANTERIOR":
            region_id = f"{side}_CHEST_THORACIC"
            display_name = f"{side_str} Thoracic Wall & Pectoralis Region"
            muscle = "Pectoralis Major, Pectoralis Minor, Intercostal Muscles"
            nerve = "Medial & Lateral Pectoral Nerves (C5-T1), Intercostal Nerves"
            tissue = "Chest Wall Musculature, Costochondral Junction & Ribs"
            action = "Arm adduction, internal rotation, and chest wall expansion"

            rf_en = "Are you experiencing crushing central chest pressure, pain radiating to your jaw/left arm, shortness of breath, dizziness, or cold sweating?"
            rf_hi = "क्या सीने में भारी दबाव, घुटन या जकड़न महसूस हो रही है, क्या दर्द बाएं हाथ या जबड़े तक फैल रहा है, या सांस फूलने के साथ ठंडा पसीना आ रहा है (हार्ट अटैक का खतरा)?"
            rf_cond = "Cardiovascular Emergency (Acute Coronary Syndrome) / Tension Pneumothorax / Pulmonary Embolism"

            dq = [
                {"id": "Q_CHEST_BREATH", "prompt_en": "Does taking a deep breath, coughing, or pressing directly with your finger on the tender rib cartilage recreate the exact pain?", "prompt_hi": "क्या गहरी सांस लेने, खांसने या सीने की हड्डी पर उंगली से दबाने पर ही यह दर्द होता है?"},
                {"id": "Q_CHEST_LIFT", "prompt_en": "Did the pain start after heavy bench press, push-ups, or a blunt collision?", "prompt_hi": "क्या जिम में वजन उठाने, पुश-अप्स लगाने या सीने पर कोई झटका लगने के बाद यह दर्द हुआ?"}
            ]

            tests = [
                {
                    "test_id": "TEST_CHEST_EXPANSION_COUGH",
                    "title": "Deep Inspiration & Rib Cage Expansion Challenge",
                    "instruction_en": "Instruct patient to take a maximum deep inspiration and hold for 3 seconds. Check for pleuritic/costochondral reproduction.",
                    "instruction_hi": "गहरी सांस अंदर खींचें और 3 सेकंड रोकें। क्या सीने की हड्डी में चुभन होती है?",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "SPINE"
                },
                {
                    "test_id": "TEST_PALPATION_COSTOCHONDRAL",
                    "title": "Focal Costochondral / Pectoralis Palpation",
                    "instruction_en": "Firmly palpate the costochondral junctions (Costochondritis / Tietze syndrome) and pectoralis tendon insertion.",
                    "instruction_hi": "सीने की उस पसली या हड्डी पर दबाकर 0 से 10 तक दर्द का स्तर बताएं।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Rule out cardiac/pulmonary etiologies first (ECG/Troponin if indicated). Reassurance; relative rest from heavy chest pressing.",
                "phase2_rehab": "Gentle doorway pectoral stretching, thoracic spine extension exercises over foam roller, diaphragmatic breathing.",
                "phase3_medical": "Topical or oral NSAIDs for costochondritis. Chest X-Ray if history of blunt trauma to exclude rib fracture/pneumothorax.",
                "recovery_timeline": "Muscular strain / Costochondritis: 1-4 weeks."
            }

            differentials = [
                "Costochondritis / Tietze Syndrome (सीने की पसली की सूजन)",
                "Pectoralis Major Muscle Strain (सीने की मांसपेशी का खिंचाव)",
                "Intercostal Neuralgia / Musculoskeletal Chest Wall Pain",
                "Rule-out Angina / Cardiovascular Origin"
            ]
            pearl = "Chest wall pain that is sharply tender to local palpation on costochondral cartilage and reproduces on trunk twisting is costochondritis, not cardiac ischemia."

        else: # Posterior (Upper & Mid Back / Scapula / Rhomboid)
            region_id = f"{side}_THORACIC_POSTERIOR"
            display_name = f"{side_str} Thoracic Spine & Periscapular Region"
            muscle = "Rhomboid Major/Minor, Trapezius (Middle/Lower fibers), Erector Spinae, Latissimus Dorsi"
            nerve = "Dorsal Scapular Nerve (C5), Spinal Accessory Nerve (CN XI), Thoracic Spinal Nerves"
            tissue = "Periscapular Musculature & Thoracic Facet Joints"
            action = "Scapular retraction, thoracic extension & stabilization"

            rf_en = "Do you have sudden unprovoked severe mid-back pain radiating around your ribs like a tight band, fever, unexplained weight loss, or difficulty walking?"
            rf_hi = "क्या पीठ के बीच में असहनीय दर्द है जो पसलियों के चारों ओर शिकंजे की तरह जकड़ रहा है, बुखार है या पैरों में कमजोरी महसूस हो रही है?"
            rf_cond = "Thoracic Disc Herniation / Spinal Infection / Compression Fracture"

            dq = [
                {"id": "Q_SCAPULAR_POSTURE", "prompt_en": "Does sitting at a computer or driving for long hours cause burning or knot-like tightness between your shoulder blade and spine?", "prompt_hi": "क्या कुर्सी पर देर तक बैठने या मोबाइल चलाने पर कंधे की पीछे वाली हड्डी के पास जलन या गांठ जैसा दर्द होता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_THORACIC_ROTATION",
                    "title": "Seated Thoracic Trunk Rotation Kinematics",
                    "instruction_en": "Sit upright with arms crossed over chest. Rotate trunk smoothly to left and right (normal: ~45°). MediaPipe tracks shoulder rotation.",
                    "instruction_hi": "छाती पर हाथ बांधकर सीधे बैठें और धीरे-धीरे दोनों तरफ पीठ को घुमाएं।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "SPINE"
                },
                {
                    "test_id": "TEST_PALPATION_RHOMBOID",
                    "title": "Periscapular Myofascial Trigger Point Palpation",
                    "instruction_en": "Palpate the medial scapular border and paraspinal muscles for hyperirritable taut bands and focal tender nodules.",
                    "instruction_hi": "कंधे के पीछे वाली हड्डी और रीढ़ की हड्डी के बीच दबाकर दर्द का स्तर मापें।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Ergonomic desk setup adjustments; frequent posture breaks every 45 mins. Moist heat or ice to rhomboid bed.",
                "phase2_rehab": "Scapular retractions ('W' to 'Y' exercises), prone 'cobra' thoracic extensions, and pec minor doorway stretches.",
                "phase3_medical": "Myofascial release, dry needling, or trigger point therapy. Thoracic X-ray if osteoporotic patient with acute onset.",
                "recovery_timeline": "Postural Myofascial Pain: 1-3 weeks with ergonomic modification."
            }

            differentials = [
                "Axial Postural Kinetic Chain Strain (सिर पर भारी बोझ उठाने से गर्दन से पीठ तक खिंचाव)",
                "Thoracic Kyphotic Postural Fatigue & Rhomboid Spasm (कंधों के बीच दर्द)",
                "Costovertebral Joint Dysfunction (पसली का खिंचाव)",
                "Thoracic Spondylosis"
            ]
            pearl = "Mid-back paraspinal aching is almost always compensatory to occupational head-loading or stooping in fields. Cat-Camel mobilizations and thoracic extension unloading provide immediate pain relief."

        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx, differentials, pearl)

    def _classify_abdomen_lumbar(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        if aspect == "ANTERIOR":
            region_id = f"{side}_ABDOMINAL_WALL"
            display_name = f"{side_str} Abdominal Wall & Core"
            muscle = "Rectus Abdominis, External/Internal Obliques, Transversus Abdominis"
            nerve = "Thoracoabdominal Nerves (T7-T11), Subcostal Nerve (T12)"
            tissue = "Myofascial Abdominal Wall & Aponeurosis"
            action = "Trunk flexion, lateral rotation, intra-abdominal pressure generation"

            rf_en = "Do you have sudden excruciating abdominal pain, persistent vomiting, high fever, rigid board-like belly, or blood in your stool/urine?"
            rf_hi = "क्या पेट में अचानक बहुत तेज असहनीय दर्द उठा है, लगातार उल्टियां हो रही हैं, पेट पत्थर की तरह कड़ा हो गया है या पेशाब/शौच में खून आ रहा है (अपेंडिक्स या आंतरिक आपातकाल)?"
            rf_cond = "Acute Surgical Abdomen (Appendicitis / Perforated Viscus / Diverticulitis / Ruptured AAA)"

            dq = [
                {"id": "Q_CARNETT", "prompt_en": "When you tense your stomach muscles (like starting a sit-up) and press the tender spot, does the pain become more severe (abdominal wall) or decrease (internal organ)?", "prompt_hi": "जब आप पेट को कड़ा करके (सिट-अप की तरह) उस जगह को दबाते हैं, तो क्या दर्द बढ़ जाता है (मांसपेशी का दर्द) या कम होता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_CARNETT_TEST",
                    "title": "Carnett's Test (Abdominal Wall vs Visceral Distinction)",
                    "instruction_en": "Identify tender point while relaxed. Have patient raise head/shoulders off table to contract rectus. Increased pain indicates abdominal wall etiology (positive Carnett's).",
                    "instruction_hi": "सिर को थोड़ा ऊपर उठाकर पेट की मांसपेशी को कड़ा करें, फिर दर्द की जांच करें।",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_PALPATION_ABDOMEN",
                    "title": "Focal Abdominal Wall & Inguinal Palpation",
                    "instruction_en": "Gently palpate the rectus muscle belly and inguinal rings. Check for reducible hernia or localized tenderness.",
                    "instruction_hi": "पेट की उस खास जगह पर उंगली से हल्का दबाकर दर्द का स्तर बताएं।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Rule out intra-abdominal surgical emergencies first. Avoid aggressive sit-ups or heavy lifting.",
                "phase2_rehab": "Gentle core stabilization (transversus abdominis drawing-in maneuver, pelvic tilts, bird-dog).",
                "phase3_medical": "Abdominal wall trigger point injection or ultrasound if suspected anterior cutaneous nerve entrapment (ACNES).",
                "recovery_timeline": "Abdominal muscle strain: 2-4 weeks."
            }

            differentials = [
                "Rectus Abdominis Muscle Strain (पेट की मांसपेशी में खिंचाव)",
                "Anterior Cutaneous Nerve Entrapment Syndrome (ACNES - पेट की नस दबना)",
                "Incipient Inguinal / Umbilical Hernia (हर्निया का शुरुआती उभार)",
                "Referred Visceral Colic (आंतों या पथरी का दर्द)"
            ]
            pearl = "Positive Carnett's test (increased pain on head raise) confirms abdominal wall myofascial origin rather than intra-abdominal visceral emergency."

        else: # Posterior (Lumbar Spine & Paraspinal Musculature)
            region_id = f"{side}_LUMBAR_PARASPINAL"
            display_name = f"{side_str} Lumbar Paraspinal & Low Back Musculature"
            muscle = "Erector Spinae (Longissimus, Iliocostalis), Multifidus, Quadratus Lumborum"
            nerve = "Dorsal rami of Lumbar Spinal Nerves (L1-L5)"
            tissue = "Paraspinal Muscle Bed & Thoracolumbar Fascia"
            action = "Spine extension, lateral bending, posture stabilization"

            rf_en = "Do you have sudden numbness in your groin/saddle area, loss of bowel or bladder control, or progressive bilateral foot drop/weakness?"
            rf_hi = "क्या आपके जांघों के बीच या शौच वाली जगह पर सुन्नपन है, पेशाब-पाखाने पर नियंत्रण छूट रहा है, या दोनों पैरों में भारी कमजोरी है (कौडा इक्विना सिंड्रोम)?"
            rf_cond = "Cauda Equina Syndrome / Severe Spinal Canal Stenosis"

            dq = [
                {"id": "Q_LUMBAR_RADIATION", "prompt_en": "Does the pain shoot down past your knee into your calf or foot like an electric shock (sciatica), or stay in your low back?", "prompt_hi": "क्या दर्द केवल कमर में रहता है, या करंट की तरह नीचे पैर, पिंडली और पंजे तक दौड़ता है?"},
                {"id": "Q_LUMBAR_EXTENSION", "prompt_en": "Does standing up straight or leaning backwards make the pain better or worse?", "prompt_hi": "क्या सीधे खड़े होने या पीछे झुकने से दर्द में आराम मिलता है या दर्द बढ़ता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_LUMBAR_ACTIVE_ROM",
                    "title": "Active Lumbar Forward Flexion & Return (Toe Touch)",
                    "instruction_en": "Stand upright with knees straight. Smoothly bend forward towards toes to assess lumbar flexion ROM and aberrant movement.",
                    "instruction_hi": "घुटने सीधे रखकर धीरे-धीरे नीचे झुकें और पैर के अंगूठे को छूने की कोशिश करें।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "SPINE"
                },
                {
                    "test_id": "TEST_STRAIGHT_LEG_RAISE",
                    "title": "Passive Straight Leg Raise (Lasegue's Test)",
                    "instruction_en": "Assess for radicular pain reproduction between 35° and 70° of passive straight leg elevation.",
                    "instruction_hi": "सीधे लेटकर पैर को सीधा ऊपर उठाने पर क्या कमर से पैर तक बिजली जैसा दर्द दौड़ता है?",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_PALPATION_LUMBAR",
                    "title": "Lumbar Paraspinal & SI Joint Palpation",
                    "instruction_en": "Palpate bilateral lumbar erector spinae, quadratus lumborum, and PSIS / sacroiliac joints.",
                    "instruction_hi": "कमर की रीढ़ की हड्डी और दोनों तरफ की मांसपेशियों पर दबाकर 0 से 10 तक दर्द बताएं।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Maintain relative movement; avoid prolonged bed rest (>48h). Short walking sessions. Heat therapy for muscle spasm.",
                "phase2_rehab": "McKenzie directional preference exercises (prone press-ups), bird-dog, side-bridges, and hip mobility drills.",
                "phase3_medical": "Short course of NSAIDs/muscle relaxant. Lumbar MRI indicated if severe radiating deficit or unresponsive after 6 weeks.",
                "recovery_timeline": "Acute Mechanical Low Back Strain: 2-6 weeks."
            }

            differentials = [
                "L4-L5 / L5-S1 Lumbar Disc Herniation with Sciatica (सायटिका - कमर से पैर तक नस दबने का तेज दर्द)",
                "Piriformis Syndrome / Deep Gluteal Sciatic Entrapment (कूल्हे की नस में दबाव)",
                "Lumbar Spinal Canal Stenosis (न्यूरोजेनिक क्लॉडिकेशन - चलने पर पैरों में भारीपन)",
                "Lumbar Spondylosis & Acute Paraspinal Muscular Spasm (कमर की रीढ़ का घिसाव व ऐंठन)"
            ]
            pearl = "Straight Leg Raise (SLR / Lasegue's) test between 30°-70° differentiates true disc root sciatica from tight hamstrings. McKenzie prone press-ups push the disc anteriorly away from the nerve root to centralize pain out of the leg."

        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx, differentials, pearl)

    def _classify_pelvis_hip_gluteal(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        if aspect == "POSTERIOR":
            region_id = f"{side}_GLUTEAL_PIRIFORMIS"
            display_name = f"{side_str} Gluteal Region & Piriformis"
            muscle = "Gluteus Maximus, Gluteus Medius, Piriformis, Deep Hip Rotators"
            nerve = "Superior & Inferior Gluteal Nerves, Nerve to Piriformis, Sciatic Nerve"
            tissue = "Deep Gluteal Musculature & Sciatic Nerve Interface"
            action = "Hip extension, abduction, external rotation"

            rf_en = "Do you have sudden numbness in your saddle area, unexplained progressive leg paralysis, or severe night pain unaffected by body position?"
            rf_hi = "क्या नितंब या जांघ के बीच सुन्नपन है, पैर में गंभीर कमजोरी है, या रात में सोते समय असहनीय दर्द उठता है?"
            rf_cond = "Cauda Equina / Pelvic Malignancy / Septic Sacroiliitis"

            dq = [
                {"id": "Q_PIRIFORMIS_SIT", "prompt_en": "Does sitting on a hard chair, wallet in pocket, or driving trigger a deep ache in your buttock that shoots down your thigh?", "prompt_hi": "क्या कठोर कुर्सी पर बैठने से या गाड़ी चलाने पर कूल्हे में गहरा दर्द होता है जो जांघ के पीछे उतरता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_FAIR_TEST",
                    "title": "FAIR Test (Flexion, Adduction, Internal Rotation for Piriformis)",
                    "instruction_en": "In side-lying, place hip in 60° flexion, adduction, and internal rotation to stretch piriformis against sciatic nerve.",
                    "instruction_hi": "करवट लेटकर घुटने को मोड़कर अंदर की तरफ घुमाने पर दर्द की जांच करें।",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_TRENDELENBURG",
                    "title": "Single-Leg Balance (Trendelenburg Gluteus Medius Screen)",
                    "instruction_en": "Patient stands on symptomatic leg for 10-15 seconds. Observe for contralateral pelvic drop.",
                    "instruction_hi": "बिना सहारा लिए सिर्फ अपने दर्द वाले पैर पर 10 सेकंड तक संतुलन बनाकर खड़े रहें।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "HIP"
                },
                {
                    "test_id": "TEST_PALPATION_GLUTEAL",
                    "title": "Targeted Piriformis & Sciatic Notch Palpation",
                    "instruction_en": "Palpate midway between PSIS and greater trochanter along piriformis belly and greater sciatic notch.",
                    "instruction_hi": "कूल्हे की गहरी नस पर दबाकर देखें कि कितना दर्द होता है।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Avoid sitting on hard surfaces or thick wallets. Soft cushion. Ice/heat to gluteal region.",
                "phase2_rehab": "Piriformis figure-4 stretches, nerve flossing, gluteus medius strengthening (side-lying clams, bridges).",
                "phase3_medical": "Ultrasound-guided piriformis injection or deep dry needling if recalcitrant after 4-6 weeks.",
                "recovery_timeline": "Piriformis Syndrome: 3-8 weeks."
            }

            differentials = [
                "Piriformis Syndrome / Deep Gluteal Space Sciatica (पिरिफोर्मिस सिंड्रोम - कूल्हे की नस में दबाव)",
                "L4-S1 Lumbar Radiculopathy referring to Buttock (कमर से कूल्हे में उतरने वाला सायटिका)",
                "Sacroiliac Joint Dysfunction (SI Joint Strain - कमर व कूल्हे का जोड़)",
                "Gluteus Medius Tendinopathy & Ischial Bursitis"
            ]
            pearl = "Deep buttock aching aggravated by sitting on a hard chair, wallet in back pocket, or driving, with positive FAIR test but NO midline lumbar spine tenderness, strongly confirms Piriformis Syndrome over spinal disc herniation."

        else: # Anterior or Lateral Hip (Greater Trochanter / Hip Flexor)
            region_id = f"{side}_HIP_TROCHANTER"
            display_name = f"{side_str} Lateral Hip & Greater Trochanteric Region"
            muscle = "Gluteus Medius & Minimus tendons, Iliopsoas, Pectineus"
            nerve = "Femoral Nerve, Superior Gluteal Nerve"
            tissue = "Trochanteric Bursa / Tendon Enthesis / Hip Capsule"
            action = "Hip abduction or hip flexion"

            rf_en = "Did you fall directly onto your hip, are you unable to bear any weight on this leg, or does the leg appear shortened and rotated outward?"
            rf_hi = "क्या आप कूल्हे के बल गिरे थे, क्या पैर पर बिल्कुल वजन नहीं रख पा रहे हैं या पैर छोटा और बाहर मुड़ा हुआ दिख रहा है (कूल्हे की हड्डी टूटना)?"
            rf_cond = "Acute Femoral Neck / Intertrochanteric Hip Fracture"

            dq = [
                {"id": "Q_TROCHANTER_SIDE_SLEEP", "prompt_en": "Can you lie on that side in bed at night, or does direct pressure on the hip bone awaken you with throbbing pain?", "prompt_hi": "क्या रात को उस करवट सोने पर कूल्हे की उभरी हड्डी में तेज टीस या दर्द होता है?"}
            ]

            tests = [
                {
                    "test_id": "TEST_HIP_FABER",
                    "title": "FABER (Patrick's) Test (Flexion, Abduction, External Rotation)",
                    "instruction_en": "Place foot of symptomatic leg on opposite knee ('figure 4'). Gently press knee downward. Pain indicates intra-articular hip pathology or SI joint.",
                    "instruction_hi": "पैर को मोड़कर दूसरे घुटने पर रखें और घुटने को नीचे दबाकर देखें कि कूल्हे में दर्द होता है या नहीं।",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_PALPATION_TROCHANTER",
                    "title": "Greater Trochanter Direct Point Palpation",
                    "instruction_en": "Firmly palpate the lateral prominence of the greater trochanter and posterosuperior facet.",
                    "instruction_hi": "कूल्हे की बाहर वाली उभरी हुई हड्डी पर उंगली से सीधा दबाव देकर दर्द बताएं।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            rx = {
                "phase1_acute": "Avoid lying directly on affected side; place pillow between knees when sleeping. Relative rest from stairs/hills.",
                "phase2_rehab": "Isometric hip abductor loading in standing, progressing to side-lying abduction and pelvic drop corrections.",
                "phase3_medical": "Trochanteric bursa corticosteroid injection or shockwave therapy for chronic gluteal tendinopathy.",
                "recovery_timeline": "Greater Trochanteric Syndrome: 4-8 weeks."
            }

            differentials = [
                "Greater Trochanteric Pain Syndrome (GTPS / Gluteal Tendinopathy)",
                "Hip Joint Osteoarthritis (कूल्हे के जोड़ का घिसाव)",
                "Iliopsoas Bursitis & Tendinopathy",
                "Meralgia Paresthetica"
            ]
            pearl = "Pain localized precisely over the bony prominence of the greater trochanter that prevents sleeping on that side indicates GTPS rather than internal hip joint pathology."

        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx, differentials, pearl)

    def _classify_upper_limb(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        if y > 0.48: # Shoulder & Deltoid / Biceps
            region_id = f"{side}_SHOULDER_DELTOID"
            display_name = f"{side_str} Shoulder Girdle & Deltoid Complex"
            muscle = "Deltoid (Anterior, Lateral, Posterior), Supraspinatus, Biceps Brachii Long Head"
            nerve = "Axillary Nerve (C5, C6), Suprascapular Nerve"
            tissue = "Glenohumeral Musculature & Subacromial Bursa"
            action = "Arm elevation, abduction, and rotation"

            rf_en = "Did you suffer a violent fall or yank, is your shoulder visibly dislocated/deformed, or is there numbness over the outer deltoid?"
            rf_hi = "क्या कंधे पर कोई तेज चोट लगी है, कंधा अपनी जगह से उतर गया है या बाजू के बाहर सुन्नपन लग रहा है?"
            rf_cond = "Acute Shoulder Dislocation / Axillary Nerve Compromise"

            dq = [
                {"id": "Q_PAINFUL_ARC", "prompt_en": "Does lifting your arm sideways hurt specifically between shoulder height and overhead (60° to 120°)?", "prompt_hi": "क्या हाथ को ऊपर उठाते समय कंधे की ऊंचाई पर तेज दर्द या झटका लगता है?"}
            ]
            tests = [
                {
                    "test_id": "TEST_SHOULDER_ABDUCTION_AROM",
                    "title": "Active Shoulder Elevation & Painful Arc Screen",
                    "instruction_en": "Raise affected arm sideways and overhead smoothly to 180°. MediaPipe tracks shoulder-elbow angle.",
                    "instruction_hi": "हाथ को आगे से ऊपर आसमान की तरफ पूरा उठाएं।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "SHOULDER"
                },
                {
                    "test_id": "TEST_PALPATION_SHOULDER",
                    "title": "Subacromial Space & Bicipital Groove Palpation",
                    "instruction_en": "Palpate the subacromial space, AC joint, and anterior bicipital groove.",
                    "instruction_hi": "कंधे के उस खास दर्द वाले बिंदु पर उंगली से दबाने पर दर्द का स्तर बताएं।",
                    "action_type": "PALPATION_SCORE"
                }
            ]
            rx = {
                "phase1_acute": "Avoid painful overhead activities. Pendulum exercises. Ice for 15 mins after shoulder use.",
                "phase2_rehab": "Rotator cuff strengthening with elastic bands (external/internal rotation), scapular retraction.",
                "phase3_medical": "Diagnostic shoulder ultrasound or MRI if suspected full-thickness rotator cuff tear.",
                "recovery_timeline": "Subacromial Impingement / Tendinopathy: 4-8 weeks."
            }
        elif 0.28 < y <= 0.48: # Arm & Elbow (Biceps / Triceps / Epicondyles)
            is_elbow = y < 0.38
            sub = "Elbow Joint & Epicondylar Complex" if is_elbow else "Brachium (Biceps / Triceps Muscle Belly)"
            region_id = f"{side}_ELBOW_COMPLEX" if is_elbow else f"{side}_UPPER_ARM"
            display_name = f"{side_str} {sub}"
            muscle = "Biceps Brachii, Triceps Brachii, Common Extensor / Flexor Tendons"
            nerve = "Radial, Median, Ulnar, Musculocutaneous Nerves (C5-T1)"
            tissue = "Muscle Belly / Epicondylar Tendon Enthesis"
            action = "Elbow flexion, extension, forearm supination"

            rf_en = "Did you hear a sudden pop in your arm with a 'Popeye' muscle ball deformity, or are your fingers cold, numb, and pale?"
            rf_hi = "क्या हाथ में अचानक पटाखा बोलने जैसा लगा और मांसपेशी गेंद की तरह इकट्ठी हो गई, या हाथ की उंगलियां ठंडी और सफेद पड़ रही हैं?"
            rf_cond = "Distal Biceps Tendon Rupture / Supracondylar Fracture / Brachial Artery Compromise"

            dq = [
                {"id": "Q_ELBOW_GRIP", "prompt_en": "Does gripping objects firmly or twisting a doorknob/screwdriver reproduce sharp elbow pain?", "prompt_hi": "क्या कोई चीज पकड़ने या दरवाजा खोलने के लिए कलाई घुमाने पर कोहनी में तेज दर्द होता है?"}
            ]
            tests = [
                {
                    "test_id": "TEST_ELBOW_FLEXION_AROM",
                    "title": "Active Elbow Flexion & Extension Kinematics",
                    "instruction_en": "Fully extend elbow to 0°, then bend completely to touch shoulder (~145°).",
                    "instruction_hi": "हाथ को पूरा सीधा करें, फिर कोहनी मोड़कर कंधे को छूने की कोशिश करें।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "ELBOW"
                },
                {
                    "test_id": "TEST_COZENS_TENNIS_ELBOW",
                    "title": "Cozen's Test (Resisted Wrist Extension for Tennis Elbow)",
                    "instruction_en": "Resist wrist extension with elbow extended and pronated. Sharp lateral pain confirms lateral epicondylalgia.",
                    "instruction_hi": "मुट्ठी बांधकर कलाई को पीछे खींचें और दबाव के खिलाफ रोकें।",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_PALPATION_ELBOW",
                    "title": "Epicondyle & Biceps Tendon Palpation",
                    "instruction_en": "Palpate lateral epicondyle, medial epicondyle, and olecranon bursa.",
                    "instruction_hi": "कोहनी की उस हड्डी या नस पर दबाकर 0 से 10 तक दर्द बताएं।",
                    "action_type": "PALPATION_SCORE"
                }
            ]
            rx = {
                "phase1_acute": "Forearm counterforce brace. Avoid repetitive wrist extension. Ice massage over epicondyle.",
                "phase2_rehab": "Tyler Twist eccentric wrist extensor exercises with FlexBar; grip strengthening.",
                "phase3_medical": "Physical therapy; consider PRP injection or shockwave therapy for chronic epicondylopathy.",
                "recovery_timeline": "Lateral Epicondylalgia: 4-12 weeks."
            }
        else: # Forearm, Wrist & Hand (y <= 0.28)
            region_id = f"{side}_FOREARM_WRIST"
            display_name = f"{side_str} Forearm, Wrist & Hand"
            muscle = "Pronator Teres, Flexor/Extensor Carpi, Thenar Musculature"
            nerve = "Median Nerve (Carpal Tunnel), Ulnar Nerve, Radial Nerve"
            tissue = "Forearm Musculature, Carpal Tunnel, Intrinsic Hand Joints"
            action = "Wrist motion, finger flexion, thumb opposition"

            rf_en = "Did you fall on an outstretched hand, is your wrist visibly deformed like a fork, or do you have severe tenderness in the anatomical snuffbox (base of thumb)?"
            rf_hi = "क्या आप हाथ के बल गिरे थे, कलाई टेढ़ी दिख रही है, या अंगूठे के नीचे वाले गड्ढे में तेज दर्द है (स्कैफॉइड हड्डी टूटने का खतरा)?"
            rf_cond = "Colles Fracture / Scaphoid Fracture / Acute Compartment Syndrome"

            dq = [
                {"id": "Q_CARPAL_NUMBNESS", "prompt_en": "Do your thumb, index, and middle fingers wake you up at night with tingling or 'pins and needles'?", "prompt_hi": "क्या रात को सोते समय अंगूठे और पहली दो उंगलियों में झनझनाहट या सुन्नपन से नींद खुलती है?"}
            ]
            tests = [
                {
                    "test_id": "TEST_WRIST_PHALENS",
                    "title": "Phalen's Maneuver (Carpal Tunnel Compression Test)",
                    "instruction_en": "Press dorsal surfaces of hands together with wrists in 90° flexion for 60 seconds. Numbness in median distribution confirms carpal tunnel.",
                    "instruction_hi": "दोनों हाथों के पिछले हिस्से को मिलाकर कलाइयों को नीचे मोड़कर 1 मिनट रखें।",
                    "action_type": "QUESTION_CHOICE"
                },
                {
                    "test_id": "TEST_WRIST_AROM",
                    "title": "Active Wrist Flexion & Extension Kinematics",
                    "instruction_en": "Slowly bend wrist down toward floor, then up toward ceiling through full pain-free ROM.",
                    "instruction_hi": "कलाई को पहले पूरा नीचे की तरफ मोड़ें, फिर पूरा ऊपर आसमान की तरफ मोड़ें।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "WRIST"
                },
                {
                    "test_id": "TEST_PALPATION_WRIST",
                    "title": "Targeted Wrist & Carpal Tunnel Palpation",
                    "instruction_en": "Perform Tinel's tap over the median nerve at the volar carpal crease and palpate radial styloid.",
                    "instruction_hi": "कलाई के उस खास बिंदु या नस पर दबाकर 0 से 10 तक दर्द बताएं।",
                    "action_type": "PALPATION_SCORE"
                }
            ]
            rx = {
                "phase1_acute": "Neutral wrist cock-up splint worn primarily at night. Ergonomic keyboard/mouse modifications.",
                "phase2_rehab": "Median nerve gliding exercises, tendon glides, and gentle forearm stretching.",
                "phase3_medical": "Nerve conduction study (EMG/NCS) if persistent numbness or thenar atrophy; carpal tunnel release consultation if severe.",
                "recovery_timeline": "Mild Carpal Tunnel / Wrist Strain: 4-6 weeks with splinting."
            }

        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx)

    @staticmethod
    def _classify_knee(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        region_id = f"{side}_KNEE_COMPLEX"
        display_name = f"{side_str} Knee Joint Complex"
        muscle = "Quadriceps Tendon, Patellar Tendon, Popliteus, Hamstring insertions"
        nerve = "Femoral, Common Peroneal, Tibial Nerves"
        tissue = "Articular Cartilage, Menisci, Cruciate & Collateral Ligaments"
        action = "Knee flexion, extension, terminal rotation"

        rf_en = "Did you experience acute high-impact trauma, inability to bear weight for 4 steps, rapid tense joint swelling within 2 hours, or is your knee hot with fever?"
        rf_hi = "क्या घुटने में कोई तेज चोट या झटका लगा है, क्या आप 4 कदम भी नहीं चल पा रहे हैं, घुटना बहुत गर्म है या तेज बुखार है?"
        rf_cond = "Acute Knee Fracture (Ottawa Knee Rules) / Ligamentous Rupture / Septic Arthritis"

        dq = [
            {"id": "Q_KNEE_LOCKING", "prompt_en": "Does your knee click, lock in place so it cannot straighten, or give way unpredictably when walking?", "prompt_hi": "क्या चलते या मोड़ते समय घुटना बीच में अटक जाता है या अचानक लचक खाकर धोखा दे देता है?"}
        ]
        tests = [
            {
                "test_id": "TEST_KNEE_AROM",
                "title": "Active Knee Flexion & Extension Kinematics",
                "instruction_en": "Sit in sagittal profile. Fully extend knee, hold 1 sec, then bend maximally under chair.",
                "instruction_hi": "पैर को पूरा सीधा आगे फैलाएं, एक पल रोकें, फिर जितना हो सके पीछे कुर्सी के नीचे मोड़ें।",
                "action_type": "VIDEO_MOVEMENT",
                "target_joint": "KNEE"
            },
            {
                "test_id": "TEST_PALPATION_KNEE",
                "title": "Targeted Joint Line & Patellar Palpation",
                "instruction_en": "Palpate medial and lateral joint lines, patellar tendon, and anserine bursa.",
                "instruction_hi": "घुटने के उस खास दर्द वाले बिंदु पर उंगली से दबाने पर 0 से 10 तक दर्द बताएं।",
                "action_type": "PALPATION_SCORE"
            }
        ]
        rx = {
            "phase1_acute": "POLICE protocol: Knee brace/sleeve if unstable, ice 20 min q3h, avoid deep squats.",
            "phase2_rehab": "Quadriceps isometrics, straight leg raises, terminal knee extension, stationary cycling.",
            "phase3_medical": "Knee X-ray if Ottawa criteria met; MRI if persistent mechanical locking (meniscal tear).",
            "recovery_timeline": "Patellofemoral Pain / Mild Sprain: 3-6 weeks; Meniscal Tear: 6-12 weeks."
        }
        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx)

    @staticmethod
    def _classify_ankle_foot(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        region_id = f"{side}_ANKLE_FOOT"
        display_name = f"{side_str} Ankle & Foot Complex"
        muscle = "Peroneals, Tibialis Posterior, Plantar Intrinsic Musculature"
        nerve = "Tibial, Deep & Superficial Peroneal, Sural Nerves"
        tissue = "ATFL, CFL, Deltoid Ligament, Plantar Fascia, Calcaneus"
        action = "Dorsiflexion, plantarflexion, inversion, eversion"

        rf_en = "Did you twist your ankle and are you unable to take 4 steps immediately and in the clinic, or is there bone tenderness at the malleolar tips/5th metatarsal base?"
        rf_hi = "क्या पैर मुड़ गया था और आप 4 कदम भी नहीं चल पा रहे हैं, या टखने की हड्डी पर छूते ही तेज दर्द होता है (ओटावा एंकल फ्रैक्चर नियम)?"
        rf_cond = "Acute Malleolar Fracture (Ottawa Ankle Rules) / Syndesmotic High Ankle Sprain"

        dq = [
            {"id": "Q_PLANTAR_FIRST_STEP", "prompt_en": "Is the heel pain sharpest with the very first steps out of bed in the morning (plantar fasciitis)?", "prompt_hi": "क्या सुबह बिस्तर से उठकर पहला कदम रखते ही एड़ी के नीचे तेज सुई जैसा दर्द होता है?"}
        ]
        tests = [
            {
                "test_id": "TEST_ANKLE_AROM",
                "title": "Active Ankle Multi-Planar Mobility Screen",
                "instruction_en": "Perform full ankle circles, maximal dorsiflexion, and plantarflexion.",
                "instruction_hi": "टखने को पूरा गोल घुमाएं और पंजे को ऊपर और नीचे मोड़ें।",
                "action_type": "VIDEO_MOVEMENT",
                "target_joint": "ANKLE"
            },
            {
                "test_id": "TEST_PALPATION_ANKLE",
                "title": "Malleolar & Plantar Fascia Palpation",
                "instruction_en": "Palpate posterior edge of lateral/medial malleolus, navicular, 5th metatarsal base, and plantar fascia origin.",
                "instruction_hi": "टखने की हड्डी और एड़ी के नीचे की नस पर दबाकर दर्द बताएं।",
                "action_type": "PALPATION_SCORE"
            }
        ]
        rx = {
            "phase1_acute": "Semi-rigid ankle brace for lateral sprain. Plantar fascia silicone heel cup. Ice bath.",
            "phase2_rehab": "Single-leg wobble board balance training, towel scrunches, calf stretching.",
            "phase3_medical": "Ankle/Foot X-ray if Ottawa criteria positive. Orthopedic referral for Grade III ligamentous disruption.",
            "recovery_timeline": "Grade 1 Sprain: 1-2 weeks; Grade 2: 3-6 weeks; Plantar Fasciitis: 6-12 weeks."
        }
        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx)

    @staticmethod
    def _classify_neck_cervical(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        region_id = "CERVICAL_SPINE"
        display_name = f"{side_str} Cervical Spine & Neck Girdle"
        muscle = "Upper Trapezius, Levator Scapulae, Sternocleidomastoid, Cervical Paraspinals"
        nerve = "Cervical Spinal Nerves (C1-C8), Spinal Accessory Nerve (CN XI)"
        tissue = "Cervical Facet Joints, Discs, Paraspinal Muscles"
        action = "Head flexion, extension, lateral tilt, rotation"

        rf_en = "Are you dropping objects, having difficulty buttoning your shirt, experiencing stumbling/gait instability, or sharp shooting shocks down your arms (Lhermitte's)?"
        rf_hi = "क्या हाथों से चीजें छूट रही हैं, शर्ट का बटन लगाने में दिक्कत हो रही है, या चलने में संतुलन लड़खड़ा रहा है (सर्वाइकल मायलोपैथी)?"
        rf_cond = "Cervical Spondylotic Myelopathy / Vertebral Artery Dissection"

        dq = [
            {"id": "Q_NECK_RADICULAR", "prompt_en": "Does tilting your head towards your painful side cause shooting electrical pain or numbness down into your fingers (Spurling's sign)?", "prompt_hi": "गर्दन को दर्द वाली तरफ थोड़ा झुकाने पर क्या बाजू में करंट या झनझनाहट जैसी तेज पीड़ा होती है?"}
        ]
        tests = [
            {
                "test_id": "TEST_CERVICAL_AROM",
                "title": "Active Cervical Flexion & Rotation Kinematics",
                "instruction_en": "Tuck chin to chest (50°), tilt head back to ceiling (60°), and rotate chin to each shoulder (80°).",
                "instruction_hi": "ठुड्डी को नीचे छाती से लगाएं, फिर ऊपर देखें, और दोनों तरफ गर्दन घुमाकर देखें।",
                "action_type": "VIDEO_MOVEMENT",
                "target_joint": "CERVICAL"
            },
            {
                "test_id": "TEST_PALPATION_CERVICAL",
                "title": "Cervical Paraspinal & Trapezius Palpation",
                "instruction_en": "Palpate cervical spinous processes (C2-C7), suboccipital notch, and levator scapulae trigger points.",
                "instruction_hi": "गर्दन की उस नस या हड्डी पर उंगली से दबाने पर 0 से 10 तक कितना दर्द होता है?",
                "action_type": "PALPATION_SCORE"
            }
        ]
        rx = {
            "phase1_acute": "Avoid prolonged static neck flexion (text neck). Use cervical ergonomic support pillow. Gentle heat.",
            "phase2_rehab": "Chin tucks (cervical retraction), deep neck flexor activation, upper trapezius stretches.",
            "phase3_medical": "Cervical spine MRI if radicular weakness; physical therapy for postural restoration.",
            "recovery_timeline": "Acute Cervical Strain / Torticollis: 1-3 weeks."
        }

        differentials = [
            "Cervical Spondylosis with Radiculopathy (गर्दन की नस दबना - हाथ में झुनझुनी व दर्द)",
            "Axial Cervico-Thoraco-Lumbar Kinetic Chain Strain (सिर पर भारी बोझ उठाने व झुककर काम करने से संपूर्ण रीढ़ में खिंचाव)",
            "Upper Trapezius & Levator Scapulae Myofascial Spasm (गर्दन व कंधे की जकड़न)",
            "Cervical Facet Syndrome & Text-Neck Postural Strain"
        ]
        pearl = "Carrying heavy loads on the head compresses the cervical spine and radiates compensatory myofascial spasm through thoracic erectors down to the lumbar and sacroiliac joints. McKenzie Chin Tucks and thoracic unloading break the entire kinetic chain spasm."

        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx, differentials, pearl)

    def _classify_head_cranium(point, normal, x, y, z, nx, ny, nz, side, side_str, aspect, aspect_str) -> Dict[str, Any]:
        region_id = "CRANIOFACIAL"
        display_name = f"{side_str} Head & Craniofacial Region"
        muscle = "Temporalis, Masseter, Frontalis, Occipitalis"
        nerve = "Trigeminal Nerve (CN V), Facial Nerve (CN VII), Greater Occipital Nerve"
        tissue = "Cranial Fascia, Temporomandibular Joint (TMJ), Epicranial Aponeurosis"
        action = "Mastication, facial expression, head stabilization"

        rf_en = "Did you experience sudden onset 'worst headache of your life' (thunderclap), head trauma with loss of consciousness, confusion, vomiting, or facial drooping/speech difficulty?"
        rf_hi = "क्या जिंदगी का सबसे तेज अचानक सिरदर्द उठा है (थंडरक्लैप), सिर पर चोट लगने के बाद बेहोशी या उल्टी हुई, या चेहरे पर लकवा/बोलने में लड़खड़ाहट है (स्ट्रोक का खतरा)?"
        rf_cond = "Subarachnoid Hemorrhage / Acute Intracranial Hemorrhage / Concussion / Stroke"

        dq = [
            {"id": "Q_HEAD_TMJ", "prompt_en": "Does opening your mouth wide or chewing trigger clicking and pain in front of your ear (TMJ)?", "prompt_hi": "क्या मुंह पूरा खोलने पर या खाना चबाते समय कान के आगे चटकने की आवाज और दर्द होता है?"}
        ]
        tests = [
            {
                "test_id": "TEST_TMJ_AROM",
                "title": "Active Jaw Opening & Cervicogenic Motion Screen",
                "instruction_en": "Open mouth smoothly (3 fingers width); screen cervical spine contribution to headache.",
                "instruction_hi": "मुंह को आराम से पूरा खोलें और बंद करें। क्या जबड़े या सिर में दर्द बढ़ता है?",
                "action_type": "QUESTION_CHOICE"
            },
            {
                "test_id": "TEST_PALPATION_CRANIAL",
                "title": "Suboccipital & Temporalis Palpation",
                "instruction_en": "Palpate bilateral temporalis, masseter, and suboccipital nerve exit points.",
                "instruction_hi": "कनपटी और सिर के पीछे के बिंदु पर दबाकर दर्द का स्तर बताएं।",
                "action_type": "PALPATION_SCORE"
            }
        ]
        rx = {
            "phase1_acute": "Emergency neuro consult if red flags. Dark quiet room, hydration, soft food diet if TMJ.",
            "phase2_rehab": "Suboccipital myofascial release, posture correction for cervicogenic headaches, jaw relaxation exercises.",
            "phase3_medical": "Dental splint for nocturnal bruxism / TMJ; neurology evaluation for migraine prophylaxis.",
            "recovery_timeline": "Tension-type / Cervicogenic: 1-2 weeks with postural intervention."
        }
        return AnatomicalPointAnalyzer._build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx)

    # --- PROFILE COMPILER ---

    @staticmethod
    def _build_profile(point, normal, side, aspect, region_id, display_name, muscle, nerve, tissue, action, rf_en, rf_hi, rf_cond, dq, tests, rx, differentials=None, pearl=None) -> Dict[str, Any]:
        return {
            "point": point,
            "normal": normal,
            "side": side,
            "aspect": aspect,
            "region_id": region_id,
            "display_name": display_name,
            "anatomical_structures": {
                "primary_muscle": muscle,
                "innervation": nerve,
                "tissue_type": tissue,
                "functional_role": action
            },
            "clinical_decisions": {
                "red_flags": {
                    "condition": rf_cond,
                    "question_en": rf_en,
                    "question_hi": rf_hi,
                    "alert_reason": f"Suspected {rf_cond}. Urgent clinician evaluation mandated.",
                    "urgency": "EMERGENCY_IMMEDIATE" if "Hemorrhage" in rf_cond or "Cardiovascular" in rf_cond or "Cauda" in rf_cond or "Compartment" in rf_cond else "URGENT_EVALUATION"
                },
                "diagnostic_questions": dq,
                "recommended_tests": tests,
                "treatment_plan": rx,
                "differential_diagnosis": differentials or [],
                "clinical_pearl": pearl or ""
            }
        }

    @staticmethod
    def generate_protocol_steps_for_point(point_analysis: Dict[str, Any]) -> List[ProtocolStepDef]:
        """
        Dynamically synthesizes an end-to-end clinical examination protocol
        tailored strictly to the selected 3D point.
        """
        decisions = point_analysis["clinical_decisions"]
        rf = decisions["red_flags"]
        rf_step = ProtocolStepDef(
            step_id=f"RED_FLAG_{point_analysis['region_id']}",
            phase="RED_FLAGS",
            title=f"{point_analysis['display_name']} - Red Flag Safety Screen",
            operator_instruction=f"Screen for emergency conditions ({rf['condition']}). If patient affirms, immediate clinical escalation is mandated.",
            patient_question=rf["question_en"],
            patient_question_hi=rf["question_hi"],
            action_type="QUESTION_BOOLEAN",
            input_config={"guidance": f"Rule out {rf['condition']}."},
            is_red_flag=True,
            abort_on_true=True,
            red_flag_alert_reason=rf["alert_reason"],
            urgency_level=rf["urgency"]
        )

        steps: List[ProtocolStepDef] = [rf_step]

        # Diagnostic question steps
        for i, q in enumerate(decisions.get("diagnostic_questions", []), 1):
            steps.append(
                ProtocolStepDef(
                    step_id=f"SYMPTOM_DIAGNOSTIC_{i}_{point_analysis['region_id']}",
                    phase="LOCALIZATION",
                    title=f"Diagnostic Assessment: {q.get('id', 'SYMPTOM')}",
                    operator_instruction="Gather detailed patient-reported onset mechanism, pain behavior, and functional limitations.",
                    patient_question=q["prompt_en"],
                    patient_question_hi=q.get("prompt_hi"),
                    action_type="QUESTION_CHOICE",
                    input_config={
                        "choices": [
                            {"value": "SUDDEN_HIGH_IMPACT", "label": "Sudden sharp onset during high-intensity or explosive movement"},
                            {"value": "BLUNT_TRAUMA_CONTUSION", "label": "Direct blunt impact or collision (contusion)"},
                            {"value": "GRADUAL_OVERUSE", "label": "Gradual repetitive overuse or postural strain"},
                            {"value": "NOCTURNAL_REST_ACHE", "label": "Constant dull ache, worse at night or with rest"}
                        ]
                    }
                )
            )

        # Recommended test steps
        for test in decisions.get("recommended_tests", []):
            if test["action_type"] == "VIDEO_MOVEMENT":
                steps.append(
                    ProtocolStepDef(
                        step_id=test["test_id"],
                        phase="ACTIVE_ROM",
                        title=test["title"],
                        operator_instruction=test["instruction_en"],
                        patient_question=test.get("instruction_en"),
                        patient_question_hi=test.get("instruction_hi"),
                        action_type="VIDEO_MOVEMENT",
                        input_config={
                            "target_joint": test.get("target_joint", "KNEE"),
                            "plane": "SAGITTAL_CORONAL",
                            "target_duration_sec": 7,
                            "sample_clip_available": True
                        }
                    )
                )
            elif test["action_type"] == "PALPATION_SCORE":
                steps.append(
                    ProtocolStepDef(
                        step_id="PALPATION_TENDERNESS",
                        phase="PALPATION",
                        title=test["title"],
                        operator_instruction=f"Palpate directly at 3D point [{point_analysis['point'].get('x'):.2f}, {point_analysis['point'].get('y'):.2f}, {point_analysis['point'].get('z'):.2f}]. Rate tenderness.",
                        patient_question=f"When direct pressure is applied to that exact point on your {point_analysis['display_name']}, how severe is the pain on a scale of 0 to 10?",
                        patient_question_hi=f"जब उस खास बिंदु पर उंगली से दबाया जाता है, तो 0 से 10 के पैमाने पर कितना दर्द महसूस होता है?",
                        action_type="PALPATION_SCORE",
                        input_config={"min_value": 0, "max_value": 10, "unit": "NRS (0-10)"}
                    )
                )
            else:
                steps.append(
                    ProtocolStepDef(
                        step_id=test["test_id"],
                        phase="FUNCTIONAL_TEST",
                        title=test["title"],
                        operator_instruction=test["instruction_en"],
                        patient_question=test.get("instruction_en"),
                        patient_question_hi=test.get("instruction_hi"),
                        action_type="QUESTION_CHOICE",
                        input_config={
                            "choices": [
                                {"value": "NEGATIVE_NORMAL", "label": "Negative: No reproduction of focal pain or functional deficit"},
                                {"value": "POSITIVE_MILD_PAIN", "label": "Positive: Mild to moderate pain reproduction without instability"},
                                {"value": "POSITIVE_SEVERE_PAIN", "label": "Positive: Severe sharp pain reproduction or gross functional giving way"}
                            ]
                        }
                    )
                )

        return steps

    @classmethod
    def analyze_pain_path(
        cls,
        points: List[Dict[str, Any]],
        path_type: str = "POINT",
        affected_side: str = "RIGHT",
        patient_calibration: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyzes a set of 3D points forming multiple painful areas or a continuous radiation line.
        Detects syndromes (e.g. Sciatica radiation, Full spine axial strain, Cervical radiculopathy, Localized joint).
        Produces compassionate, conversational doctor questions, physical movement tests, and treatments.
        """
        if not points:
            return {}

        points_detail = []
        regions_touched = set()
        y_coords = []
        x_coords = []

        for p_item in points:
            pt = p_item.get("point") if "point" in p_item else p_item
            norm = p_item.get("normal")
            p_res = cls.analyze_point(pt, norm, affected_side, enrich_llm=False)
            points_detail.append(p_res)
            regions_touched.add(p_res.get("region_id", ""))
            y_coords.append(pt.get("y", 0.0))
            x_coords.append(pt.get("x", 0.0))

        min_y = min(y_coords)
        max_y = max(y_coords)
        y_span = max_y - min_y
        is_line = (path_type == "LINE") or (len(points) >= 2 and y_span > 0.3)

        has_lumbar = any("LUMBAR" in r or "SPINE" in r for r in regions_touched) or any(0.15 <= y <= 0.4 for y in y_coords)
        has_cervical = any("CERVICAL" in r or "NECK" in r for r in regions_touched) or any(y >= 0.55 for y in y_coords)
        has_gluteal = any("GLUTEAL" in r or "PELVIS" in r or "HIP" in r for r in regions_touched) or any(-0.1 <= y <= 0.15 for y in y_coords)
        has_thigh = any("THIGH" in r for r in regions_touched) or any(-0.45 <= y <= -0.15 for y in y_coords)
        has_leg = any("LEG" in r or "CALF" in r or "ANKLE" in r or "FOOT" in r for r in regions_touched) or any(y <= -0.45 for y in y_coords)
        has_arm = any("ARM" in r or "SHOULDER" in r or "ELBOW" in r for r in regions_touched) or any(abs(x) > 0.25 and y > 0.1 for x, y in zip(x_coords, y_coords))

        # 1. Sciatica Pattern
        if (has_lumbar or has_gluteal) and (has_thigh or has_leg):
            pattern_id = "SCIATICA_L4_S1_RADICULAR_PATH"
            pattern_title_en = "Sciatic Nerve Radiation Path (L4-S1 Lumbar Disc Radiculopathy)"
            pattern_title_hi = "सायटिका - कमर से पैर तक नस दबने का रास्ता (L4-S1 डिस्क दबाव)"
            primary_region = "LUMBAR_SPINE"
            path_summary_en = f"Marked pain radiation line extends from lumbar spine / buttock into lower limb ({len(points)} points mapped). Characteristic of sciatic nerve root entrapment."
            path_summary_hi = f"दर्द की रेखा कमर/कूल्हे से लेकर जांघ व पिंडली तक फैली है ({len(points)} बिंदु चिह्नित)। यह सायटिका नस पर दबाव का स्पष्ट संकेत है।"

            doc_greeting_en = "Hello, I am Dr. AI, your orthopedic specialist. I have closely reviewed the pain line you marked running from your lower back through your buttock down your leg. Let us examine what is causing this nerve to be pinched."
            doc_greeting_hi = "नमस्ते, मैं आपका AI ऑर्थोपेडिक डॉक्टर हूँ। आपकी 3D बॉडी पर चुनी गई दर्द की लाइन (कमर से कूल्हे और पैर तक) को मैंने देखा है। आइए जांच करते हैं कि कौन सी नस दब रही है।"

            doc_questions = [
                {
                    "id": "Q_DOCTOR_SCIATICA_NATURE",
                    "prompt_en": "Does the pain feel like an electric current, burning sensation, or sharp tingling that shoots down your thigh into your calf or foot?",
                    "prompt_hi": "क्या यह दर्द करंट के झटके, जलन या तेज चुभन की तरह कमर से जांघ और पिंडली तक नीचे जाता है?",
                    "choices": [
                        {"value": "ELECTRIC_SHOOTING", "label": "Yes: Sharp electric shock / burning shooting down the leg (हाँ, करंट जैसा तेज खिंचाव नीचे जाता है)"},
                        {"value": "DULL_LOCAL_ACHE", "label": "No: Mostly a dull deep ache in hip without shooting (नहीं, केवल कूल्हे व जांघ में भारीपन रहता है)"},
                        {"value": "INTERMITTENT_NUMBNESS", "label": "Numbness and pins-and-needles in toes/sole (पैर के पंजों में सुन्नपन और चींटियां चलना)"}
                    ]
                },
                {
                    "id": "Q_DOCTOR_SCIATICA_TRIGGERS",
                    "prompt_en": "Does bending forward to touch your toes, coughing, sneezing, or sitting on a low chair trigger sharp pain in your leg?",
                    "prompt_hi": "क्या आगे झुकने, खांसने, छींकने या नीचे बैठने पर पैर में तेज दर्द बढ़ जाता है?",
                    "choices": [
                        {"value": "AGGRAVATED_BY_FLEXION_COUGH", "label": "Yes: Bending forward & coughing intensely worsens leg pain (हाँ, आगे झुकने व खांसने पर बहुत बढ़ता है)"},
                        {"value": "AGGRAVATED_BY_WALKING_ONLY", "label": "Worse while standing/walking, relieved by sitting (चलने पर पैर भर जाता है, बैठने पर आराम मिलता है)"},
                        {"value": "CONSTANT_NO_CHANGE", "label": "Constant pain regardless of posture (लगातार एक जैसा दर्द रहता है)"}
                    ]
                }
            ]

            movements = [
                {
                    "test_id": "TEST_LUMBAR_ACTIVE_FLEXION",
                    "title": "Camera-Guided Active Lumbar Flexion (Toe Touch)",
                    "instruction_en": "Stand 2-3 meters in front of the camera. Keeping your knees straight, slowly bend forward toward your toes. The AI tracks your spinal flexion and notes if leg pain increases.",
                    "instruction_hi": "कैमरे के सामने सीधे खड़े हों। घुटनों को सीधा रखते हुए धीरे-धीरे आगे झुकें और हाथ पंजों की तरफ ले जाएं।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "SPINE_LUMBAR"
                },
                {
                    "test_id": "TEST_PASSIVE_SLR_LASEGUE",
                    "title": "Straight Leg Raise Test (Lasegue's Maneuver)",
                    "instruction_en": "Lie flat on your back. Slowly raise your symptomatic leg straight up toward the ceiling without bending the knee. The camera measures if pain shoots down between 30° and 70°.",
                    "instruction_hi": "पीठ के बल सीधे लेट जाएं। घुटने को बिना मोड़े दर्द वाले पैर को ऊपर सीधा उठाएं।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "HIP"
                }
            ]

            provocative = [
                {
                    "test_id": "TEST_FAIR_PIRIFORMIS",
                    "title": "FAIR Piriformis Adduction Maneuver",
                    "instruction_en": "Lie on your back, bend your knee to 90°, and gently pull it across your body toward your opposite shoulder. Does this pinch deep in your buttock?",
                    "instruction_hi": "लेटकर घुटने को 90 डिग्री मोड़ें और विपरीत कंधे की तरफ खींचें। क्या कूल्हे के अंदर तेज दर्द होता है?",
                    "action_type": "QUESTION_CHOICE"
                }
            ]

            differentials = [
                "L4-L5 / L5-S1 Lumbar Disc Herniation with Sciatica (सायटिका - कमर से पैर तक नस दबने का तेज दर्द)",
                "Piriformis Syndrome / Deep Gluteal Sciatic Entrapment (कूल्हे की नस में खिंचाव व दबाव)",
                "Lumbar Spinal Canal Stenosis (न्यूरोजेनिक क्लॉडिकेशन - चलने पर पैरों में भारीपन)",
                "Sacroiliac (SI) Joint Dysfunction (कमर व कूल्हे के जोड़ का दर्द)"
            ]
            pearl = "Straight Leg Raise (Lasegue's) positive between 30°-70° confirms nerve root traction from a disc herniation. McKenzie prone press-ups push the disc anteriorly away from the nerve root to centralize pain out of the leg."

        # 2. Full Spine Axial Strain Pattern
        elif has_cervical and (has_lumbar or has_gluteal):
            pattern_id = "FULL_SPINE_AXIAL_STRAIN_PATH"
            pattern_title_en = "Full Spine Axial Strain & Head-Loading Syndrome"
            pattern_title_hi = "गर्दन से कमर और कूल्हे तक रीढ़ का खिंचाव (बोझा ढोने व गलत मुद्रा का दर्द)"
            primary_region = "LUMBAR_SPINE"
            path_summary_en = f"Continuous pain line mapped along the entire vertebral column ({len(points)} points). Classic presentation of axial spinal overload and paraspinal myofascial exhaustion."
            path_summary_hi = f"गर्दन से लेकर पूरी रीढ़ और कूल्हे तक लगातार दर्द की लाइन चिह्नित ({len(points)} बिंदु)। यह अत्यधिक शारीरिक भार व रीढ़ की मांसपेशियों के खिंचाव का लक्षण है।"

            doc_greeting_en = "Hello, I am Dr. AI, your orthopedic specialist. I have analyzed the extensive pain path across your entire spine, from your neck to your lower back and hips. We will evaluate your vertebral posture, muscle spasm, and spinal strain."
            doc_greeting_hi = "नमस्ते, मैं आपका AI ऑर्थोपेडिक डॉक्टर हूँ। मैंने देखा कि आपके दर्द की रेखा गर्दन से लेकर पीठ, कमर और कूल्हे तक है। आइए आपकी रीढ़ की हड्डी और मांसपेशियों के तनाव की जांच करते हैं।"

            doc_questions = [
                {
                    "id": "Q_DOCTOR_AXIAL_OCCUPATION",
                    "prompt_en": "Do you regularly carry heavy sacks or loads on your head/shoulders, or spend long hours working bent forward in farming or construction?",
                    "prompt_hi": "क्या आप सिर या कंधे पर भारी वजन/बोरी उठाते हैं, या खेतों-मजदूरी में घंटों झुककर काम करते हैं?",
                    "choices": [
                        {"value": "HEAVY_HEAD_LOADING", "label": "Yes: Regularly carry heavy loads on head / shoulders (हाँ, सिर या कंधे पर भारी वजन ढोते हैं)"},
                        {"value": "PROLONGED_BENDING", "label": "Yes: Prolonged forward stooping and heavy farm labor (हाँ, घंटों झुककर खेत या मजदूरी का काम करते हैं)"},
                        {"value": "SEDENTARY_POSTURE", "label": "No: Long hours sitting in desk/vehicle posture (नहीं, घंटों एक ही जगह बैठकर काम करते हैं)"}
                    ]
                },
                {
                    "id": "Q_DOCTOR_AXIAL_STIFFNESS",
                    "prompt_en": "Does your entire back feel stiff like a tight board when getting out of bed in the morning, requiring 20-30 minutes of warm-up?",
                    "prompt_hi": "क्या सुबह सोकर उठने पर पूरी रीढ़ रस्सी या तख्ते जैसी अकड़ी हुई महसूस होती है, जिसे सामान्य होने में 20-30 मिनट लगते हैं?",
                    "choices": [
                        {"value": "MORNING_STIFFNESS_MARKED", "label": "Yes: Severe morning stiffness, feels tight until moving (हाँ, सुबह पूरी पीठ अकड़ी रहती है)"},
                        {"value": "EVENING_FATIGUE_WORSE", "label": "Worse in the evening after hard physical work (शाम को काम करने के बाद दर्द ज्यादा बढ़ता है)"},
                        {"value": "MILD_DISCOMFORT", "label": "Mild dull tightness throughout the day (दिनभर हल्का भारीपन बना रहता है)"}
                    ]
                }
            ]

            movements = [
                {
                    "test_id": "TEST_SPINE_CERVICOTHORACIC_ROTATION",
                    "title": "Active Cervical & Thoracic Spinal Rotation",
                    "instruction_en": "Stand facing the camera with feet shoulder-width apart. Slowly rotate your head and upper body fully to the left, then fully to the right. MediaPipe measures rotational symmetry.",
                    "instruction_hi": "कैमरे के सामने सीधे खड़े हों। धीरे-धीरे गर्दन और ऊपरी धड़ को पहले पूरी तरह बाईं ओर, फिर दाईं ओर घुमाएं।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "SPINE_THORACIC"
                },
                {
                    "test_id": "TEST_LUMBAR_ACTIVE_EXTENSION",
                    "title": "Standing Lumbar Spinal Extension (Backward Arch)",
                    "instruction_en": "Place your hands on your hips and gently arch your spine backward while facing the camera. Note if this relieves muscular tightness.",
                    "instruction_hi": "हाथों को कमर पर रखें और धीरे-धीरे पीछे की तरफ झुकें। रीढ़ को पीछे मोड़कर खिंचाव महसूस करें।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "SPINE_LUMBAR"
                }
            ]

            provocative = [
                {
                    "test_id": "TEST_PARASPINAL_PALPATION_AXIAL",
                    "title": "Full Spine Paraspinal Trigger Point Palpation",
                    "instruction_en": "Apply firm thumb pressure along the muscular gutters on both sides of the spine from upper back to lower back. Rate maximum focal tenderness.",
                    "instruction_hi": "रीढ़ की हड्डी के दोनों तरफ मांसपेशियों पर उंगली से दबाएं। सबसे तेज दर्द का स्कोर 0 से 10 के बीच बताएं।",
                    "action_type": "PALPATION_SCORE"
                }
            ]

            differentials = [
                "Full Spine Axial Strain & Head-Loading Syndrome (रीढ़ की हड्डी का संपूर्ण खिंचाव व मांसपेशियों की थकान)",
                "Cervicothoracolumbar Postural Dysfunctional Syndrome (गलत मुद्रा व भारी काम का दर्द)",
                "Diffuse Paraspinal Myofascial Pain Syndrome (पीठ की मांसपेशियों में गांठे व अकड़न)",
                "Lumbar Spondylosis with Associated Cervical Strain (गर्दन व कमर का संयुक्त घिसाव)"
            ]
            pearl = "In manual laborers and agricultural workers, simultaneous neck and lumbar pain without lower leg neurological deficits is typically axial muscle exhaustion. Treatment focuses on spinal decompression, magnesium/calcium nutrition, and thiocolchicoside muscle relaxation."

        # 3. Cervical Brachial Radiation Pattern
        elif has_cervical and has_arm:
            pattern_id = "CERVICAL_BRACHIAL_RADIATION_PATH"
            pattern_title_en = "Cervical Radiculopathy & Brachial Plexus Strain"
            pattern_title_hi = "सर्वाइकल - गर्दन से कंधे और हाथ तक नस दबने का दर्द"
            primary_region = "CERVICAL_SPINE"
            path_summary_en = f"Radiation line tracked from cervical spine into upper extremity ({len(points)} points mapped). Indicates C5-C7 cervical nerve root impingement."
            path_summary_hi = f"गर्दन से कंधे और हाथ तक दर्द का रास्ता चिह्नित ({len(points)} बिंदु)। यह गर्दन की नस (C5-C7) दबने का लक्षण है।"

            doc_greeting_en = "Hello, I am Dr. AI. I notice the pain line radiates from your cervical spine down your arm. Let us check for cervical disc compression or brachial nerve irritation."
            doc_greeting_hi = "नमस्ते, मैं आपका AI डॉक्टर हूँ। आपकी गर्दन से कंधे व हाथ तक नस का खिंचाव दिख रहा है। आइए जांच करते हैं कि कौन सी नस दब रही है।"

            doc_questions = [
                {
                    "id": "Q_DOCTOR_CERVICAL_PINS",
                    "prompt_en": "Do you experience tingling, pins-and-needles, or numbness in your fingers or forearm when turning your neck?",
                    "prompt_hi": "क्या गर्दन घुमाने पर हाथ की उंगलियों में झनझनाहट, सुन्नपन या चींटियां चलने जैसा लगता है?",
                    "choices": [
                        {"value": "PINS_IN_FINGERS", "label": "Yes: Tingling & numbness in fingers/hand (हाँ, उंगलियों व हाथ में झनझनाहट होती है)"},
                        {"value": "SHOULDER_ACHE_ONLY", "label": "No: Pain is localized to neck & top of shoulder (नहीं, केवल गर्दन व कंधे के ऊपर दर्द है)"}
                    ]
                }
            ]

            movements = [
                {
                    "test_id": "TEST_CERVICAL_ACTIVE_ROTATION",
                    "title": "Active Cervical Range of Motion & Spurling",
                    "instruction_en": "Slowly rotate your head to the symptomatic side and tilt back slightly. Camera tracks lateral flexion angle.",
                    "instruction_hi": "गर्दन को धीरे-धीरे दर्द वाली तरफ घुमाएं और हल्का पीछे झुकाएं।",
                    "action_type": "VIDEO_MOVEMENT",
                    "target_joint": "CERVICAL_SPINE"
                }
            ]
            provocative = []
            differentials = [
                "C5-C7 Cervical Disc Radiculopathy (गर्दन की नस दबना)",
                "Cervical Spondylosis with Trapezius Myospasm (गर्दन का घिसाव व अकड़न)",
                "Thoracic Outlet Syndrome (कंधे के पास नसों का दबाव)"
            ]
            pearl = "Spurling's maneuver (cervical extension and lateral rotation) narrowing the neural foramen confirms cervical nerve root impingement. McKenzie chin tucks relieve anterior disc pressure."

        # 4. Multi-Focal General Pattern
        else:
            first_analysis = points_detail[0]
            pattern_id = f"MULTI_POINT_{first_analysis.get('region_id', 'GENERAL')}"
            pattern_title_en = f"Multi-Focal Pain Pattern: {first_analysis.get('display_name', 'Target Region')}"
            pattern_title_hi = f"चिह्नित दर्द क्षेत्र: {first_analysis.get('display_name', 'शरीर का भाग')}"
            primary_region = first_analysis.get("region_id", "LUMBAR_SPINE")
            path_summary_en = f"{len(points)} distinct pain points localized on the 3D model. Tailored clinical evaluation active."
            path_summary_hi = f"3D मॉडल पर {len(points)} दर्द के बिंदु चिह्नित किए गए। विस्तृत डॉक्टर जांच तैयार है।"

            doc_greeting_en = f"Hello, I am Dr. AI. I have reviewed the {len(points)} painful locations you marked on your {first_analysis.get('display_name')}. Let us examine the cause of your discomfort."
            doc_greeting_hi = f"नमस्ते, मैं आपका AI डॉक्टर हूँ। आपके द्वारा शरीर पर चिह्नित {len(points)} दर्द के बिंदुओं को मैंने देखा है। आइए आपकी स्थिति की विस्तृत जांच करते हैं।"

            doc_questions = first_analysis.get("clinical_decisions", {}).get("diagnostic_questions", [])
            movements = [t for t in first_analysis.get("clinical_decisions", {}).get("recommended_tests", []) if t.get("action_type") == "VIDEO_MOVEMENT"]
            provocative = [t for t in first_analysis.get("clinical_decisions", {}).get("recommended_tests", []) if t.get("action_type") != "VIDEO_MOVEMENT"]
            differentials = first_analysis.get("clinical_decisions", {}).get("differential_diagnosis", [])
            pearl = first_analysis.get("clinical_decisions", {}).get("clinical_pearl", "")

        # Always add guided palpation for each marked point
        for i, pt_detail in enumerate(points_detail, 1):
            pt_coord = pt_detail.get("point", {})
            provocative.append({
                "test_id": f"TEST_PALPATION_POINT_{i}",
                "title": f"Focal Palpation: Point #{i} ({pt_detail.get('display_name', 'Target')})",
                "instruction_en": f"Gently press on marked Point #{i} at [{pt_coord.get('x', 0):.2f}, {pt_coord.get('y', 0):.2f}, {pt_coord.get('z', 0):.2f}]. Rate the tenderness from 0 to 10.",
                "instruction_hi": f"चिह्नित बिंदु #{i} पर धीरे से उंगली दबाएं और दर्द का स्तर 0 से 10 के बीच बताएं।",
                "action_type": "PALPATION_SCORE",
                "input_config": {"min_value": 0, "max_value": 10, "unit": "NRS (0-10)"}
            })

        return {
            "pattern_id": pattern_id,
            "pattern_title_en": pattern_title_en,
            "pattern_title_hi": pattern_title_hi,
            "is_radiation_line": is_line,
            "total_points": len(points),
            "primary_region": primary_region,
            "affected_side": affected_side,
            "path_summary_en": path_summary_en,
            "path_summary_hi": path_summary_hi,
            "doctor_consultation_greeting_en": doc_greeting_en,
            "doctor_consultation_greeting_hi": doc_greeting_hi,
            "doctor_questions": doc_questions,
            "recommended_physical_movements": movements,
            "provocative_tests": provocative,
            "differential_diagnosis": differentials,
            "clinical_pearl": pearl,
            "points_detail": points_detail
        }

    @classmethod
    def generate_protocol_steps_for_path(cls, path_analysis: Dict[str, Any]) -> List[ProtocolStepDef]:
        """
        Synthesizes examination steps for a multi-point or radiation path examination,
        structured as an empathetic, authentic doctor consultation:
        1. Doctor Greeting & Clinical History (Doctor asks questions)
        2. Red-Flag Emergency Screening
        3. Real Camera-Guided Physical Movements (MediaPipe CV Kinematics)
        4. Provocative Orthopedic Tests (SLR, FAIR, etc.)
        5. Guided Landmark Palpation
        """
        steps: List[ProtocolStepDef] = []
        reg_id = path_analysis.get("primary_region", "CUSTOM_PATH")

        # Step 1: Doctor Consultation Ingestion & Symptoms
        for i, q in enumerate(path_analysis.get("doctor_questions", []), 1):
            choices = q.get("choices")
            if not choices:
                choices = [
                    {"value": "YES_SEVERE", "label": "Yes: Severe pain / pronounced limitation (हाँ, बहुत तेज दर्द है)"},
                    {"value": "MODERATE_INTERMITTENT", "label": "Moderate / Intermittent discomfort (हल्का या बीच-बीच में होता है)"},
                    {"value": "NO_NONE", "label": "No / Not present (नहीं, ऐसा नहीं होता)"}
                ]
            steps.append(
                ProtocolStepDef(
                    step_id=f"DOCTOR_CONSULT_{i}_{reg_id}",
                    phase="LOCALIZATION",
                    title=f"👨‍⚕️ Doctor Consultation: {q.get('id', 'SYMPTOM')}",
                    operator_instruction=f"Doctor asks: {q.get('prompt_en')}",
                    patient_question=q.get("prompt_en"),
                    patient_question_hi=q.get("prompt_hi"),
                    action_type="QUESTION_CHOICE",
                    input_config={"choices": choices}
                )
            )

        # Step 2: Red Flag Safety Screen
        steps.append(
            ProtocolStepDef(
                step_id=f"RED_FLAG_{reg_id}",
                phase="RED_FLAGS",
                title=f"Safety Screening: Rule Out Emergency Spinal / Vascular Conditions",
                operator_instruction="Screen for emergency neurological compromise (cauda equina, fracture, infection).",
                patient_question="Do you have any loss of bowel or bladder control, numbness in the groin/saddle area, fever, or sudden leg giving way?",
                patient_question_hi="क्या मल-मूत्र पर नियंत्रण खोना, जांघों के बीच सुन्नपन, तेज बुखार या पैर का अचानक लड़खड़ाना महसूस हुआ है?",
                action_type="QUESTION_BOOLEAN",
                input_config={"guidance": "Rule out Cauda Equina Syndrome / Severe Neurological Compression."},
                is_red_flag=True,
                abort_on_true=True,
                red_flag_alert_reason="Suspected Cauda Equina Syndrome or Acute Neurological Emergency",
                urgency_level="EMERGENCY_IMMEDIATE_ER"
            )
        )

        # Step 3: Camera-Guided Physical Movements (Real Video Kinematics)
        for mov in path_analysis.get("recommended_physical_movements", []):
            steps.append(
                ProtocolStepDef(
                    step_id=mov["test_id"],
                    phase="ACTIVE_ROM",
                    title=f"🏃 Physical Movement Test: {mov['title']}",
                    operator_instruction=mov.get("instruction_en", "Perform physical movement in front of camera."),
                    patient_question=f"Doctor instructs: {mov.get('instruction_en')}",
                    patient_question_hi=f"डॉक्टर निर्देश: {mov.get('instruction_hi')}",
                    action_type="VIDEO_MOVEMENT",
                    input_config={
                        "target_joint": mov.get("target_joint", "SPINE_LUMBAR"),
                        "plane": "SAGITTAL_CORONAL",
                        "target_duration_sec": 7,
                        "sample_clip_available": True
                    }
                )
            )

        # Step 4: Provocative Tests & Landmark Palpations
        for prov in path_analysis.get("provocative_tests", []):
            if prov.get("action_type") == "PALPATION_SCORE":
                steps.append(
                    ProtocolStepDef(
                        step_id=prov["test_id"],
                        phase="PALPATION",
                        title=f"📍 {prov['title']}",
                        operator_instruction=prov.get("instruction_en", "Apply pressure and score tenderness."),
                        patient_question=prov.get("instruction_en"),
                        patient_question_hi=prov.get("instruction_hi"),
                        action_type="PALPATION_SCORE",
                        input_config={"min_value": 0, "max_value": 10, "unit": "NRS (0-10)"}
                    )
                )
            else:
                steps.append(
                    ProtocolStepDef(
                        step_id=prov["test_id"],
                        phase="FUNCTIONAL_TEST",
                        title=f"🔬 {prov['title']}",
                        operator_instruction=prov.get("instruction_en", "Perform provocative orthopedic maneuver."),
                        patient_question=prov.get("instruction_en"),
                        patient_question_hi=prov.get("instruction_hi"),
                        action_type="QUESTION_CHOICE",
                        input_config={
                            "choices": [
                                {"value": "NEGATIVE_NORMAL", "label": "Negative: No reproduction of radiating pain (सामान्य - दर्द नहीं हुआ)"},
                                {"value": "POSITIVE_MILD_PAIN", "label": "Positive: Mild radiating pain reproduced (हल्का दर्द पैर में गया)"},
                                {"value": "POSITIVE_SEVERE_PAIN", "label": "Positive: Severe shooting electric shock reproduced (तेज करंट जैसा दर्द उठा)"}
                            ]
                        }
                    )
                )

        return steps

point_analyzer = AnatomicalPointAnalyzer()
