import { createClient } from '@clickhouse/client';
import { NextResponse } from 'next/server';

/**
 * /api/stats/roi - returns data for the 
 * * Purpose:
 * retreives events and calculates average cost saved. This is primarily for managers and c-suite execs who want to see ROI on this dashboard.
 * * Architecture:
 * - Database: ClickHouse (Optimized for OLAP/Aggregation)
 * - Caching: Force-Dynamic - refreshes with real time data
 * - Input: none
 * - Output: returns total amount saved + cost breakdown
 */

// shape of the data coming from ClickHouse
interface AlertStatsRow {
  category: string;
  severity: number;
  count: number | string; // UInt64 is often returned as a string to prevent overflow in JS
}

// shape of the ROI Breakdown item
interface RoiBreakdownItem {
  category: string;
  count: number;
  saved: number;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  const client = createClient({
    host: process.env.CLICKHOUSE_HOST,
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD,
  });

  try {
    const query = `
      SELECT
        alert_category as category,
        alert_severity as severity,
        count(*) as count
      FROM ids.events
      WHERE timestamp >= now() - INTERVAL 24 HOUR
      AND alert_severity > 0
      GROUP BY category, severity
    `;

    const resultSet = await client.query({
      query: query,
      format: 'JSONEachRow',
    });

    // Cast the result to our interface
    const data = (await resultSet.json()) as AlertStatsRow[];
    
    const roiStats = calculateROI(data);

    return NextResponse.json(roiStats);
  } catch (error) {
    console.error('Error fetching ROI stats:', error);
    return NextResponse.json({ error: 'Failed to fetch ROI stats' }, { status: 500 });
  }
}

const COST_MATRIX: Record<string, number> = {
  'A Network Trojan was detected': 15000, 
  'Potentially Bad Traffic': 500,
  'Attempted Information Leak': 3500,
  'Web Application Attack': 5000,
  'SEV_1': 10000,
  'SEV_2': 1000,
  'SEV_3': 100,
};

function calculateROI(data: AlertStatsRow[]) {
  let totalSaved = 0;
  const breakdown: RoiBreakdownItem[] = [];

  data.forEach((row) => {
    let costPerUnit = 0;
    
    // Ensure count is a number (handle string return from ClickHouse UInt64)
    const count = typeof row.count === 'string' ? parseInt(row.count, 10) : row.count;

    if (COST_MATRIX[row.category]) {
      costPerUnit = COST_MATRIX[row.category];
    } 
    else if (row.severity === 1) costPerUnit = COST_MATRIX['SEV_1'];
    else if (row.severity === 2) costPerUnit = COST_MATRIX['SEV_2'];
    else costPerUnit = COST_MATRIX['SEV_3'];

    const totalForCategory = costPerUnit * count;
    totalSaved += totalForCategory;

    breakdown.push({
      category: row.category || 'Unknown Threat',
      count: count,
      saved: totalForCategory
    });
  });

  return {
    totalSaved,
    breakdown: breakdown.sort((a, b) => b.saved - a.saved)
  };
}