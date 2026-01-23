import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userQuery } = await req.json();
    
    const aiHost = process.env.AI_HOST || '127.0.0.1'; 
    const aiUrl = `http://${aiHost}:11434/api/generate`;

    // SYSTEM PROMPT: STRICTLY TIED TO YOUR EXACT SCHEMA
    const prompt = `
    You are a ClickHouse SQL Expert. Your sole job is to convert natural language into optimized ClickHouse SQL.
    
    --- TARGET SCHEMA (ids.events) ---
    - event_uuid: UUID
    - timestamp: DateTime64(3)
    - src_ip: IPv4
    - dest_ip: IPv4
    - src_country: String
    - src_country_code: LowCardinality(String) (e.g., 'CN', 'US', 'RU')
    - alert_severity: UInt8 (1=Critical, 2=High, 3=Info)
    - alert_signature: String
    - raw_json: String
    
    --- CLICKHOUSE DIALECT RULES (MANDATORY) ---
    1. TIME: Use 'today()', 'yesterday()', or 'now()'. 
       - DO NOT USE: strftime, DATE(), or NOW without parentheses.
       - Example (Today): WHERE toStartOfDay(timestamp) = today()
       - Example (Last 24h): WHERE timestamp >= now() - INTERVAL 24 HOUR
    2. IP ADDRESSES: 'src_ip' and 'dest_ip' are IPv4 types. 
       - DO NOT use LIKE. Use: src_ip = '1.1.1.1' or has(src_ip, '1.1.1.0/24') for CIDR.
    3. GEO-LOCATION: Use 'src_country_code' for country lookups.
       - China = 'CN', Russia = 'RU', USA = 'US'.
    4. TEXT SEARCH: Use 'ILIKE' for 'alert_signature' or 'raw_json'.
    5. FORMATTING: Return ONLY the SQL inside a markdown block. No explanations.
    
    --- EXAMPLES ---
    Input: "Critical alerts from China today"
    Output: 
    \`\`\`sql
    SELECT * FROM ids.events 
    WHERE alert_severity = 1 
      AND src_country_code = 'CN' 
      AND toStartOfDay(timestamp) = today()
    ORDER BY timestamp DESC
    \`\`\`
    
    Input: "Show me attacks on port 80 in the last 6 hours"
    Output:
    \`\`\`sql
    SELECT * FROM ids.events 
    WHERE dest_port = 80 
      AND timestamp >= now() - INTERVAL 6 HOUR
    ORDER BY timestamp DESC
    \`\`\`
    
    Request: "${userQuery}"
    `;

    const response = await fetch(aiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral', 
        prompt: prompt,
        stream: false,
        options: {
            temperature: 0, // Maximum determinism
            num_predict: 200,
        }
      }),
    });

    if (!response.ok) {
        return NextResponse.json({ error: "AI Service Offline" }, { status: 503 });
    }

    const data = await response.json();
    const rawText = data.response;

    // --- ROBUST PARSING ---
    let cleanSql = "";
    
    // 1. Try to find sql inside markdown code blocks
    const codeBlockRegex = /```(?:sql)?\s*([\s\S]*?)```/i;
    const match = rawText.match(codeBlockRegex);

    if (match && match[1]) {
        cleanSql = match[1].trim();
    } else {
        // 2. Fallback: Find the first SELECT and take the rest
        const selectIndex = rawText.toUpperCase().indexOf('SELECT');
        if (selectIndex !== -1) {
            cleanSql = rawText.substring(selectIndex).replace(/```/g, '').trim();
        } else {
            return NextResponse.json({ error: "Could not generate valid SQL" }, { status: 400 });
        }
    }

    return NextResponse.json({ sql: cleanSql });

  } catch (error) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}