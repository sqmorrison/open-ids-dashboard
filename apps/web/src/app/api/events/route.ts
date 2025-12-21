import { createClient } from '@clickhouse/client';
import { NextResponse } from 'next/server';

/**
 * /api/events/route.ts - returns information on events based on clickup database based on suricata
 * * Purpose:
 * returns raw logs up to 100 events. Core display feature in dashboard.
 * * Architecture:
 * - Database: ClickHouse (Optimized for OLAP/Aggregation)
 * - Caching: none
 * - Input: can take in a string to match to event type or IPV4 address
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('search') || '';
  
  const client = createClient({
    host: process.env.CLICKHOUSE_HOST,
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD,
  });

  try {      
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
  
      sql += ` ORDER BY timestamp DESC LIMIT 100`;
  
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