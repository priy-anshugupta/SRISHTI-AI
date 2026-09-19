"""Minimal WITSML 1.4.1 log parser for an authenticated adapter boundary.

It deliberately maps only recognised mnemonics and returns no data when the log
header/rows cannot be validated. Field-specific mappings belong in OIL's approved
integration configuration, not in an LLM prompt.
"""
from __future__ import annotations

from datetime import datetime, timezone
from xml.etree import ElementTree as ET


CHANNELS = {
    "MD": "measured_depth_m", "DEPT": "measured_depth_m", "TVD": "tvd_m", "ROP": "rop_m_per_hr",
    "WOB": "wob_klbs", "RPM": "rpm", "SPP": "spp_psi", "TORQUE": "torque_ft_lbs", "MW": "mud_weight_ppg",
}


def _text(node: ET.Element, name: str) -> str | None:
    match = node.find(f".//{{*}}{name}")
    return match.text.strip() if match is not None and match.text else None


def parse_witsml_log(xml_payload: bytes) -> list[dict]:
    root = ET.fromstring(xml_payload)
    mnemonic_list = _text(root, "mnemonicList")
    data_list = _text(root, "data")
    if not mnemonic_list or not data_list:
        return []
    mnemonics = [part.strip().upper() for part in mnemonic_list.split(",")]
    samples: list[dict] = []
    for row in data_list.splitlines():
        values = [part.strip() for part in row.split(",")]
        if len(values) != len(mnemonics):
            continue
        sample: dict[str, float | str] = {"observed_at": datetime.now(timezone.utc).isoformat(), "source": "WITSML_1_4_1"}
        for mnemonic, value in zip(mnemonics, values):
            field = CHANNELS.get(mnemonic)
            if not field or not value:
                continue
            try:
                sample[field] = float(value)
            except ValueError:
                continue
        if "measured_depth_m" in sample:
            samples.append(sample)
    return samples
