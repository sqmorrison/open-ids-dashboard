export interface IDSEvent {
  timestamp: string;
  event_type: string;
  src_ip: string;
  src_port: number;
  dest_ip: string;
  dest_port: number;
  proto: string;
  alert_signature: string;
  alert_severity: number;
  alert_action: string;
}