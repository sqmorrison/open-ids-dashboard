import { createClient } from '@clickhouse/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const client = createClient({
    host: process.env.CLICKHOUSE_HOST,
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD,
  });

  try {
    // Query: Count events per minute for the last 60 minutes.
    // WITH FILL STEP 60 ensures we get a row for every minute, even if count is 0.
    const query = `
      SELECT
        toStartOfMinute(timestamp) as time,
        count(*) as count
      FROM ids.events
      WHERE timestamp >= now() - INTERVAL 1 HOUR
      GROUP BY time
      ORDER BY time ASC
      WITH FILL STEP 60
    `;

    const resultSet = await client.query({
      query: query,
      format: 'JSONEachRow',
    });

    const data = await resultSet.json();
    
    // Format the time slightly for the frontend if needed, 
    // though passing ISO string is usually fine for Recharts to handle.
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching traffic stats:', error);
    return NextResponse.json({ error: 'Failed to fetch traffic stats' }, { status: 500 });
  }
}