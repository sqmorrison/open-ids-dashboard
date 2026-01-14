import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '1H';

    const client = getClickHouseClient();

    // Default configuration (1 Hour)
    let timeWindowHours = 1;
    let groupByFunction = "toStartOfMinute(timestamp)";
    let stepSeconds = 60; 

    // Adjust query params based on selected range
    switch (range) {
        case '12H':
            timeWindowHours = 12;
            groupByFunction = "toStartOfHour(timestamp)";
            stepSeconds = 3600; // Fill every 1 hour
            break;
        case '24H':
            timeWindowHours = 24;
            groupByFunction = "toStartOfHour(timestamp)";
            stepSeconds = 3600; // Fill every 1 hour
            break;
        case '1H':
        default:
            timeWindowHours = 1;
            groupByFunction = "toStartOfMinute(timestamp)";
            stepSeconds = 60;   // Fill every 1 minute
            break;
    }

    // FIX: Removed formatDateTime(). 
    // We select the raw DateTime object so 'WITH FILL' can calculate the gaps.
    const query = `
      SELECT
        ${groupByFunction} as time,
        count(*) as count
      FROM ids.events
      WHERE timestamp >= now() - INTERVAL ${timeWindowHours} HOUR
      GROUP BY time
      ORDER BY time ASC
      WITH FILL STEP ${stepSeconds}
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