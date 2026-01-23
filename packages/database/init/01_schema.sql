CREATE DATABASE IF NOT EXISTS ids;

---
-- 1. Main Events Table (The Fact Table)
---
CREATE TABLE IF NOT EXISTS ids.events (
    event_uuid UUID DEFAULT generateUUIDv4(),
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

    -- GeoIP Data for Heat Map
    src_country String,
    src_country_code LowCardinality(String), -- Optimized for grouping/filtering
    
    -- Deep Inspection
    raw_json String
) 
ENGINE = MergeTree()
-- Daily partitioning allows for more granular TTL "drops" to save local disk
PARTITION BY toYYYYMMDD(timestamp) 
-- Primary sort key: Timestamp is first for time-travel queries
ORDER BY (timestamp, alert_severity, event_type, src_ip)
-- Auto-delete logs older than 30 days to keep local storage clean
TTL timestamp + INTERVAL 30 DAY
SETTINGS ttl_only_drop_parts = 1;

---
-- 2. Triage Table (The Workflow Table)
---
-- Using ReplacingMergeTree so that only the "latest" status for a UUID is kept
CREATE TABLE IF NOT EXISTS ids.alert_triage (
    event_uuid UUID,
    status Enum8(
        'New' = 1, 
        'Investigating' = 2, 
        'Resolved' = 3, 
        'False Positive' = 4
    ),
    analyst_notes String,
    updated_at DateTime DEFAULT now()
) 
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (event_uuid)
-- Keep analyst notes for 90 days (longer than the raw logs)
TTL updated_at + INTERVAL 90 DAY;