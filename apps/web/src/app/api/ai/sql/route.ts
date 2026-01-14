import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userQuery } = await req.json();
    
    const aiHost = process.env.AI_HOST || '127.0.0.1'; 
    const aiUrl = `http://${aiHost}:11434/api/generate`;

    // SYSTEM PROMPT: STRICTLY TIED TO YOUR EXACT SCHEMA
    const prompt = `
    You are a ClickHouse Database Expert. Convert the request into SQL.
    
    --- TABLE DEFINITION (ids.events) ---
    timestamp       DateTime64(3)
    event_type      String
    src_ip          IPv4          <-- STRICT: IPv4 Type
    src_port        UInt16
    dest_ip         IPv4          <-- STRICT: IPv4 Type
    dest_port       UInt16
    proto           String
    alert_action    String
    alert_signature String        <-- SEARCH THIS for descriptions (e.g. "Malware", "Trojan")
    alert_severity  UInt8         (1=Critical, 2=High, 3=Medium)
    alert_category  String        <-- SEARCH THIS for categories
    raw_json        String        <-- SEARCH THIS for deep packet inspection
    -------------------------------------

    RULES:
    1. Return RAW SQL inside a markdown block: \`\`\`sql ... \`\`\`
    2. Do NOT explain.
    3. TYPE SAFETY: 'src_ip' and 'dest_ip' are IPv4. DO NOT use LIKE or String operations on them.
       - Correct: src_ip = '192.168.1.5'
       - Incorrect: src_ip LIKE '%192%'
    4. TEXT SEARCH STRATEGY:
       - If the user asks for "China", "Malware", or "Attack", search 'alert_signature', 'alert_category', or 'raw_json'.
       - Example: (alert_signature ILIKE '%China%' OR raw_json ILIKE '%China%')

    --- EXAMPLES ---
    Input: "Show me the last 5 critical alerts"
    Output: 
    \`\`\`sql
    SELECT * FROM ids.events WHERE alert_severity = 1 ORDER BY timestamp DESC LIMIT 5
    \`\`\`

    Input: "Find alerts from China"
    Output: 
    \`\`\`sql
    -- Searching signature and json because IP columns are not strings
    SELECT * FROM ids.events WHERE alert_signature ILIKE '%China%' OR raw_json ILIKE '%China%' LIMIT 20
    \`\`\`

    Input: "Show SSH traffic"
    Output:
    \`\`\`sql
    SELECT * FROM ids.events WHERE dest_port = 22 OR proto = 'SSH' LIMIT 20
    \`\`\`
    ----------------

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