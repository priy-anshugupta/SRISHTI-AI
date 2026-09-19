from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from backend.integrations.ertmac import ertmac_stream

router = APIRouter(prefix="/api/telemetry", tags=["eRTMAC Deterministic Telemetry Replay"])

class ScrubRequest(BaseModel):
    frame_index: Optional[int] = None
    depth_md: Optional[float] = None

class PlaybackRequest(BaseModel):
    play: bool

@router.get("/current")
def get_current_telemetry():
    return ertmac_stream.get_current_frame()

@router.post("/step")
def step_telemetry():
    return ertmac_stream.step_forward()

@router.post("/scrub")
def scrub_telemetry(req: ScrubRequest):
    if req.frame_index is not None:
        return ertmac_stream.set_frame_index(req.frame_index)
    elif req.depth_md is not None:
        # Find nearest frame
        nearest_idx = 0
        min_diff = 999999.0
        for i, f in enumerate(ertmac_stream.frames):
            diff = abs(f["depth_md"] - req.depth_md)
            if diff < min_diff:
                min_diff = diff
                nearest_idx = i
        return ertmac_stream.set_frame_index(nearest_idx)
    return ertmac_stream.get_current_frame()

@router.post("/reset")
def reset_telemetry():
    return ertmac_stream.reset()

@router.post("/playback")
def toggle_playback(req: PlaybackRequest):
    return ertmac_stream.toggle_play(req.play)
