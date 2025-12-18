import { createClient } from '@clickhouse/client';
import { NextResponse } from 'next/server';

export async function GET() {
  // 1. Initialize the client (Note: In production, we'd use environment variables)
  const client = createClient({
    url: 'http://localhost:8123',
    database: 'ids',
    username: 'default',
    password: 'admin',
  });

  try {
    // 2. Query the data
    const resultSet = await client.query({
      query: `
        SELECT * FROM events 
        ORDER BY timestamp DESC 
        LIMIT 100
      `,
      format: 'JSONEachRow',
    });

    // 3. Convert the result to a JSON object
    const data = await resultSet.json();

    // 4. Return it to the browser
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch events' }, 
      { status: 500 }
    );
  }
}