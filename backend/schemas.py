from pydantic import BaseModel, Field
from typing import Literal


class WellCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    external_id: str | None = Field(default=None, max_length=80)
    field: str | None = Field(default=None, max_length=120)
    block: str | None = Field(default=None, max_length=120)
    status: str = "PLANNING"
    well_type: str | None = None
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    target_depth_md_m: float | None = Field(default=None, gt=0)


class AlertAcknowledge(BaseModel):
    action_taken: str = Field(min_length=3, max_length=2000)


class AskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=2000)
    well_id: str | None = None
    language: Literal["en", "hi"] = "en"


class EventCandidate(BaseModel):
    event_type: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    depth_from_md_m: float
    depth_to_md_m: float | None = None
    formation: str | None = None
    description: str
    mitigation: str | None = None
    page_number: int


class TelemetrySampleIn(BaseModel):
    observed_at: str
    measured_depth_m: float = Field(gt=0)
    tvd_m: float | None = None
    rop_m_per_hr: float | None = Field(default=None, ge=0)
    wob_klbs: float | None = Field(default=None, ge=0)
    rpm: float | None = Field(default=None, ge=0)
    spp_psi: float | None = Field(default=None, ge=0)
    torque_ft_lbs: float | None = Field(default=None, ge=0)
    mud_weight_ppg: float | None = Field(default=None, ge=0)
    source: str = Field(min_length=2, max_length=80)


class CandidateReviewIn(BaseModel):
    decision: Literal["APPROVED", "REJECTED", "CORRECTED"]
    well_id: str | None = None
    formation_id: str | None = None
    corrected_payload: dict | None = None
