CREATE DATABASE IF NOT EXISTS ids;

-- The main event table
CREATE TABLE IF NOT EXISTS ids.events (
    timestamp DateTime64(3),
    event_type String,         
    src_ip IPv4,
    src_port UInt16,
    dest_ip IPv4,
    dest_port UInt16,
    proto String,
    
    -- Specific Alert Data
    alert_action String,        
    alert_signature String,  
    alert_severity UInt8,
    alert_category String,
    
    raw_json String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, event_type, src_ip);