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
            IPv4NumToString(e.src_ip) as src_ip,
            e.alert_signature,
            argMax(e.src_country, e.timestamp) as src_country,
            argMax(e.src_country_code, e.timestamp) as src_country_code,
            
            -- The alias that caused the confusion:
            min(e.alert_severity) as alert_severity,
            
            count() as count,
            min(e.timestamp) as first_seen,
            max(e.timestamp) as last_seen

        -- FIX 1: Give the table an alias 'e'
        FROM ids.events e
        
        WHERE 
          e.timestamp >= now() - INTERVAL 6 HOUR
          
          -- FIX 2: Explicitly reference 'e.alert_severity' (the column)
          -- instead of just 'alert_severity' (which matches the alias above)
          AND e.alert_severity <= 2

        GROUP BY e.src_ip, e.alert_signature
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