import { createClient } from '@clickhouse/client';
import { NextResponse } from 'next/server';
import { sendCriticalAlert } from '@/lib/email';

// Prevent caching
export const dynamic = 'force-dynamic';

export async function GET() {
  const client = createClient({
    host: process.env.CLICKHOUSE_HOST,
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD,
  });

  try {
    // 1. Query for RECENT Critical Threats (Last 60 seconds)
    // We group by signature/IP so we don't send 100 emails for 100 packets.
    const query = `
      SELECT
        alert_signature as signature,
        src_ip,
        count(*) as count
      FROM ids.events
      WHERE timestamp >= now() - INTERVAL 1 MINUTE
      AND alert_severity = 1
      GROUP BY signature, src_ip
    `;

    const resultSet = await client.query({
      query: query,
      format: 'JSONEachRow',
    });

    const alerts = await resultSet.json() as { signature: string, src_ip: string, count: number }[];

    // 2. Process Alerts
    if (alerts.length === 0) {
      return NextResponse.json({ status: 'No critical alerts found in last minute' });
    }

    // 3. Send Emails (in parallel if multiple distinct threats)
    const emailPromises = alerts.map(alert => 
      sendCriticalAlert({
        signature: alert.signature,
        source_ip: alert.src_ip,
        count: alert.count
      })
    );

    await Promise.all(emailPromises);

    return NextResponse.json({ 
      status: 'Alerts sent', 
      count: alerts.length, 
      details: alerts 
    });

  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}