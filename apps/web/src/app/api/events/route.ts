import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') || '100';
    const client = getClickHouseClient();

    const queryParams: Record<string, string | number> = {
      limit: parseInt(limit, 10),
    };

    let searchCondition = "";

    if (search) {
      queryParams.search_term = `%${search}%`;
      searchCondition = "AND (toString(e.src_ip) ILIKE {search_term:String} OR e.alert_signature ILIKE {search_term:String})";
    }

    const resultSet = await client.query({
      query: `
        SELECT
          e.event_uuid,
          e.timestamp,
          e.src_ip,
          e.src_port,
          e.dest_ip,
          e.dest_port,
          e.alert_signature,
          e.alert_severity,
          e.alert_category,
          e.src_country,
          e.src_country_code,
          e.raw_json,
          
          -- Status with default
          ifNull(t.status, 'New') as current_status,
          
          -- Notes with default (Safe against nulls)
          ifNull(t.analyst_notes, '') as analyst_notes

        FROM ids.events e
        
        -- Join with the latest triage data
        LEFT JOIN (
           SELECT 
             event_uuid, 
             argMax(status, updated_at) as status,
             argMax(analyst_notes, updated_at) as analyst_notes
           FROM ids.alert_triage
           GROUP BY event_uuid
        ) t ON e.event_uuid = t.event_uuid

        WHERE e.timestamp >= now() - INTERVAL 24 HOUR
        ${searchCondition}
        
        ORDER BY e.timestamp DESC
        LIMIT {limit:UInt32}
      `,
      query_params: queryParams,
      format: 'JSONEachRow',
    });

    const data = await resultSet.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Events API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}