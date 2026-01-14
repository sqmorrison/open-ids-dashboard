import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getClickHouseClient();

    // Group by Country Code (e.g., "US", "CN", "RU")
    const resultSet = await client.query({
      query: `
        SELECT
            src_country_code,
            src_country,
            count(*) as count
        FROM ids.events
        WHERE timestamp >= now() - INTERVAL 24 HOUR
        AND src_country_code != 'XX' -- Ignore internal/unknown
        GROUP BY src_country_code, src_country
        ORDER BY count DESC
      `,
      format: 'JSONEachRow',
    });

    const data = await resultSet.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Map Stats Error:', error);
    return NextResponse.json({ error: 'Failed to fetch map stats' }, { status: 500 });
  }
}