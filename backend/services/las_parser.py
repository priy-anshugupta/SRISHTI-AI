"""
SRISHTI·AI — LAS (Log ASCII Standard v2.0) Parser & Wireline Log Engine
Parses standard LAS wireline and LWD well logs (Gamma Ray, Deep Resistivity, Sonic, Caliper)
and provides automated formation top correlation for Upper Assam stratigraphy.
"""

from typing import Dict, List, Any, Optional
import re
import math

class LasLogParser:
    """Parses LAS 2.0 files into structured JSON with depth-indexed curve tracks."""

    @staticmethod
    def parse_las_text(las_content: str) -> Dict[str, Any]:
        lines = [line.strip() for line in las_content.splitlines()]
        
        sections = {}
        current_section = None
        current_lines = []

        for line in lines:
            if not line or line.startswith("#"):
                continue
            if line.startswith("~"):
                if current_section:
                    sections[current_section] = current_lines
                current_section = line[1:].split()[0].upper()
                current_lines = []
            else:
                if current_section:
                    current_lines.append(line)
        if current_section:
            sections[current_section] = current_lines

        # Parse ~WELL information
        well_info = {}
        for line in sections.get("WELL", sections.get("W", [])):
            match = re.match(r"([A-Za-z0-9_]+)\s*\.\s*([^:]*):\s*(.*)", line)
            if match:
                mnemonic = match.group(1).strip()
                val = match.group(2).strip()
                desc = match.group(3).strip()
                well_info[mnemonic] = val or desc

        # Parse ~CURVE information
        curves = []
        for line in sections.get("CURVE", sections.get("C", [])):
            match = re.match(r"([A-Za-z0-9_]+)\s*\.\s*([A-Za-z0-9_/]*)\s*:\s*(.*)", line)
            if match:
                curves.append({
                    "mnemonic": match.group(1).strip().upper(),
                    "unit": match.group(2).strip(),
                    "description": match.group(3).strip()
                })

        # Parse ~A (ASCII log data points)
        data_lines = sections.get("A", sections.get("ASCII", []))
        curve_mnemonics = [c["mnemonic"] for c in curves] if curves else ["DEPTH", "GR", "RT", "DT", "CALI"]
        
        log_records = []
        for line in data_lines:
            tokens = line.split()
            if not tokens:
                continue
            record = {}
            for idx, token in enumerate(tokens):
                if idx < len(curve_mnemonics):
                    try:
                        val = float(token)
                        # Null values in LAS are typically -999.25
                        record[curve_mnemonics[idx]] = None if val <= -999.0 else round(val, 2)
                    except ValueError:
                        record[curve_mnemonics[idx]] = None
            if record.get("DEPTH") is not None or record.get("DEPT") is not None:
                log_records.append(record)

        return {
            "well_name": well_info.get("WELL", "UNKNOWN_WELL"),
            "field": well_info.get("FLD", "Upper Assam"),
            "company": well_info.get("COMP", "Oil India Limited"),
            "start_depth": well_info.get("STRT", log_records[0].get("DEPTH", 0) if log_records else 0),
            "stop_depth": well_info.get("STOP", log_records[-1].get("DEPTH", 0) if log_records else 0),
            "step": well_info.get("STEP", "0.5"),
            "curves": curves,
            "data_count": len(log_records),
            "records": log_records[:300]  # Return up to 300 sampled points for smooth canvas rendering
        }

    @staticmethod
    def generate_synthetic_upper_assam_las(well_name: str = "MORAN-29", start_depth: float = 2380.0, stop_depth: float = 2460.0) -> str:
        """
        Generates realistic Upper Assam wireline LAS 2.0 data spanning Barail carbonaceous interval.
        Includes Gamma Ray (clean sand vs shale baseline), Deep Resistivity (hydrocarbon kick indication),
        Sonic Transit Time, and Caliper.
        """
        las_lines = [
            "~VERSION INFORMATION",
            " VERS.   2.0 :   CWLS LOG ASCII STANDARD - VERSION 2.0",
            " WRAP.    NO :   ONE LINE PER DEPTH STEP",
            "~WELL INFORMATION",
            f" WELL.   {well_name} : WELL NAME",
            " FLD .   Moran : FIELD NAME",
            " COMP.   Oil India Limited : OPERATOR",
            " CTRY.   India : COUNTRY",
            f" STRT.   {start_depth} : START DEPTH (M)",
            f" STOP.   {stop_depth} : STOP DEPTH (M)",
            " STEP.   0.5000 : STEP (M)",
            " NULL.   -999.2500 : NULL VALUE",
            "~CURVE INFORMATION",
            " DEPT    .M        : 1  DEPTH",
            " GR      .GAPI     : 2  GAMMA RAY LOG (0-150 GAPI)",
            " RT      .OHMM     : 3  TRUE FORMATION DEEP RESISTIVITY",
            " DT      .US/M     : 4  COMPRESSIONAL SONIC SLOWNESS",
            " CALI    .IN       : 5  BOREHOLE CALIPER (BIT SIZE 8.5 IN)",
            "~PARAMETER INFORMATION",
            " BVO     .KCL-POLYMER : MUD BASE SYSTEM",
            " BHT     .DEG C   112 : BOTTOM HOLE TEMPERATURE",
            "~A"
        ]

        depth = start_depth
        while depth <= stop_depth:
            # Barail carbonaceous transition: shale (GR ~95), gas sand (GR ~38, RT spike to 45 ohm-m)
            is_sand = 2445.0 <= depth <= 2454.0
            
            if is_sand:
                gr = 35.0 + 8.0 * math.sin(depth * 2.0)
                rt = 42.0 + 15.0 * math.cos(depth * 3.0)  # High resistivity pay / gas sand
                dt = 245.0 + 15.0 * math.sin(depth)
                cali = 8.65
            else:
                gr = 92.0 + 14.0 * math.sin(depth * 1.5)
                rt = 4.5 + 2.0 * math.cos(depth * 1.2)   # Conductive shale
                dt = 295.0 + 20.0 * math.cos(depth)
                cali = 9.1 + 0.3 * math.sin(depth)     # Minor shale washout

            las_lines.append(f"  {depth:.1f}   {gr:.2f}   {rt:.2f}   {dt:.2f}   {cali:.2f}")
            depth += 0.5

        return "\n".join(las_lines)
