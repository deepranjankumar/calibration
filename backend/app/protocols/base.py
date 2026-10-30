from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

@dataclass
class ProtocolStepDef:
    step_id: str
    phase: str # RED_FLAGS, LOCALIZATION, ACTIVE_ROM, FUNCTIONAL_TEST, PALPATION, SYNTHESIS
    title: str
    operator_instruction: str
    patient_question: Optional[str]
    action_type: str # QUESTION_BOOLEAN, QUESTION_CHOICE, VIDEO_MOVEMENT, PALPATION_SCORE
    patient_question_hi: Optional[str] = None
    input_config: Dict[str, Any] = field(default_factory=dict)
    
    # State machine transition logic
    is_red_flag: bool = False
    abort_on_true: bool = False
    red_flag_alert_reason: Optional[str] = None
    urgency_level: Optional[str] = None
