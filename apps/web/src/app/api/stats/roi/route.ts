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

const ROI_WINDOW_HOURS = 24;
const SEVERITY_CRITICAL = 1;
const SEVERITY_HIGH = 2;
const SEVERITY_MEDIUM = 3;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getClickHouseClient();

    const query = `
      SELECT
        alert_category as category,
        alert_severity as severity,
        count(*) as count
      FROM ids.events
      WHERE timestamp >= now() - INTERVAL ${ROI_WINDOW_HOURS} HOUR
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
    else if (row.severity === SEVERITY_CRITICAL) costPerUnit = COST_MATRIX['SEV_1'];
    else if (row.severity === SEVERITY_HIGH) costPerUnit = COST_MATRIX['SEV_2'];
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