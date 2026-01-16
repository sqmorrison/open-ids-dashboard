import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getClickHouseClient();

    const resultSet = await client.query({
      query: `
        SELECT
            -- Ensure we handle empty strings or nulls gracefully
            if(src_country_code = '', 'Unknown', src_country_code) as src_country_code,
            if(src_country = '', 'Unknown', src_country) as src_country,
            toInt32(count(*)) as count
        FROM ids.events
        WHERE timestamp >= now() - INTERVAL 24 HOUR
        -- TEMPORARY: Comment this out to see if ANY data is actually there
        -- AND src_country_code != 'XX' 
        GROUP BY src_country_code, src_country
        HAVING count > 0
        ORDER BY count DESC
      `,
      format: 'JSONEachRow',
    });

    const data = await resultSet.json();
    console.log("Map Data from ClickHouse:", data); // Check your server console!
    return NextResponse.json(data);

  } catch (error) {
    console.error('Map Stats Error:', error);
    return NextResponse.json({ error: 'Failed to fetch map stats' }, { status: 500 });
  }
}