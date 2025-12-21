import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

/**
 * /api/events/route.ts - returns information on events based on clickup database based on suricata
 * * Purpose:
 * returns raw logs up to 100 events. Core display feature in dashboard.
 * * Architecture:
 * - Database: ClickHouse (Optimized for OLAP/Aggregation)
 * - Caching: none
 * - Input: can take in a string to match to event type or IPV4 address
 */

const MAX_EVENTS_LIMIT = 100;
const MAX_SEARCH_QUERY_LENGTH = 200;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let query = searchParams.get('search') || '';
  
  // Validate and sanitize search input
  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Search query exceeds maximum length of ${MAX_SEARCH_QUERY_LENGTH} characters` },
      { status: 400 }
    );
  }
  query = query.trim();
  
  try {
    const client = getClickHouseClient();

    let sql = `
      SELECT * FROM ids.events 
      WHERE 1=1
    `;
    
    const queryParams: Record<string, string | number> = {};

    if (query) {
      sql += `
        AND (
          alert_signature ilike {query_wild:String} OR
          concat(toString(src_ip), ':', toString(src_port)) ilike {query_wild:String} OR
          concat(toString(dest_ip), ':', toString(dest_port)) ilike {query_wild:String}
        )
      `;

      queryParams.query_wild = `%${query}%`;
    }

    sql += ` ORDER BY timestamp DESC LIMIT ${MAX_EVENTS_LIMIT}`;

    const resultSet = await client.query({
      query: sql,
      format: 'JSONEachRow',
      query_params: queryParams,
    });

    const data = await resultSet.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('ClickHouse Error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}