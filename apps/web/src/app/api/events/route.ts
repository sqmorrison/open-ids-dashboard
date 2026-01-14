import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    const client = getClickHouseClient();

    // Base query
    let whereClause = "WHERE timestamp >= now() - INTERVAL 24 HOUR";
    
    // Simple search filter
    if (search) {
      whereClause += ` AND (src_ip ILIKE '%${search}%' OR alert_signature ILIKE '%${search}%')`;
    }

    const resultSet = await client.query({
      query: `
        SELECT
          timestamp,
          src_ip,
          src_port,
          dest_ip,
          dest_port,
          alert_signature,
          alert_severity,
          alert_category,
          src_country,
          src_country_code,
          raw_json  -- <--- VITAL: Fetch the raw data
        FROM ids.events
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT 100
      `,
      format: 'JSONEachRow',
    });

    const data = await resultSet.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Events API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}