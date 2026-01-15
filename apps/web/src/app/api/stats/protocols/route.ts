import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getClickHouseClient();

    const resultSet = await client.query({
      query: `
        SELECT
            -- Handle empty protocol strings by defaulting to 'TCP'
            if(proto = '', 'TCP', proto) as name,
            count() as value
        FROM ids.events
        WHERE timestamp >= now() - INTERVAL 24 HOUR
        GROUP BY name
        ORDER BY value DESC
        LIMIT 5
      `,
      format: 'JSONEachRow',
    });

    const data = await resultSet.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Protocol API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch protocols' }, { status: 500 });
  }
}