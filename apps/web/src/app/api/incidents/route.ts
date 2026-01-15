import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

export const dynamic = 'force-dynamic';

interface IncidentRow {
  src_ip: string;
  src_country: string | null;
  src_country_code: string | null;
  alert_signature: string;
  alert_severity: number;
  count: string | number;
  first_seen: string;
  last_seen: string;
}

export async function GET() {
  try {
    const client = getClickHouseClient();
    
    const resultSet = await client.query({
      query: `
        SELECT
            -- FIX 1: Convert IPv4 to String for safe grouping/JSON
            toString(src_ip) as src_ip,
            
            alert_signature,
            
            -- FIX 2: Get the most recent country info (better than 'any')
            argMax(src_country, timestamp) as src_country,
            argMax(src_country_code, timestamp) as src_country_code,
            
            -- Stats
            min(alert_severity) as alert_severity, -- Take the highest severity (lowest number) seen
            count() as count,
            min(timestamp) as first_seen,
            max(timestamp) as last_seen

        FROM ids.events
        
        -- FIX 3: Restrict to last 24 hours (Performance + Relevance)
        WHERE timestamp >= now() - INTERVAL 24 HOUR
        
        GROUP BY src_ip, alert_signature
        ORDER BY last_seen DESC
        LIMIT 50
      `,
      format: 'JSONEachRow',
    });

    const rawData = (await resultSet.json()) as unknown as IncidentRow[];

    const processedData = rawData.map((item) => ({
      src_ip: item.src_ip,
      alert_signature: item.alert_signature,
      alert_severity: Number(item.alert_severity),
      // ClickHouse 64-bit ints often come as strings in JSON
      count: Number(item.count), 
      first_seen: item.first_seen,
      last_seen: item.last_seen,
      src_country: item.src_country || 'Unknown',
      src_country_code: item.src_country_code || 'XX',
    }));

    return NextResponse.json(processedData);

  } catch (error) {
    console.error('ClickHouse Incident Query Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    ); 
  }
}