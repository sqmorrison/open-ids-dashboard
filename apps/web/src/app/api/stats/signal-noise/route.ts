import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getClickHouseClient();

    const resultSet = await client.query({
      query: `
        SELECT
            -- Minute-by-minute grouping for the last hour
            formatDateTime(toStartOfMinute(timestamp), '%H:%M') as time_label,
            toStartOfMinute(timestamp) as raw_time,
            
            -- Signal (Crit/High) vs Noise (Med/Low)
            countIf(alert_severity <= 2) as signal,
            countIf(alert_severity > 2) as noise
            
        FROM ids.events
        WHERE timestamp >= now() - INTERVAL 1 HOUR
        GROUP BY raw_time, time_label
        ORDER BY raw_time ASC
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