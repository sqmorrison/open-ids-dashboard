import { NextResponse } from 'next/server';
import { createClient } from '@clickhouse/client';

// 1. Define what the raw row looks like from the DB
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

const client = createClient({
  host: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER,
  password: process.env.CLICKHOUSE_PASSWORD,
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 2. Query - I've removed 'event_type' and 'alert_severity' temporarily
    // to prevent crashes if those columns don't exist yet.
    const resultSet = await client.query({
      query: `
        SELECT
            src_ip,
            any(src_country) as src_country,
            any(src_country_code) as src_country_code,
            alert_signature,
            count() as count,
            min(timestamp) as first_seen,
            max(timestamp) as last_seen
        FROM ids.events
        GROUP BY src_ip, alert_signature
        ORDER BY last_seen DESC
        LIMIT 50
      `,
      format: 'JSONEachRow',
    });

    const rawData = await resultSet.json<IncidentRow>();

    // 3. Map safely to your frontend type
    const safeData = rawData.map((row) => ({
      src_ip: row.src_ip,
      src_country: row.src_country,
      src_country_code: row.src_country_code,
      alert_signature: row.alert_signature,
      // Parse the count (ClickHouse UInt64 comes as string to avoid overflow)
      count: parseInt(row.count, 10), 
      first_seen: row.first_seen,
      last_seen: row.last_seen,
      // Default severity since we removed it from the query
      alert_severity: 3, 
    }));

    return NextResponse.json(safeData);
  } catch (error) {
    console.error('ClickHouse Incident Query Error:', error);
    // Return empty array instead of 500 so the UI doesn't crash completely
    return NextResponse.json([], { status: 200 }); 
  }
}