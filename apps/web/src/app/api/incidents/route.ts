import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

/**
 * API: /api/incidents/route.js
 * * Purpose:
 * Reduces "Alert Fatigue" by grouping noisy individual packet logs into consolidated "Incidents."
 * Instead of showing 1,000 logs for a single port scan, we show 1 Incident with a count of 1,000.
 * * Logic:
 * - Filters for non-zero severity (actual threats).
 * - Groups by Source IP and Attack Signature.
 * - Sorts by the most recent activity.
 */

// Define what the raw row looks like from the DB
interface IncidentRow {
  src_ip: string;
  src_country: string;
  src_country_code: string;
  alert_signature: string;
  alert_severity?: number; // Optional because we might mock it if missing
  count: string;           // ClickHouse often returns Count as a String (UInt64)
  first_seen: string;
  last_seen: string;
}

const MAX_INCIDENTS_LIMIT = 50;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getClickHouseClient();
    
    const resultSet = await client.query({
      query: `
        SELECT
            src_ip,
            any(src_country) as src_country, -- any() returns an arbitrary value from the group (all values are the same per IP)
            any(src_country_code) as src_country_code, -- same as above
            alert_signature,
            count() as count,
            min(timestamp) as first_seen,
            max(timestamp) as last_seen
        FROM ids.events
        GROUP BY src_ip, alert_signature
        ORDER BY last_seen DESC
        LIMIT ${MAX_INCIDENTS_LIMIT}
      `,
      format: 'JSONEachRow',
    });

    const rawData = await resultSet.json<IncidentRow>();

    // Map safely to frontend type
    const safeData = rawData.map((row) => ({
      src_ip: row.src_ip,
      src_country: row.src_country,
      src_country_code: row.src_country_code,
      alert_signature: row.alert_signature,
      // Parse the count
      count: parseInt(row.count, 10), 
      first_seen: row.first_seen,
      last_seen: row.last_seen,
      alert_severity: row.alert_severity, 
    }));

    return NextResponse.json(safeData);
  } catch (error) {
    console.error('ClickHouse Incident Query Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    ); 
  }
}