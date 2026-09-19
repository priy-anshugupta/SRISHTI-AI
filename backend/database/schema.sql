-- ==============================================================================
-- SRISHTI·AI: Subsurface Evidence & Offset-Well Institutional Memory Schema
-- Tailored for Oil India Limited (Upper Assam Basin)
-- Compliant with OISD-STD-174 (Well Control Operations) & WITSML 1.4/2.0
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. WELLS TABLE
CREATE TABLE IF NOT EXISTS wells (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    field VARCHAR(100) NOT NULL,
    block VARCHAR(100) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    spud_date DATE NOT NULL,
    td_depth_md DOUBLE PRECISION NOT NULL,
    target_depth_md DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL,
    rig VARCHAR(50) NOT NULL,
    well_type VARCHAR(50) NOT NULL,
    current_formation VARCHAR(100) NOT NULL,
    current_rop DOUBLE PRECISION DEFAULT 0.0,
    active_hazard_distance_m DOUBLE PRECISION DEFAULT 0.0,
    primary_hazard TEXT,
    total_npt_hrs DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FORMATIONS TABLE (Upper Assam Geological Column)
CREATE TABLE IF NOT EXISTS formations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    group_name VARCHAR(100) NOT NULL,
    lithology TEXT NOT NULL,
    depth_top_md DOUBLE PRECISION NOT NULL,
    depth_bottom_md DOUBLE PRECISION NOT NULL,
    avg_rop DOUBLE PRECISION NOT NULL,
    drill_time_days DOUBLE PRECISION NOT NULL,
    npt_hrs DOUBLE PRECISION NOT NULL,
    primary_hazard TEXT NOT NULL,
    color VARCHAR(20) NOT NULL
);

-- 4. DRILLING EVENTS & INCIDENTS (Source of Grounded Evidence)
CREATE TABLE IF NOT EXISTS drilling_events (
    id VARCHAR(50) PRIMARY KEY,
    well_id VARCHAR(50) REFERENCES wells(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    formation VARCHAR(100) NOT NULL,
    depth_md DOUBLE PRECISION NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    npt_cost_inr DOUBLE PRECISION DEFAULT 0.0,
    duration_hrs DOUBLE PRECISION DEFAULT 0.0,
    description TEXT NOT NULL,
    mitigation TEXT NOT NULL,
    source_doc VARCHAR(255) NOT NULL,
    source_page INTEGER NOT NULL,
    reviewer_status VARCHAR(20) DEFAULT 'PENDING' CHECK (reviewer_status IN ('APPROVED', 'PENDING', 'REJECTED')),
    verified_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INGESTED DOCUMENTS (WCR, DDR, Mud Logs)
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(50) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    doc_type VARCHAR(100) NOT NULL,
    well_id VARCHAR(50) REFERENCES wells(id) ON DELETE SET NULL,
    pages INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    confidence DOUBLE PRECISION DEFAULT 0.0,
    entities_count INTEGER DEFAULT 0,
    processing_time_s DOUBLE PRECISION DEFAULT 0.0,
    raw_excerpt TEXT,
    reviewer_status VARCHAR(20) DEFAULT 'PENDING',
    reviewed_by VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. REAL-TIME & PROACTIVE ALERTS
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(50) PRIMARY KEY,
    well_id VARCHAR(50) REFERENCES wells(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'INFO')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    offset_wells JSONB DEFAULT '[]'::jsonb,
    depth_md DOUBLE PRECISION NOT NULL,
    hazard_horizon_md DOUBLE PRECISION NOT NULL,
    distance_to_hazard_m DOUBLE PRECISION NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(100),
    action_taken TEXT,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. AUDIT LOG (Immutable Decision Traceability)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actor VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    details TEXT NOT NULL
);

-- 8. TELEMETRY FRAMES (eRTMAC Replay Cache)
CREATE TABLE IF NOT EXISTS telemetry_frames (
    id SERIAL PRIMARY KEY,
    well_id VARCHAR(50) REFERENCES wells(id) ON DELETE CASCADE,
    depth_md DOUBLE PRECISION NOT NULL,
    rop DOUBLE PRECISION NOT NULL,
    wob_klbs DOUBLE PRECISION NOT NULL,
    rpm INTEGER NOT NULL,
    spp_psi INTEGER NOT NULL,
    torque_ftlbs INTEGER NOT NULL,
    flow_rate_gpm INTEGER NOT NULL,
    pit_volume_bbl DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- SEED DATA: UPPER ASSAM BASIN (OIL INDIA LIMITED OPERATIONS)
-- ==============================================================================

-- Formations Seed
INSERT INTO formations (name, group_name, lithology, depth_top_md, depth_bottom_md, avg_rop, drill_time_days, npt_hrs, primary_hazard, color)
VALUES
    ('Alluvium', 'Surface Recent', 'Unconsolidated sand, silt, gravel', 0, 200, 42.5, 4.2, 12, 'Washouts & Shallow Gas Pockets', '#65A30D'),
    ('Dhekiajuli / Namsang', 'Mio-Pliocene', 'Loose coarse sandstones with clay intercalations', 200, 800, 28.4, 8.5, 45, 'Lost Circulation & Borehole Washout', '#D97706'),
    ('Girujan Clay', 'Tipam Group (Cap Rock)', 'Sticky, highly reactive montmorillonite swelling clays', 800, 1500, 18.6, 14.2, 156, 'Differential Sticking & Severe Clay Swelling', '#C2410C'),
    ('Tipam Sandstone', 'Tipam Group (Pay Zone)', 'Braided river massive sandstones with shale stringers', 1500, 2350, 22.1, 12.8, 84, 'Lost Circulation (Thief Zone) & Clay Mineral Swelling', '#E0A96D'),
    ('Barail Group', 'Oligocene', 'Pressurized marine shales and carbonaceous coals / sandstones', 2350, 3200, 12.4, 18.4, 210, 'High-Pressure Gas Kicks & Overpressured Compartments', '#475569'),
    ('Basement', 'Precambrian', 'Crystalline granite gneiss quartzite', 3200, 4000, 6.8, 6.1, 32, 'Severe Bit Wear & Low ROP', '#334155')
ON CONFLICT (name) DO NOTHING;

-- Wells Seed
INSERT INTO wells (id, name, field, block, lat, lon, spud_date, td_depth_md, target_depth_md, status, rig, well_type, current_formation, current_rop, active_hazard_distance_m, primary_hazard, total_npt_hrs)
VALUES
    ('MRN-29', 'MORAN-29', 'Moran', 'MOR-III', 27.4853, 95.3456, '2026-08-15', 2418.0, 3200.0, 'ACTIVE DRILLING', 'OIL-RIG-04', 'Development', 'Barail Group', 14.2, 32.0, 'Upcoming Barail Gas Precursor Horizon', 6.0),
    ('MRN-07', 'MORAN-7', 'Moran', 'MOR-I', 27.4912, 95.3398, '2018-03-10', 3150.0, 3150.0, 'COMPLETED', 'OIL-RIG-01', 'Exploration', 'Basement', 0.0, 0.0, 'Differential Sticking in Girujan Clay (1,240m)', 142.5),
    ('MRN-12', 'MORAN-12', 'Moran', 'MOR-II', 27.4789, 95.3521, '2021-11-04', 3220.0, 3220.0, 'COMPLETED', 'OIL-RIG-03', 'Development', 'Basement', 0.0, 0.0, 'Mud Losses in Tipam (1,850m)', 88.0),
    ('NHK-512', 'NAHARKATIYA-512', 'Naharkatiya', 'NHK-Main', 27.2845, 95.3567, '2019-07-22', 3050.0, 3050.0, 'COMPLETED', 'OIL-RIG-07', 'Development', 'Basement', 0.0, 0.0, 'Lost Circulation in Tipam Sandstone (1,840m)', 114.0),
    ('NHK-318', 'NAHARKATIYA-318', 'Naharkatiya', 'NHK-South', 27.2711, 95.3644, '2023-01-15', 3120.0, 3120.0, 'COMPLETED', 'OIL-RIG-05', 'Development', 'Barail Group', 0.0, 0.0, 'Tight hole in Barail transition', 46.0),
    ('BGH-05', 'BAGHJAN-5', 'Baghjan', 'BGH-Ext', 27.6012, 95.4215, '2020-05-18', 3850.0, 3850.0, 'CRITICAL INCIDENT', 'OIL-RIG-09', 'Exploration', 'Basement', 0.0, 0.0, 'High-Pressure Gas Kick in Barail Upper (2,950m & 2,450m)', 310.0),
    ('DLJ-101', 'DULIAJAN-101', 'Duliajan', 'HQ-Central', 27.3712, 95.3045, '2025-09-10', 2850.0, 2850.0, 'COMPLETED', 'OIL-RIG-04', 'Development', 'Barail Group', 0.0, 0.0, 'Shallow gravel washouts in Alluvium', 18.0)
ON CONFLICT (id) DO NOTHING;

-- Drilling Events Seed (Evidence-Linked)
INSERT INTO drilling_events (id, well_id, event_type, formation, depth_md, severity, npt_cost_inr, duration_hrs, description, mitigation, source_doc, source_page, reviewer_status, verified_by)
VALUES
    ('EVT-01', 'MRN-07', 'Stuck Pipe', 'Girujan Clay', 1240.0, 'HIGH', 80000000.0, 336.0, 'Differential pipe sticking across sticky montmorillonite clay after 3 hours stationary drill string during survey.', 'Spotted 50 bbl oil-based mud lubricant pill with surfactant; jarred free after 14 days fishing.', 'WCR_Moran_7_2018.pdf', 147, 'APPROVED', 'P. Saikia (Chief Drilling Eng.)'),
    ('EVT-02', 'NHK-512', 'Mud Loss', 'Tipam Sandstone', 1840.0, 'MEDIUM', 15000000.0, 48.0, 'Sudden loss of returns (60 bbl/hr) upon penetrating micro-fractured porous Tipam sandstone interval.', 'Pumped 25 bbl coarse calcium carbonate LCM pill; reduced mud weight from 11.2 ppg to 10.4 ppg.', 'WCR_Naharkatiya_512.pdf', 82, 'APPROVED', 'B. Borah (Lead Mud Eng.)'),
    ('EVT-03', 'BGH-05', 'Gas Kick', 'Barail Group', 2450.0, 'CRITICAL', 450000000.0, 720.0, 'Unpredicted pore pressure surge in Barail coal sequence; pit gain 22 bbl in 4 minutes, standpipe pressure flutter +180 psi.', 'Shut in well via annular BOP per OISD-STD-174; circulated out kick using Wait & Weight method with 12.8 ppg kill mud.', 'IncidentReport_BGH5_2020.pdf', 14, 'APPROVED', 'R. Gogoi (Safety Supervisor)'),
    ('EVT-04', 'MRN-29', 'Differential Sticking', 'Girujan Clay', 1235.0, 'MEDIUM', 3500000.0, 6.0, 'Drill string dragged heavily during connection. Immediate spotting of lubricant pill prevented severe sticking.', 'Spotted OBM lubricant pill, maintained rotation at 60 RPM, successfully freed in 6 hours.', 'DDR_MRN29_Day14.pdf', 2, 'APPROVED', 'K. Sarma (Company Man)')
ON CONFLICT (id) DO NOTHING;

-- Alerts Seed (Depth Correlated for Active Well MORAN-29 at 2,418m)
INSERT INTO alerts (id, well_id, severity, title, description, recommended_action, offset_wells, depth_md, hazard_horizon_md, distance_to_hazard_m, acknowledged, acknowledged_by, action_taken)
VALUES
    ('ALT-101', 'MRN-29', 'CRITICAL', 'Approaching 2,450m — Barail Gas Precursor Horizon', 'Offset well BGH-05 (8.2 km N) encountered severe gas influx with 22 bbl pit volume gain at 2,450m MD in Barail carbonaceous sand.', '1. Check trip tank & flow sensor calibration. 2. Prepare 12.4 ppg kill mud in reserve pit. 3. Perform remote BOP choke drill per OISD-STD-174.', '["BAGHJAN-5", "MORAN-12"]'::jsonb, 2418.0, 2450.0, 32.0, FALSE, NULL, NULL),
    ('ALT-102', 'MRN-29', 'MEDIUM', 'ROP Deviation vs. Offset Well Benchmark', 'Current ROP (14.2 m/hr) is 25% below NHK-512 benchmark in lower Barail sandstone sequence.', 'Inspect bit dull grading upon next trip; consider increasing WOB from 18.5 to 22 klbs.', '["NAHARKATIYA-512"]'::jsonb, 2418.0, 2418.0, 0.0, TRUE, 'K. Sarma (Toolpusher)', 'Adjusted WOB to 21 klbs, ROP improved to 16.8 m/hr.')
ON CONFLICT (id) DO NOTHING;

-- Initial Audit Log
INSERT INTO audit_logs (actor, action, entity_type, entity_id, details)
VALUES
    ('SYSTEM', 'DATABASE_INITIALIZATION', 'SYSTEM', 'SYS-01', 'SRISHTI·AI Subsurface Evidence Database initialized with Upper Assam oilfield stratigraphy and OISD-STD-174 rules.'),
    ('K. Sarma (Toolpusher)', 'ALERT_ACKNOWLEDGED', 'ALERT', 'ALT-102', 'Acknowledged ROP deviation alert for MORAN-29. Action taken: Adjusted WOB to 21 klbs.');
