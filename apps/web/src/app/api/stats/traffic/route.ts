import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

/**
 * /api/stats/traffic - provides traffic (event) info to the chart feature on dashboard
 * * Purpose:
 * This chart displays the number of events relative to time running. This allows analysts to track peak hours of traffic, and make decisions accordingly.
 * * Architecture:
 * - Database: ClickHouse (Optimized for OLAP/Aggregation)
 * - Caching: none - will auto update with each poll on frontend
 * - Input: none
 * - Output: number of events aggregated by minute
 */

const TRAFFIC_WINDOW_HOURS = 1;
const FILL_STEP_SECONDS = 60;

export async function GET() {
  try {
    const client = getClickHouseClient();

    // Query: Count events per minute for the last hour.
    // WITH FILL STEP ensures we get a row for every minute, even if count is 0.
    const query = `
      SELECT
        toStartOfMinute(timestamp) as time,
        count(*) as count
      FROM ids.events
      WHERE timestamp >= now() - INTERVAL ${TRAFFIC_WINDOW_HOURS} HOUR
      GROUP BY time
      ORDER BY time ASC
      WITH FILL STEP ${FILL_STEP_SECONDS}
    `;

    const resultSet = await client.query({
      query: query,
      format: 'JSONEachRow',
    });

    const data = await resultSet.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching traffic stats:', error);
    return NextResponse.json({ error: 'Failed to fetch traffic stats' }, { status: 500 });
  }
}