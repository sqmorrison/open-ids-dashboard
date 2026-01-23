import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getClickHouseClient();

    const resultSet = await client.query({
      query: `
        SELECT
            toStartOfMinute(timestamp) as raw_time,
            
            -- Cast counts to integers
            toInt32(countIf(alert_severity <= 2)) as signal,
            toInt32(countIf(alert_severity > 2)) as noise
            
        FROM ids.events
        -- Set to exactly 1 hour window
        WHERE timestamp >= now() - INTERVAL 1 HOUR
        GROUP BY raw_time
        
        ORDER BY raw_time ASC WITH FILL STEP 60
      `,
      format: 'JSONEachRow',
    });

    const data = await resultSet.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Signal/Noise API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}