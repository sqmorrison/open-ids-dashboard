import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

/**
 * /api/stats/roi - returns data for the ROI calculator
 * * Purpose:
 * retreives events and calculates average cost saved. This is primarily for managers and c-suite execs who want to see ROI on this dashboard.
 * * Architecture:
 * - Database: ClickHouse (Optimized for OLAP/Aggregation)
 * - Caching: Force-Dynamic - refreshes with real time data
 * - Input: none
 * - Output: returns total amount saved + cost breakdown
 */ 
 export const dynamic = 'force-dynamic';
 
 export async function GET() {
   try {
     const client = getClickHouseClient();
 
     // Query: Just count alerts by severity for the last 24 hours
     const query = `
       SELECT
         alert_severity as severity,
         count(*) as count
       FROM ids.events
       WHERE timestamp >= now() - INTERVAL 24 HOUR
       AND alert_severity > 0
       GROUP BY alert_severity
     `;
 
     const resultSet = await client.query({
       query: query,
       format: 'JSONEachRow',
     });
 
     const rows = (await resultSet.json()) as { severity: number; count: string | number }[];
 
     // Transform into a clean object: { critical: 12, high: 45, medium: 120 }
     // Suricata Standard: 1=Critical, 2=High, 3=Medium
     const stats = {
       critical: 0,
       high: 0,
       medium: 0
     };
 
     rows.forEach(row => {
       const count = Number(row.count);
       if (row.severity === 1) stats.critical += count;
       if (row.severity === 2) stats.high += count;
       if (row.severity === 3) stats.medium += count;
     });
 
     return NextResponse.json(stats);
   } catch (error) {
     console.error('Error fetching severity stats:', error);
     return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
   }
 }