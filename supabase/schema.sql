-- SRISHTI AI: execute this file once in Supabase SQL Editor.
-- All operational facts carry source provenance; no AI output is an approved fact by itself.
create extension if not exists pgcrypto;
create extension if not exists postgis;
create extension if not exists vector;

create type public.document_status as enum ('RECEIVED','TEXT_EXTRACTED','EXTRACTING','REVIEW_REQUIRED','APPROVED','FAILED');
create type public.review_status as enum ('PENDING','APPROVED','REJECTED','CORRECTED');
create type public.alert_status as enum ('OPEN','ACKNOWLEDGED','RESOLVED','EXPIRED');

create table if not exists public.wells (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null unique,
  field text,
  block text,
  status text not null default 'PLANNING',
  well_type text,
  surface_location geography(point,4326),
  target_depth_md_m numeric,
  current_depth_md_m numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wells_surface_location_gix on public.wells using gist(surface_location);

create table if not exists public.formations (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  group_name text,
  lithology text,
  color text not null default '#64748b'
);

create table if not exists public.well_formations (
  id uuid primary key default gen_random_uuid(),
  well_id uuid not null references public.wells(id) on delete cascade,
  formation_id uuid not null references public.formations(id),
  top_md_m numeric not null,
  base_md_m numeric not null,
  top_tvdss_m numeric,
  base_tvdss_m numeric,
  correlation_confidence numeric check (correlation_confidence between 0 and 1),
  source_document_id uuid,
  unique(well_id, formation_id, top_md_m)
);

create table if not exists public.source_documents (
  id uuid primary key default gen_random_uuid(),
  original_filename text not null,
  storage_path text not null unique,
  sha256 text not null unique,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  well_id uuid references public.wells(id),
  document_type text,
  page_count integer,
  processing_status public.document_status not null default 'RECEIVED',
  processing_error text,
  created_by uuid,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.document_pages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.source_documents(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  extracted_text text not null default '',
  ocr_confidence numeric check (ocr_confidence between 0 and 1),
  unique(document_id,page_number)
);

create table if not exists public.extraction_candidates (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.source_documents(id) on delete cascade,
  page_number integer,
  entity_type text not null,
  payload jsonb not null,
  extraction_method text not null,
  model_name text,
  confidence numeric check (confidence between 0 and 1),
  review_status public.review_status not null default 'PENDING',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.drilling_events (
  id uuid primary key default gen_random_uuid(),
  well_id uuid not null references public.wells(id) on delete cascade,
  formation_id uuid references public.formations(id),
  event_type text not null,
  severity text not null check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  depth_from_md_m numeric not null,
  depth_to_md_m numeric,
  description text not null,
  mitigation text,
  source_document_id uuid references public.source_documents(id),
  source_page integer,
  review_status public.review_status not null default 'PENDING',
  created_at timestamptz not null default now()
);
create index if not exists drilling_events_well_depth_idx on public.drilling_events(well_id, depth_from_md_m);

create table if not exists public.telemetry_samples (
  id bigint generated always as identity primary key,
  well_id uuid not null references public.wells(id) on delete cascade,
  observed_at timestamptz not null,
  measured_depth_m numeric not null,
  tvd_m numeric,
  rop_m_per_hr numeric,
  wob_klbs numeric,
  rpm numeric,
  spp_psi numeric,
  torque_ft_lbs numeric,
  mud_weight_ppg numeric,
  source text not null,
  unique(well_id, observed_at, source)
);
create index if not exists telemetry_well_time_idx on public.telemetry_samples(well_id, observed_at desc);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  well_id uuid not null references public.wells(id) on delete cascade,
  event_type text not null,
  severity text not null check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  status public.alert_status not null default 'OPEN',
  depth_from_md_m numeric,
  depth_to_md_m numeric,
  rationale jsonb not null,
  recommended_action text not null,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  action_taken text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.nearby_wells(target_lat double precision, target_lon double precision, radius_km double precision)
returns table(id uuid, external_id text, name text, field text, status text, lat double precision, lon double precision, distance_km double precision)
language sql stable as $$
  select w.id, w.external_id, w.name, w.field, w.status,
         st_y(w.surface_location::geometry), st_x(w.surface_location::geometry),
         st_distance(w.surface_location, st_setsrid(st_makepoint(target_lon,target_lat),4326)::geography) / 1000.0
  from public.wells w
  where w.surface_location is not null
    and st_dwithin(w.surface_location, st_setsrid(st_makepoint(target_lon,target_lat),4326)::geography, radius_km * 1000.0)
  order by st_distance(w.surface_location, st_setsrid(st_makepoint(target_lon,target_lat),4326)::geography);
$$;

insert into storage.buckets (id, name, public) values ('srishti-documents', 'srishti-documents', false)
on conflict (id) do nothing;

alter table public.wells enable row level security;
alter table public.formations enable row level security;
alter table public.well_formations enable row level security;
alter table public.source_documents enable row level security;
alter table public.document_pages enable row level security;
alter table public.extraction_candidates enable row level security;
alter table public.drilling_events enable row level security;
alter table public.telemetry_samples enable row level security;
alter table public.alerts enable row level security;
alter table public.audit_events enable row level security;

-- The FastAPI backend uses Supabase's service-role key; browser clients never access these tables directly.
