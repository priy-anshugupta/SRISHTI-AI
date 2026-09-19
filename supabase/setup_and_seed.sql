-- =====================================================================
-- SRISHTI·AI: Complete Setup & Live Seed Script for Supabase
-- Target Project: 2nd sih ps (https://fsoioyteimbcoesuuqxl.supabase.co)
-- Basin: Upper Assam Basin (Oil India Limited & ONGC)
-- Run this in Supabase SQL Editor:
--   1. Open Supabase Dashboard
--   2. Click 'SQL Editor' (>_ icon on left menu)
--   3. Click 'New query'
--   4. Paste this entire file and click 'Run'
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE public.document_status AS ENUM ('RECEIVED','TEXT_EXTRACTED','EXTRACTING','REVIEW_REQUIRED','APPROVED','FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.review_status AS ENUM ('PENDING','APPROVED','REJECTED','CORRECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.alert_status AS ENUM ('OPEN','ACKNOWLEDGED','RESOLVED','EXPIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABLES
CREATE TABLE IF NOT EXISTS public.wells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE,
  name text NOT NULL UNIQUE,
  field text,
  block text,
  status text NOT NULL DEFAULT 'PLANNING',
  well_type text,
  surface_location geography(point,4326),
  target_depth_md_m numeric,
  current_depth_md_m numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wells_surface_location_gix ON public.wells USING gist(surface_location);

CREATE TABLE IF NOT EXISTS public.formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL UNIQUE,
  group_name text,
  lithology text,
  color text NOT NULL DEFAULT '#64748b'
);

CREATE TABLE IF NOT EXISTS public.well_formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id uuid NOT NULL REFERENCES public.wells(id) ON DELETE CASCADE,
  formation_id uuid NOT NULL REFERENCES public.formations(id),
  top_md_m numeric NOT NULL,
  base_md_m numeric NOT NULL,
  top_tvdss_m numeric,
  base_tvdss_m numeric,
  correlation_confidence numeric CHECK (correlation_confidence BETWEEN 0 AND 1),
  source_document_id uuid,
  UNIQUE(well_id, formation_id, top_md_m)
);

CREATE TABLE IF NOT EXISTS public.source_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_filename text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  sha256 text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0),
  well_id uuid REFERENCES public.wells(id),
  document_type text,
  page_count integer,
  processing_status public.document_status NOT NULL DEFAULT 'RECEIVED',
  processing_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.drilling_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id uuid NOT NULL REFERENCES public.wells(id) ON DELETE CASCADE,
  formation_id uuid REFERENCES public.formations(id),
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  depth_from_md_m numeric NOT NULL,
  depth_to_md_m numeric,
  description text NOT NULL,
  mitigation text,
  source_document_id uuid REFERENCES public.source_documents(id),
  source_page integer,
  review_status public.review_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS drilling_events_well_depth_idx ON public.drilling_events(well_id, depth_from_md_m);

CREATE TABLE IF NOT EXISTS public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id uuid NOT NULL REFERENCES public.wells(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status public.alert_status NOT NULL DEFAULT 'OPEN',
  depth_from_md_m numeric,
  depth_to_md_m numeric,
  rationale jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommended_action text NOT NULL,
  action_taken text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. SPATIAL QUERY FUNCTION
CREATE OR REPLACE FUNCTION public.nearby_wells(target_lat double precision, target_lon double precision, radius_km double precision)
RETURNS TABLE(id uuid, external_id text, name text, field text, status text, lat double precision, lon double precision, distance_km double precision)
LANGUAGE sql STABLE AS $$
  SELECT w.id, w.external_id, w.name, w.field, w.status,
         st_y(w.surface_location::geometry), st_x(w.surface_location::geometry),
         st_distance(w.surface_location, st_setsrid(st_makepoint(target_lon,target_lat),4326)::geography) / 1000.0
  FROM public.wells w
  WHERE w.surface_location IS NOT NULL
    AND st_dwithin(w.surface_location, st_setsrid(st_makepoint(target_lon,target_lat),4326)::geography, radius_km * 1000.0)
  ORDER BY st_distance(w.surface_location, st_setsrid(st_makepoint(target_lon,target_lat),4326)::geography);
$$;

-- 5. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('srishti-documents', 'srishti-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 6. RLS POLICIES
ALTER TABLE public.wells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.well_formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drilling_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Allow public read via anon key for demo/dashboard
CREATE POLICY "Allow public read wells" ON public.wells FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read formations" ON public.formations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read well_formations" ON public.well_formations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read source_documents" ON public.source_documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read drilling_events" ON public.drilling_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read alerts" ON public.alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read audit_events" ON public.audit_events FOR SELECT TO anon, authenticated USING (true);

-- Allow service_role full access
CREATE POLICY "Service role full wells" ON public.wells FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full formations" ON public.formations FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full well_formations" ON public.well_formations FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full source_documents" ON public.source_documents FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full drilling_events" ON public.drilling_events FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full alerts" ON public.alerts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full audit_events" ON public.audit_events FOR ALL TO service_role USING (true);

-- =====================================================================
-- 7. SEED DATA
-- =====================================================================

-- FORMATIONS (11 Formations)
INSERT INTO public.formations (canonical_name, group_name, lithology, color)
VALUES ('Alluvium / Dihing', 'Holocene–Pleistocene', 'Unconsolidated sands, gravels, clays, silt; freshwater aquifer zone', '#65A30D')
ON CONFLICT (canonical_name) DO UPDATE SET group_name = EXCLUDED.group_name, lithology = EXCLUDED.lithology, color = EXCLUDED.color;
INSERT INTO public.formations (canonical_name, group_name, lithology, color)
VALUES ('Dhekiajuli', 'Pliocene–Pleistocene', 'Coarse sands, grit, pebble beds; freshwater protection zone', '#D97706')
ON CONFLICT (canonical_name) DO UPDATE SET group_name = EXCLUDED.group_name, lithology = EXCLUDED.lithology, color = EXCLUDED.color;
INSERT INTO public.formations (canonical_name, group_name, lithology, color)
VALUES ('Namsang', 'Mio-Pliocene', 'Sandstones, grits, conglomerate lenses; regional unconformity at base', '#EA580C')
ON CONFLICT (canonical_name) DO UPDATE SET group_name = EXCLUDED.group_name, lithology = EXCLUDED.lithology, color = EXCLUDED.color;
INSERT INTO public.formations (canonical_name, group_name, lithology, color)
VALUES ('Girujan Clay', 'Tipam Group (Cap Rock)', 'Mottled clays, bluish-green mudstones; highly reactive montmorillonite swelling clays', '#C2410C')
ON CONFLICT (canonical_name) DO UPDATE SET group_name = EXCLUDED.group_name, lithology = EXCLUDED.lithology, color = EXCLUDED.color;
INSERT INTO public.formations (canonical_name, group_name, lithology, color)
VALUES ('Tipam Sandstone', 'Tipam Group (Pay Zone)', 'Thick multi-storied braided channel sandstones (TS-1 to TS-6) with shale stringers', '#E0A96D')
ON CONFLICT (canonical_name) DO UPDATE SET group_name = EXCLUDED.group_name, lithology = EXCLUDED.lithology, color = EXCLUDED.color;
INSERT INTO public.formations (canonical_name, group_name, lithology, color)
VALUES ('Bokabil / Surma', 'Surma Group', 'Claystones and thin sandstones; often thin or pinched out on shelf highs', '#6B7280')
ON CONFLICT (canonical_name) DO UPDATE SET group_name = EXCLUDED.group_name, lithology = EXCLUDED.lithology, color = EXCLUDED.color;
INSERT INTO public.formations (canonical_name, group_name, lithology, color)
VALUES ('Barail Group', 'Late Eocene–Early Oligocene', 'Interbedded fine-medium sandstones, carbonaceous shales & thick coal seams (Tikak Parbat)', '#475569')
ON CONFLICT (canonical_name) DO UPDATE SET group_name = EXCLUDED.group_name, lithology = EXCLUDED.lithology, color = EXCLUDED.color;
INSERT INTO public.formations (canonical_name, group_name, lithology, color)
VALUES ('Kopili Formation', 'Jaintia Group (Late Eocene)', 'Dark grey fossiliferous marine shales with thin calcareous sandstones; geomechanically unstable', '#7C3AED')
ON CONFLICT (canonical_name) DO UPDATE SET group_name = EXCLUDED.group_name, lithology = EXCLUDED.lithology, color = EXCLUDED.color;
INSERT INTO public.formations (canonical_name, group_name, lithology, color)
VALUES ('Sylhet Limestone', 'Jaintia Group (Middle Eocene)', 'Nummulitic dense shelf limestone, calcareous shales, dolomitic streaks', '#0891B2')
ON CONFLICT (canonical_name) DO UPDATE SET group_name = EXCLUDED.group_name, lithology = EXCLUDED.lithology, color = EXCLUDED.color;
INSERT INTO public.formations (canonical_name, group_name, lithology, color)
VALUES ('Lakadong / Therria', 'Jaintia Group (Paleocene–Early Eocene)', 'Calcareous sandstones, basal clastics, quartzitic sands; high-pressure gas/condensate reservoir', '#DC2626')
ON CONFLICT (canonical_name) DO UPDATE SET group_name = EXCLUDED.group_name, lithology = EXCLUDED.lithology, color = EXCLUDED.color;
INSERT INTO public.formations (canonical_name, group_name, lithology, color)
VALUES ('Pre-Cambrian Basement', 'Archean–Proterozoic', 'Granite, granodiorite, gneissic complex', '#334155')
ON CONFLICT (canonical_name) DO UPDATE SET group_name = EXCLUDED.group_name, lithology = EXCLUDED.lithology, color = EXCLUDED.color;

-- WELLS (18 Wells)
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('MOR-29', 'MORAN-29', 'Moran', 'MOR-III', 'ACTIVE DRILLING', 'Development', ST_SetSRID(ST_MakePoint(95.3456, 27.4853), 4326)::geography, 3500.0, 2418.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('MOR-07', 'MORAN-7', 'Moran', 'MOR-I', 'COMPLETED', 'Exploration', ST_SetSRID(ST_MakePoint(95.3398, 27.4912), 4326)::geography, 3450.0, 3450.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('MOR-12', 'MORAN-12', 'Moran', 'MOR-II', 'COMPLETED', 'Development', ST_SetSRID(ST_MakePoint(95.3521, 27.4789), 4326)::geography, 3520.0, 3520.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('MOR-56', 'MORAN-56', 'Moran', 'MOR-III', 'SUSPENDED', 'Development', ST_SetSRID(ST_MakePoint(95.351, 27.483), 4326)::geography, 3400.0, 2890.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('NHK-162', 'NAHORKATIYA-162', 'Nahorkatiya', 'NHK-Main', 'COMPLETED', 'Development', ST_SetSRID(ST_MakePoint(95.3567, 27.2845), 4326)::geography, 3650.0, 3650.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('NHK-342', 'NAHORKATIYA-342', 'Nahorkatiya', 'NHK-South', 'COMPLETED', 'Development', ST_SetSRID(ST_MakePoint(95.3644, 27.2711), 4326)::geography, 3420.0, 3420.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('NHK-561', 'NAHORKATIYA-561', 'Nahorkatiya', 'NHK-East', 'ACTIVE DRILLING', 'Exploration', ST_SetSRID(ST_MakePoint(95.378, 27.292), 4326)::geography, 3800.0, 3100.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('NHK-656', 'NAHORKATIYA-656', 'Nahorkatiya', 'NHK-Main', 'COMPLETED', 'Exploration', ST_SetSRID(ST_MakePoint(95.362, 27.288), 4326)::geography, 3850.0, 3850.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('BGH-05', 'BAGHJAN-5', 'Baghjan', 'BGH-Ext', 'CRITICAL INCIDENT', 'Exploration', ST_SetSRID(ST_MakePoint(95.4215, 27.6012), 4326)::geography, 3870.0, 3870.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('BGH-09', 'BAGHJAN-9', 'Baghjan', 'BGH-Ext', 'COMPLETED', 'Development', ST_SetSRID(ST_MakePoint(95.418, 27.598), 4326)::geography, 3720.0, 3720.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('BGH-21', 'BAGHJAN-21', 'Baghjan', 'BGH-Main', 'COMPLETED', 'Exploration', ST_SetSRID(ST_MakePoint(95.425, 27.595), 4326)::geography, 4100.0, 4100.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('DLJ-101', 'DULIAJAN-101', 'Duliajan', 'HQ-Central', 'COMPLETED', 'Development', ST_SetSRID(ST_MakePoint(95.3045, 27.3712), 4326)::geography, 3250.0, 3250.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('HGJ-48', 'HUGRIJAN-48', 'Hugrijan', 'HGJ-North', 'COMPLETED', 'Development', ST_SetSRID(ST_MakePoint(95.321, 27.356), 4326)::geography, 3380.0, 3380.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('LK-112', 'LAKWA-112', 'Lakwa', 'LK-Central', 'COMPLETED', 'Development', ST_SetSRID(ST_MakePoint(94.885, 26.932), 4326)::geography, 3600.0, 3600.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('LK-245', 'LAKWA-245', 'Lakwa', 'LK-South', 'COMPLETED', 'Development', ST_SetSRID(ST_MakePoint(94.892, 26.918), 4326)::geography, 3150.0, 3150.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('RDS-25', 'RUDRASAGAR-25', 'Rudrasagar', 'RDS-Main', 'COMPLETED', 'Development', ST_SetSRID(ST_MakePoint(94.935, 26.971), 4326)::geography, 3400.0, 3400.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('RDS-147', 'RUDRASAGAR-147', 'Rudrasagar', 'RDS-East', 'CRITICAL INCIDENT', 'Development', ST_SetSRID(ST_MakePoint(94.942, 26.968), 4326)::geography, 3350.0, 3350.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;
INSERT INTO public.wells (external_id, name, field, block, status, well_type, surface_location, target_depth_md_m, current_depth_md_m)
VALUES ('DGB-1001', 'DIGBOI-1001', 'Digboi', 'DGB-Anticline', 'COMPLETED', 'Development', ST_SetSRID(ST_MakePoint(95.618, 27.393), 4326)::geography, 2200.0, 2200.0)
ON CONFLICT (name) DO UPDATE SET external_id = EXCLUDED.external_id, field = EXCLUDED.field, status = EXCLUDED.status, target_depth_md_m = EXCLUDED.target_depth_md_m, current_depth_md_m = EXCLUDED.current_depth_md_m;

-- DRILLING EVENTS (15 Events linked to Wells & Formations)
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Stuck Pipe', 'HIGH', 1680.0, 1680.0, 'Differential pipe sticking across sticky montmorillonite clay after 3 hours stationary drill string during directional survey. Overpull exceeded 110,000 lbs. Mud weight was 10.9 ppg with excessive filter cake (8/32").', 'Spotted 50 bbl OBM lubricant soak pill weighted to 11.0 ppg with 4% pipe-release surfactant. Soak time 12 hrs. String jarred free. Total NPT: 14 days incl. fishing. Recommendation: maintain >60 RPM rotation in Girujan, never allow stationary string >5 min.', 147, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'MOR-07' AND (f.canonical_name ILIKE '%Girujan Clay%' OR f.canonical_name = 'Girujan Clay')
LIMIT 1;
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Lost Circulation', 'MEDIUM', 2540.0, 2580.0, 'Sudden loss of returns (60 bbl/hr) upon penetrating micro-fractured porous Tipam sandstone TS-3 interval. Active pit volume dropped by 38 bbl.', 'Pulled off bottom to 2,500m. Spotted 25 bbl coarse CaCO3 (30 ppb) + medium Mica (15 ppb) LCM pill. Squeezed at 250 psi annular pressure. Reduced MW from 11.2 to 10.4 ppg. Full circulation restored. Recommendation: maintain MW within 10.2–10.6 ppg window in Tipam TS-3.', 82, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'NHK-162' AND (f.canonical_name ILIKE '%Tipam Sandstone%' OR f.canonical_name = 'Tipam Sandstone')
LIMIT 1;
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Gas Kick', 'CRITICAL', 3380.0, 3400.0, 'Unpredicted pore pressure surge in Barail carbonaceous coal-shale sequence. Pit volume gained 22 bbl in 4 minutes. Standpipe pressure flutter +180 psi. Background gas jumped from 25 to 340 units.', 'Shut in well via annular BOP per OISD-STD-174. Circulated out kick using Wait & Weight method with 12.8 ppg kill mud. Total well control event duration: 30 days including kill verification and cement squeeze.', 14, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'BGH-05' AND (f.canonical_name ILIKE '%Barail Group%' OR f.canonical_name = 'Barail Group')
LIMIT 1;
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Differential Sticking', 'MEDIUM', 1720.0, 1720.0, 'Drill string dragged heavily during connection at 1,720m in Girujan Clay. Immediate spotting of lubricant pill prevented severe sticking.', 'Spotted OBM lubricant pill, maintained rotation at 60 RPM, successfully freed in 6 hours. Adjusted MW from 10.5 to 10.8 ppg for the remaining Girujan interval.', 2, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'MOR-29' AND (f.canonical_name ILIKE '%Girujan Clay%' OR f.canonical_name = 'Girujan Clay')
LIMIT 1;
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Blowout', 'CRITICAL', 3729.0, 3872.0, 'Well kicked and blew out on 27-May-2020 during workover to recomplete from Langpar (3,870m) to Lakadong/Therria (3,729–3,739m). Root cause: premature BOP removal before establishing adequate mechanical barriers. Single cement plug placed at shallow ~1,000m in deviated section instead of above production packer (~3,700m). Gas ignited on 9-Jun-2020. Well killed by snubbing unit (Alert Disaster Control, Singapore) on 15-Nov-2020. Permanently P&A on 3-Dec-2020 (190 days).', 'Specialized snubbing unit mobilized from Alert Disaster Control (Singapore) and Schlumberger. Heavy kill mud pumped via snubbing string. Well permanently plugged and abandoned. NGT Katakey Committee: ensure BOP is never removed without verified dual mechanical barriers.', 1, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'BGH-05' AND (f.canonical_name ILIKE '%Lakadong / Therria%' OR f.canonical_name = 'Lakadong / Therria')
LIMIT 1;
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Lost Circulation', 'MEDIUM', 2480.0, 2520.0, 'Partial loss of returns (40 bbl/hr) in Tipam TS-3 thief zone. Similar loss pattern to NHK-162 event in same stratigraphic interval.', 'Spotted 20 bbl coarse CaCO3 + mica LCM pill. Reduced MW to 10.4 ppg. Losses stopped after 2 pills. Drilled ahead with maintained 10.4 ppg to Tipam base.', 3, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'MOR-12' AND (f.canonical_name ILIKE '%Tipam Sandstone%' OR f.canonical_name = 'Tipam Sandstone')
LIMIT 1;
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Gas Kick', 'HIGH', 3380.0, 3400.0, 'Gas influx at 3,380m in lower Barail coal-shale sequence. Pit gain 18 bbl. SPP increased by 140 psi. Connection gas rose to 280 units.', 'Shut in on annular BOP per OISD-STD-174. Wait & Weight kill with 11.2 ppg mud. Kill verification over 3 circulations. Total event: 8 days. Casing shoe integrity confirmed with LOT.', 98, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'BGH-09' AND (f.canonical_name ILIKE '%Barail Group%' OR f.canonical_name = 'Barail Group')
LIMIT 1;
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Coal Caving / Packoff', 'MEDIUM', 3150.0, 3180.0, 'Severe coal cavings from Tikak Parbat coal seams at 3,150–3,180m. Annulus packed off during POOH. Torque spikes to 22,000 ft-lbs.', 'Circulated clean with high-vis sweeps (30 bbl each, 3 sweeps). Increased MW to 11.0 ppg for better borehole stability. Wiper trips every 50m drilled. Recommendation: maintain inhibitive KCl-polymer mud system in Barail coal intervals.', 65, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'NHK-342' AND (f.canonical_name ILIKE '%Barail Group%' OR f.canonical_name = 'Barail Group')
LIMIT 1;
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Borehole Breakout', 'HIGH', 3780.0, 3820.0, 'Severe borehole breakout and cavings in Kopili reactive shales at 3,780m. Hole enlarged from 8.5" to 14". Caliper log confirmed 65% hole enlargement. Narrow MW window (10.15–10.8 ppg) with pore pressure at 9.9 ppg.', 'Increased MW to 10.8 ppg (approaching fracture gradient at 13.8 ppg). Ran cement squeeze to stabilize worst intervals. Set 7" liner from 3,100m to 3,820m. Recommendation: set 9-5/8" casing shoe deep into Kopili per Kumar & Talreja (2018) geomech study.', 112, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'NHK-656' AND (f.canonical_name ILIKE '%Kopili Formation%' OR f.canonical_name = 'Kopili Formation')
LIMIT 1;
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Overpressure Kick', 'HIGH', 3850.0, 3880.0, 'Severe pore pressure ramp crossing into Kopili Formation. Pore pressure rose from 63 pcf to 74 pcf (8.42 to 9.9 ppg) as predicted by Dasgupta et al. (2019). Pit gain 15 bbl. MW had to be increased from 10.4 to 12.3 ppg.', 'Shut in per OISD-STD-174. Killed with 12.3 ppg weighted mud. Set 7" liner at 3,650m shoe before resuming. Total NPT: 10 days. Lesson: mandatory pre-drill geomechanical model for any Kopili penetration.', 88, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'BGH-21' AND (f.canonical_name ILIKE '%Kopili Formation%' OR f.canonical_name = 'Kopili Formation')
LIMIT 1;
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Gas Kick', 'HIGH', 3220.0, 3240.0, 'Gas influx at 3,220m in Barail sandstone-coal transition. Pit gain 12 bbl over 8 minutes. Background gas surged from 15 to 220 units. SPP flutter +120 psi.', 'Shut in per ONGC SOP. Driller''s Method kill with 11.0 ppg mud. Gas circulated out over 2 bottoms-up. Kill verified over 24 hrs static observation.', 75, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'LK-112' AND (f.canonical_name ILIKE '%Barail Group%' OR f.canonical_name = 'Barail Group')
LIMIT 1;
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Stuck Pipe', 'HIGH', 1720.0, 1720.0, 'Differential sticking at 1,720m in Girujan Clay during pipe connection. String stationary for 8 minutes due to equipment malfunction. Overpull 95,000 lbs could not free string.', 'Spotted 40 bbl OBM soak pill with surfactant. Jarred for 3 days without success. Back-off attempted at 1,710m. Sidetracked with whipstock at 1,680m. Total fishing + sidetrack: 8 days. Lesson learned: never exceed 5 min stationary time in Girujan.', 134, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'RDS-25' AND (f.canonical_name ILIKE '%Girujan Clay%' OR f.canonical_name = 'Girujan Clay')
LIMIT 1;
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Bit Balling', 'LOW', 1830.0, 1870.0, 'Severe bit balling in reactive Girujan clay at 1,850m. ROP dropped from 12 m/hr to 1.5 m/hr. PDC bit cutters completely packed with clay. Torque erratic between 8,000 and 18,000 ft-lbs.', 'POOH to change bit. Ran polycrystalline insert bit with anti-balling coating. Added 5% KCl to mud system for clay inhibition. ROP recovered to 10 m/hr.', 2, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'LK-245' AND (f.canonical_name ILIKE '%Girujan Clay%' OR f.canonical_name = 'Girujan Clay')
LIMIT 1;
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Shallow Gas', 'MEDIUM', 180.0, 195.0, 'Shallow gas pocket encountered at 180m in Dihing Formation gravels. Mud returns became gas-cut (gas units spiked to 450). Minor flow observed at wellhead.', 'Increased pump rate to circulate out gas. Raised MW from 9.5 to 9.8 ppg. Gas dissipated after 3 bottoms-up circulations. Conductor set at 200m with cement to surface.', 1, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'DGB-1001' AND (f.canonical_name ILIKE '%Alluvium / Dihing%' OR f.canonical_name = 'Alluvium / Dihing')
LIMIT 1;
INSERT INTO public.drilling_events (well_id, formation_id, event_type, severity, depth_from_md_m, depth_to_md_m, description, mitigation, source_page, review_status)
SELECT w.id, f.id, 'Lost Circulation', 'MEDIUM', 2450.0, 2600.0, 'Progressive seepage losses escalating to 45 bbl/hr across Tipam TS-3 to TS-5 interval (2,450–2,600m). Three LCM pills required before losses were controlled.', 'Pill 1: 25 bbl coarse CaCO3. Reduced losses to 20 bbl/hr. Pill 2: 30 bbl CaCO3 + mica + cellophane flakes. Reduced to 5 bbl/hr. Pill 3: 20 bbl fine-medium CaCO3 sealer. Full returns restored. Reduced MW from 10.6 to 10.3 ppg.', 58, 'APPROVED'
FROM public.wells w, public.formations f
WHERE w.external_id = 'HGJ-48' AND (f.canonical_name ILIKE '%Tipam Sandstone%' OR f.canonical_name = 'Tipam Sandstone')
LIMIT 1;

-- ALERTS (Active Hazard Advisory Alerts)
INSERT INTO public.alerts (well_id, event_type, severity, status, depth_from_md_m, depth_to_md_m, rationale, recommended_action)
SELECT w.id, 'Gas Kick Precursor', 'CRITICAL', 'OPEN', 2418.0, 2450.0,
  '{"evidence": [{"wells": {"name": "BAGHJAN-5"}, "source_page": 14}, {"wells": {"name": "BAGHJAN-9"}, "source_page": 98}]}'::jsonb,
  '1. Check trip tank & flow sensor calibration. 2. Prepare 12.8 ppg kill mud in reserve pit. 3. Perform remote BOP choke drill per OISD-STD-174.'
FROM public.wells w WHERE w.external_id = 'MOR-29';

INSERT INTO public.alerts (well_id, event_type, severity, status, depth_from_md_m, depth_to_md_m, rationale, recommended_action)
SELECT w.id, 'ROP Deviation', 'MEDIUM', 'ACKNOWLEDGED', 2418.0, 2418.0,
  '{"evidence": [{"wells": {"name": "NAHARKATIYA-162"}, "source_page": 82}]}'::jsonb,
  'Inspect bit dull grading upon next trip; consider increasing WOB from 18.5 to 22 klbs.'
FROM public.wells w WHERE w.external_id = 'MOR-29';

INSERT INTO public.alerts (well_id, event_type, severity, status, depth_from_md_m, depth_to_md_m, rationale, recommended_action)
SELECT w.id, 'Kopili Overpressure Zone Approach', 'HIGH', 'OPEN', 3100.0, 3700.0,
  '{"evidence": [{"wells": {"name": "NAHARKATIYA-656"}, "source_page": 112}, {"wells": {"name": "BAGHJAN-21"}, "source_page": 88}]}'::jsonb,
  'Pre-drill geomechanical model mandatory before Kopili entry. Prepare 12.0 ppg weighted mud. Plan 7 liner shoe at 3,650m.'
FROM public.wells w WHERE w.external_id = 'NHK-561';

INSERT INTO public.alerts (well_id, event_type, severity, status, depth_from_md_m, depth_to_md_m, rationale, recommended_action)
SELECT w.id, 'Tipam Lost Circulation Risk', 'MEDIUM', 'OPEN', 2418.0, 2450.0,
  '{"evidence": [{"wells": {"name": "MORAN-12"}, "source_page": 3}, {"wells": {"name": "HUGRIJAN-48"}, "source_page": 58}]}'::jsonb,
  'Pre-mix 30 bbl coarse CaCO3 + mica LCM pill in slug tank. Maintain MW within 10.2-10.6 ppg.'
FROM public.wells w WHERE w.external_id = 'MOR-29';

-- AUDIT EVENTS
INSERT INTO public.audit_events (actor_id, action, entity_type, entity_id, metadata)
VALUES ('SYSTEM', 'SUPABASE_INIT', 'SYSTEM', 'SYS-INIT', '{"details": "SRISHTI·AI Subsurface Evidence Database initialized in Supabase with Upper Assam stratigraphy."}'::jsonb);
