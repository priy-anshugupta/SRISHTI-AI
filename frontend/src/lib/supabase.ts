import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fsoioyteimbcoesuuqxl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_1ypf3B6vi-sEbxhQDweuZQ_XbITiWMI';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Type definitions matching database schema
export interface Well {
  id: string;
  name: string;
  field: string;
  block: string;
  lat: number;
  lon: number;
  spud_date: string;
  td_depth_md: number;
  target_depth_md: number;
  status: string;
  rig: string;
  well_type: string;
  current_formation: string;
  current_rop: number;
  active_hazard_distance_m: number;
  primary_hazard?: string;
  total_npt_hrs?: number;
}

export interface Formation {
  id?: string;
  name: string;
  group_name: string;
  lithology: string;
  depth_top_md: number;
  depth_bottom_md: number;
  avg_rop: number;
  drill_time_days: number;
  npt_hrs: number;
  primary_hazard: string;
  color: string;
}

export interface DrillingEvent {
  id: string;
  well_id: string;
  event_type: string;
  formation: string;
  depth_md: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  npt_cost_inr: number;
  duration_hrs: number;
  description: string;
  mitigation: string;
  source_doc: string;
  source_page: number;
  reviewer_status: 'APPROVED' | 'PENDING' | 'REJECTED';
  verified_by?: string;
}

export interface IngestedDocument {
  id: string;
  filename: string;
  doc_type: string;
  well_id: string;
  pages: number;
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'NEEDS_REVIEW';
  confidence: number;
  entities_count: number;
  processing_time_s: number;
  raw_excerpt?: string;
  extracted_facts?: {
    field: string;
    value: string;
    confidence: number;
    verified: boolean;
  }[];
}

export interface AlertRecord {
  id: string;
  well_id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  title: string;
  description: string;
  recommended_action: string;
  offset_wells: string[];
  depth_md: number;
  hazard_horizon_md: number;
  distance_to_hazard_m: number;
  acknowledged: boolean;
  acknowledged_by?: string;
  action_taken?: string;
  timestamp?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
}
