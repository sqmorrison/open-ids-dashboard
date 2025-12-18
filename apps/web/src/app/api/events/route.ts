import { createClient } from '@clickhouse/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('search') || '';
  // 1. Initialize the client (Note: In production, we'd use environment variables)
  const client = createClient({
    url: 'http://localhost:8123',
    database: 'ids',
    username: 'default',
    password: 'admin',
  });

  try {
      // Basic SQL construction. 
      // In a production app with user input, strictly use parameterized queries (query_params) 
      // to prevent SQL injection, though ClickHouse is generally read-heavy/safer.
      
      let sql = `
        SELECT * FROM ids.events 
        WHERE 1=1
      `;
      
      const queryParams: Record<string, string | number> = {};
  
      if (query) {
        // FIX: Concatenate IP and Port to allow searching "1.2.3.4:80"
        // syntax: concat(toString(ip), ':', toString(port))
        sql += `
          AND (
            alert_signature ilike {query_wild:String} OR
            concat(toString(src_ip), ':', toString(src_port)) ilike {query_wild:String} OR
            concat(toString(dest_ip), ':', toString(dest_port)) ilike {query_wild:String}
          )
        `;
  
        queryParams.query_wild = `%${query}%`;
      }
  
      sql += ` ORDER BY timestamp DESC LIMIT 100`;
  
      const resultSet = await client.query({
        query: sql,
        format: 'JSONEachRow',
        query_params: queryParams,
      });
  
      const data = await resultSet.json();
      return NextResponse.json(data);
  
    } catch (error) {
      console.error('ClickHouse Error:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}