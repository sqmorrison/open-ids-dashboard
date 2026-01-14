import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

export const dynamic = 'force-dynamic';

interface IncidentRow {
  src_ip: string;
  src_country: string | null;
  src_country_code: string | null;
  alert_signature: string;
  alert_severity: number;
  count: string | number; // Handle both possibilities safely
  first_seen: string;
  last_seen: string;
}

export async function GET() {
  try {
    const client = getClickHouseClient();
    
    const resultSet = await client.query({
      query: `
        SELECT
            src_ip,
            any(src_country) as src_country,
            any(src_country_code) as src_country_code,
            alert_signature,
            any(alert_severity) as alert_severity,
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

    // FIX: Force cast the result to ensure TS knows it is an Array of Objects
    const rawData = (await resultSet.json()) as unknown as IncidentRow[];

    const processedData = rawData.map((item) => ({
      src_ip: item.src_ip,
      alert_signature: item.alert_signature,
      alert_severity: Number(item.alert_severity), // Ensure number
      // Handle the count safely
      count: typeof item.count === 'string' ? parseInt(item.count, 10) : item.count,
      first_seen: item.first_seen,
      last_seen: item.last_seen,
      // Handle defaults
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