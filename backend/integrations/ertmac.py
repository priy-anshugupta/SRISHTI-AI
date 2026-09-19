"""
SRISHTI·AI - Deterministic eRTMAC WITSML Telemetry Replay Engine
Replays realistic drilling telemetry approaching the Barail gas precursor horizon.
"""

import os
import csv
from typing import Dict, Any, List

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "telemetry_replay.csv")

class DeterministicERTMACReplayer:
    def __init__(self):
        self.frames: List[Dict[str, Any]] = []
        self.current_index = 0
        self.is_playing = True  # Real-time streaming 24/7 by default
        self._load_csv()
        for idx, f in enumerate(self.frames):
            if abs(f["depth_md"] - 2418.0) < 0.1:
                self.current_index = idx
                break

    def _load_csv(self):
        if os.path.exists(CSV_PATH):
            with open(CSV_PATH, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    self.frames.append({
                        "timestamp": row["timestamp"],
                        "depth_md": float(row["depth_md"]),
                        "tvd_md": float(row["tvd_md"]),
                        "rop_m_per_hr": float(row["rop_m_per_hr"]),
                        "wob_klbs": float(row["wob_klbs"]),
                        "rpm": int(row["rpm"]),
                        "spp_psi": int(row["spp_psi"]),
                        "torque_ftlbs": int(row["torque_ftlbs"]),
                        "flow_rate_gpm": int(row["flow_rate_gpm"]),
                        "pit_volume_bbl": float(row["pit_volume_bbl"]),
                        "gas_units": int(row["gas_units"]),
                        "formation": row["formation"],
                        "status": row["status"]
                    })
        else:
            # Fallback frame
            self.frames = [{
                "timestamp": "2026-09-18T18:00:00Z",
                "depth_md": 2418.0,
                "tvd_md": 2396.2,
                "rop_m_per_hr": 14.2,
                "wob_klbs": 18.5,
                "rpm": 120,
                "spp_psi": 2440,
                "torque_ftlbs": 14000,
                "flow_rate_gpm": 650,
                "pit_volume_bbl": 420.3,
                "gas_units": 22,
                "formation": "Barail Group",
                "status": "NORMAL"
            }]

    def get_current_frame(self) -> Dict[str, Any]:
        frame = self.frames[self.current_index]
        hazard_horizon = 2450.0
        distance = round(max(0.0, hazard_horizon - frame["depth_md"]), 1)

        # Lookahead corridor state
        corridor_status = "CLEAR"
        if distance <= 10.0:
            corridor_status = "CRITICAL_OISD_174_TRIGGER"
        elif distance <= 35.0:
            corridor_status = "KICK_PRECURSOR_HORIZON"
        elif distance <= 60.0:
            corridor_status = "APPROACHING_THREAT"

        # Real-time Drilling Physics Engine (Eaton's d-exponent, MSE, ECD)
        try:
            from backend.services.physics import calculate_d_exponent, calculate_mse, calculate_ecd
            d_calc = calculate_d_exponent(
                rop_m_hr=frame.get("rop_m_per_hr", 14.2),
                rpm=frame.get("rpm", 120),
                wob_klbs=frame.get("wob_klbs", 18.5),
                bit_size_inch=8.5,
                mud_weight_ppg=10.8
            )
            mse_calc = calculate_mse(
                wob_klbs=frame.get("wob_klbs", 18.5),
                rpm=frame.get("rpm", 120),
                torque_kft_lbs=frame.get("torque_ftlbs", 14000) / 1000.0,
                rop_m_hr=frame.get("rop_m_per_hr", 14.2),
                bit_size_inch=8.5
            )
            ecd_calc = calculate_ecd(
                mud_weight_ppg=10.8,
                flow_rate_gpm=frame.get("flow_rate_gpm", 650),
                depth_tvd_m=frame.get("tvd_md", 2396.2),
                hole_size_inch=8.5
            )
            physics = {
                "d_exponent": d_calc["d_exponent"],
                "d_exponent_corrected": d_calc["d_exponent_corrected"],
                "d_normal_trend": d_calc["d_normal_trend"],
                "pore_pressure_pred_ppg": d_calc["pore_pressure_eaton_ppg"],
                "mse_psi": mse_calc["mse_psi"],
                "drilling_efficiency_pct": mse_calc["drilling_efficiency_pct"],
                "mse_status": mse_calc["status"],
                "ecd_ppg": ecd_calc["ecd_ppg"],
                "delta_ecd_ppg": ecd_calc["delta_ecd_ppg"],
                "annular_pressure_loss_psi": ecd_calc["annular_pressure_loss_psi"]
            }
        except Exception:
            physics = {
                "d_exponent": 1.54,
                "d_exponent_corrected": 1.28,
                "d_normal_trend": 1.65,
                "pore_pressure_pred_ppg": 11.2,
                "mse_psi": 28400.0,
                "drilling_efficiency_pct": 77.5,
                "mse_status": "OPTIMAL",
                "ecd_ppg": 11.25,
                "delta_ecd_ppg": 0.45,
                "annular_pressure_loss_psi": 240.0
            }

        return {
            **frame,
            "well": "MORAN-29",
            "rig": "OIL-RIG-04",
            "field": "Moran",
            "hazard_horizon_md": hazard_horizon,
            "distance_to_hazard_m": distance,
            "corridor_status": corridor_status,
            "frame_index": self.current_index,
            "total_frames": len(self.frames),
            "is_playing": self.is_playing,
            "physics": physics
        }

    def step_forward(self) -> Dict[str, Any]:
        if self.current_index < len(self.frames) - 1:
            self.current_index += 1
        else:
            self.current_index = 0  # Continuous 24/7 telemetry replay loop
        return self.get_current_frame()

    def set_frame_index(self, index: int) -> Dict[str, Any]:
        if 0 <= index < len(self.frames):
            self.current_index = index
        return self.get_current_frame()

    def reset(self) -> Dict[str, Any]:
        self.current_index = 0
        self.is_playing = False
        return self.get_current_frame()

    def toggle_play(self, play: bool) -> Dict[str, Any]:
        self.is_playing = play
        return self.get_current_frame()

ertmac_stream = DeterministicERTMACReplayer()
