import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { sql } = await req.json();

    if (!sql) {
      return NextResponse.json({ error: "No SQL provided" }, { status: 400 });
    }

    // Must start with SELECT (case insensitive, allowing for whitespace)
    if (!/^\s*SELECT/i.test(sql)) {
       return NextResponse.json({ error: "Only SELECT queries are allowed." }, { status: 403 });
    }

    // Block destructive keywords just in case
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'INSERT', 'UPDATE'];
    const upperSql = sql.toUpperCase();
    const hasDanger = dangerousKeywords.some(keyword => upperSql.includes(keyword));
    
    if (hasDanger) {
      return NextResponse.json({ error: "Destructive commands are blocked." }, { status: 403 });
    }
    // ----------------------

    const client = getClickHouseClient();
    
    const resultSet = await client.query({
      query: sql,
      format: 'JSONEachRow',
    });

    const data = await resultSet.json();

    return NextResponse.json({ data });

  } catch (error) {
    console.error('SQL Execution Error:', error);
    // Return the actual DB error message so the user knows what syntax failed
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}