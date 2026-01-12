import { NextResponse } from 'next/server';

export const maxDuration = 60;

const SCHEMA_CONTEXT = `
Table Name: ids.events
Columns:
- timestamp (DateTime64(3))
- src_ip (String)
- dest_ip (String)
- src_port (UInt16)
- dest_port (UInt16)
- alert_severity (UInt8): 1=Critical, 2=High, 3=Medium
- alert_category (String): e.g., 'Malware Command and Control', 'Attempted Information Leak'
- alert_signature (String): The specific rule name
- payload_printable (String): Hex/Text dump of the packet

Suricata Severity Map:
1 = Critical
2 = High
3 = Medium
`;

export async function POST(req: Request) {
  try {
    const { userQuery } = await req.json();

    const prompt = `
    You are a Database Expert. Convert the following natural language request into a valid ClickHouse SQL query.
    
    ${SCHEMA_CONTEXT}

    User Request: "${userQuery}"

    Rules:
    1. Return ONLY the SQL query. No markdown, no explanations.
    2. Always use 'LIMIT 100' unless specified otherwise.
    3. If filtering by time, use ClickHouse syntax like "timestamp >= now() - INTERVAL 1 HOUR".
    4. Do not hallucinate columns. Use ONLY the columns listed above.
    
    SQL:
    `;

    const response = await fetch('http://ai:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral', 
        prompt: prompt,
        stream: false
      }),
    });

    const data = await response.json();
    
    // Clean up the output (remove markdown code blocks if the AI adds them)
    let sql = data.response.trim();
    sql = sql.replace(/```sql/g, '').replace(/```/g, '').trim();

    return NextResponse.json({ sql });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}