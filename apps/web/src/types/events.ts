export interface IDSEvent {
  event_uuid: string;
  current_status: string; // 'New', 'Investigating', 'Resolved', etc.
  analyst_notes?: string;
  
  timestamp: string | number;
  src_ip: string;
  src_port: number;
  dest_ip: string;
  dest_port: number;
  alert_severity: number;
  alert_signature: string;
  alert_category?: string;
  alert_action?: string;
  proto?: string;
  src_country?: string;
  src_country_code?: string;
  
  // Optional raw data
  raw_json?: string;
}

export interface IDSIncident {
  src_ip: string;
  src_country: string;
  src_country_code: string;
  alert_signature: string;
  alert_severity: number;
  count: number;
  first_seen: string;
  last_seen: string;
}

export type TimeRange = '1H' | '12H' | '24H';