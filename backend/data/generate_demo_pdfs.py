"""
SRISHTI·AI - Generate Authentic Sample PDF Documents for SIH Hackathon Live Demos
Creates clean, professional, multi-page PDFs with real Upper Assam drilling content.
"""
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

DEMO_DIRS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "demo-files")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "demo-files")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "samples"))
]

for d in DEMO_DIRS:
    os.makedirs(d, exist_ok=True)

styles = getSampleStyleSheet()
title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=15, textColor=colors.HexColor('#0F172A'), spaceAfter=4)
subtitle_style = ParagraphStyle('SubTitleStyle', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#475569'), spaceAfter=10)
section_style = ParagraphStyle('SectionStyle', parent=styles['Heading2'], fontSize=11, textColor=colors.HexColor('#0284C7'), spaceBefore=8, spaceAfter=4)
body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#1E293B'), leading=13)
highlight_style = ParagraphStyle('HighlightStyle', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#9A3412'), leading=13, backColor=colors.HexColor('#FEF3C7'))

def generate_wcr_moran():
    for out_dir in DEMO_DIRS:
        pdf_path = os.path.join(out_dir, "Sample_WCR_Moran_7.pdf")
        doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []

        # Header
        story.append(Paragraph("OIL INDIA LIMITED — DRILLING DIRECTORATE", title_style))
        story.append(Paragraph("DULIAJAN, ASSAM · WELL COMPLETION REPORT (WCR) · SECTION 8", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceAfter=10))

        # Well Info Table
        well_data = [
            ["Well Name:", "MORAN-7 (MOR-07)", "Field / Block:", "Moran PML (MOR-I)"],
            ["Spud Date:", "10-MAR-2018", "TD Reached:", "22-AUG-2018 (3,450.0m MD)"],
            ["Rig Assigned:", "OIL-RIG-01 (2000 HP AC-SCR)", "Status:", "COMPLETED PRODUCER"],
            ["Target Horizon:", "Barail Group / Tipam Sandstone", "Classification:", "RESTRICTED SUBSURFACE ASSET"]
        ]
        t = Table(well_data, colWidths=[110, 160, 110, 160])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#334155')),
        ]))
        story.append(t)
        story.append(Spacer(1, 12))

        # Section 4: Stratigraphy
        story.append(Paragraph("SECTION 4: GEOLOGICAL STRATIGRAPHY & FORMATION TOPS", section_style))
        strat_data = [
            ["Formation Name", "Depth Top (m MD)", "Depth Base (m MD)", "Lithology & Characteristics"],
            ["Alluvium / Dihing", "0.0 m", "290.0 m", "Unconsolidated sand, gravel, surface water table"],
            ["Dhekiajuli Formation", "290.0 m", "790.0 m", "Coarse friable sands, pebble beds, seepage zone"],
            ["Namsang Formation", "790.0 m", "1,490.0 m", "Sandstones with interbedded soft claystone layers"],
            ["Girujan Clay Formation", "1,490.0 m", "2,180.0 m", "Thick sticky swelling montmorillonite clay. High sticking risk."],
            ["Tipam Sandstone (TS-1 to TS-6)", "2,180.0 m", "2,960.0 m", "Multi-storied braided river pay sands. Sub-hydrostatic pore pressure."],
            ["Barail Group", "3,060.0 m", "3,450.0 m", "Interbedded marine shales, carbonaceous coals & gas sands."]
        ]
        st = Table(strat_data, colWidths=[130, 85, 85, 240])
        st.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0284C7')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
        ]))
        story.append(st)
        story.append(Spacer(1, 12))

        # Section 8: Incident Excerpt
        story.append(Paragraph("SECTION 8: HISTORICAL DRILLING HAZARDS & NPT LOG (PAGE 147)", section_style))
        story.append(Paragraph("<b>INCIDENT 1: DIFFERENTIAL PIPE STICKING AT 1,680m MD (GIRUJAN CLAY)</b>", body_style))
        story.append(Paragraph(
            "While pulling out of hole (POOH) for directional survey at 1,680m MD, drill string was kept stationary for 3 hours 15 minutes "
            "due to top-drive hydraulic hose leak. Upon resuming hoisting, string was found differentially stuck with overpull exceeding 110,000 lbs. "
            "Mud weight was 10.9 ppg water-based polymer mud with excessive filter cake thickness (8/32\"). Jarred string with maximum safe pull for 4 hours without release.",
            highlight_style
        ))
        story.append(Spacer(1, 6))
        story.append(Paragraph(
            "<b>FIELD-PROVEN MITIGATION & SOP:</b> Mixed and spotted 50 bbl Oil-Based Mud (OBM) lubricant soak pill weighted to 11.0 ppg with 4% pipe-release surfactant. "
            "Allowed soak time of 12 hours. String jarred free at 08:30 hrs. Total NPT: 14 days (INR 8.0 Crore). "
            "Recommendation: Maintain continuous string rotation (>60 RPM) in Girujan. Do not allow stationary pipe to exceed 5 minutes. Use KCl-polymer mud system with 5% KCl for clay inhibition.",
            body_style
        ))
        story.append(Spacer(1, 8))

        story.append(Paragraph("<b>INCIDENT 2: LOST CIRCULATION IN TIPAM SANDSTONE AT 1,840m MD</b>", body_style))
        story.append(Paragraph(
            "Encountered severe loss of circulation at 1,840m MD in Tipam Sandstone TS-3 pay interval. Returns dropped to 35% with 60 bbl/hr loss rate. "
            "Pumped 25 bbl coarse calcium carbonate (CaCO3) + mica LCM pill. Circulation fully restored after 4 hours soak. Maintained MW below 10.8 ppg.",
            highlight_style
        ))
        story.append(Spacer(1, 14))

        # Statutory Sign-off
        story.append(Paragraph("<b>STATUTORY SIGN-OFF:</b> Verified by P. Saikia (Chief Drilling Specialist, Oil India Ltd.) · OISD-STD-174 Compliant", subtitle_style))
        doc.build(story)
    print("Generated Sample_WCR_Moran_7.pdf successfully.")

def generate_ddr_moran():
    for out_dir in DEMO_DIRS:
        pdf_path = os.path.join(out_dir, "Sample_DDR_Moran_29.pdf")
        doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []

        # Header
        story.append(Paragraph("OIL INDIA LIMITED — DAILY DRILLING REPORT (DDR)", title_style))
        story.append(Paragraph("24-HOUR OPERATIONAL LOG · REPORT NO: 28 · DATE: 12-SEP-2026", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#D97706'), spaceAfter=10))

        # Rig Status Table
        rig_data = [
            ["Well Name:", "MORAN-29 (MOR-29)", "Rig:", "OIL-RIG-04 (2000 HP AC-SCR)"],
            ["Current Depth:", "2,418.0m MD (TVD: 2,396.2m)", "24-hr Progress:", "+12.0m drilled"],
            ["Formation:", "Barail Group (Tikak Parbat member)", "ROP Avg:", "6.8 m/hr"],
            ["Mud Weight:", "10.8 ppg (KCl-Polymer)", "Standpipe Press:", "2,440 psi @ 650 GPM"]
        ]
        t = Table(rig_data, colWidths=[110, 160, 110, 160])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FFFBEB')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#FDE68A')),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#78350F')),
        ]))
        story.append(t)
        story.append(Spacer(1, 10))

        # 24 Hour Log
        story.append(Paragraph("24-HOUR DRILLING TIMELINE & PARAMETERS", section_style))
        timeline = [
            ["Time", "Operation & Subsurface Observation"],
            ["06:00 - 10:00", "Rotary drilling 8-1/2\" hole from 2,406m to 2,412m. WOB: 18.5 klbs, RPM: 120. ROP 1.5 m/hr."],
            ["10:00 - 10:30", "Connection gas check. Background gas increased from 18 to 28 units. Trip gas peaked at 42 units."],
            ["10:30 - 14:00", "Drilled ahead to 2,416m. Torque stable at 14,000 ft-lbs. Clean returns."],
            ["14:00 - 18:00", "Drilled to 2,418m MD. Circulated bottoms-up. Mud density verified at 10.8 ppg."],
            ["18:00 - 06:00", "SRISHTI·AI Lookahead Advisory: Bit is 32m above Barail Gas Precursor Horizon (2,450m)."]
        ]
        tt = Table(timeline, colWidths=[90, 450])
        tt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#D97706')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
        ]))
        story.append(tt)
        story.append(Spacer(1, 10))

        # Lookahead Hazard Box
        story.append(Paragraph("SRISHTI·AI PROACTIVE LOOKAHEAD ALERT (ALT-101)", section_style))
        story.append(Paragraph(
            "CRITICAL HAZARD WARNING: Bit at 2,418m MD is approaching 2,450m Barail overpressured gas kick precursor horizon. "
            "Offset well BAGHJAN-5 (13.2 km NE) recorded a 22 bbl gas influx at 3,380m in identical stratigraphic sequence. "
            "MANDATORY ACTION: 1. Calibrate trip tank sensors. 2. Prepare 12.8 ppg kill mud in reserve pit. 3. Conduct remote BOP choke drill per OISD-STD-174.",
            highlight_style
        ))
        story.append(Spacer(1, 10))

        story.append(Paragraph("<b>SIGNATURES:</b> K. Sarma (Company Man) · R. Hazarika (Day Toolpusher) · OIL Duliajan", subtitle_style))
        doc.build(story)
    print("Generated Sample_DDR_Moran_29.pdf successfully.")

def copy_las_sample():
    sample_las_content = """~VERSION INFORMATION
 VERS.                          2.0 :   CWLS LOG ASCII STANDARD - VERSION 2.0
 WRAP.                           NO :   ONE LINE PER DEPTH STEP
~WELL INFORMATION
#MNEM.UNIT       DATA                       DESCRIPTION
#---------       ----                       -----------
 STRT.M          2400.0000                  : START DEPTH
 STOP.M          2450.0000                  : STOP DEPTH
 STEP.M             0.5000                  : STEP
 NULL.           -999.25                    : NULL VALUE
 COMP.           OIL INDIA LIMITED          : COMPANY
 WELL.           MORAN-29                   : WELL
 FLD .           MORAN                      : FIELD
 LOC .           27.4853 N 95.3456 E        : LOCATION
 PROV.           UPPER ASSAM                : PROVINCE
 DATE.           12-SEP-2026                : LOG DATE
~CURVE INFORMATION
#MNEM.UNIT       API CODE                   DESCRIPTION
#---------       --------                   -----------
 DEPTH.M                                    : 1  MEASURED DEPTH
 GR   .GAPI                                 : 2  GAMMA RAY (SHALE INDICATOR)
 RT   .OHMM                                 : 3  TRUE FORMATION RESISTIVITY
 DT   .US/M                                 : 4  SONIC TRAVEL TIME (POROSITY)
 CALI .IN                                   : 5  CALIPER HOLE DIAMETER
~A  DEPTH     GR       RT       DT     CALI
  2400.0   62.4    14.2    280.1    8.52
  2405.0   68.1    12.8    284.5    8.55
  2410.0   74.2    11.5    291.0    8.60
  2415.0   82.0    10.2    298.4    8.65
  2418.0   88.5     9.8    305.2    8.70
  2420.0   94.1     8.9    312.0    8.78
  2425.0  102.4     7.6    324.5    8.85
  2430.0  110.2     6.4    338.0    8.95
  2435.0  118.0     5.8    350.2    9.10
  2440.0  124.5     5.2    362.0    9.25
  2445.0  135.0     4.8    375.4    9.40
  2450.0  142.1     4.1    390.0    9.65
"""
    for out_dir in DEMO_DIRS:
        las_path = os.path.join(out_dir, "Sample_UpperAssam_Log.las")
        with open(las_path, "w", encoding="utf-8") as f:
            f.write(sample_las_content)
    print("Generated Sample_UpperAssam_Log.las successfully.")

if __name__ == "__main__":
    generate_wcr_moran()
    generate_ddr_moran()
    copy_las_sample()
    print("All authentic demo files created across all targets.")
