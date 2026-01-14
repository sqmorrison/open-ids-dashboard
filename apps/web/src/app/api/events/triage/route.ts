import { NextResponse } from 'next/server';
import { createClient } from '@clickhouse/client';

const client = createClient({
  host: process.env.CLICKHOUSE_HOST ?? 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER ?? 'default',
  password: process.env.CLICKHOUSE_PASSWORD ?? '',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event_uuid, status, notes } = body;

    if (!event_uuid || !status) {
      return NextResponse.json({ error: 'Missing UUID or Status' }, { status: 400 });
    }

    // Insert the new status into the triage table
    await client.insert({
      table: 'ids.alert_triage',
      values: [
        {
          event_uuid,
          status,
          analyst_notes: notes || '',
          updated_at: Date.now(), // ClickHouse client handles JS Date -> DateTime64 automatically
        },
      ],
      format: 'JSONEachRow',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ClickHouse Insert Error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}