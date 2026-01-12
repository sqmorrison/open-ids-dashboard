import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userQuery } = await req.json();
    
    // Check environment for Docker vs Localhost
    const aiHost = process.env.AI_HOST || '127.0.0.1'; 
    const aiUrl = `http://${aiHost}:11434/api/generate`;

    // Stronger System Prompt
    const prompt = `
    You are a Database Expert. Convert the request into ClickHouse SQL.
    
    Table Schema: ids.events
    Columns: 
    - timestamp (DateTime64)
    - src_ip (String)
    - dest_ip (String)
    - alert_severity (UInt8: 1=Critical, 2=High, 3=Med)
    - alert_category (String)
    
    Request: "${userQuery}"
    
    CRITICAL RULES:
    1. Return RAW SQL only. 
    2. Do NOT use Markdown formatting (no \`\`\`).
    3. Do NOT include explanations like "Here is the query".
    4. Start immediately with the word SELECT.
    `;

    const response = await fetch(aiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral', 
        prompt: prompt,
        stream: false
      }),
    });

    if (!response.ok) {
        return NextResponse.json({ error: "AI Service Offline" }, { status: 503 });
    }

    const data = await response.json();
    let rawText = data.response;

    // --- SANITIZATION LOGIC ---
    // 1. Remove Markdown code blocks if present
    rawText = rawText.replace(/```sql/g, '').replace(/```/g, '');

    // 2. Find the start of the SQL command
    // This ignores the "Here is your query:" chatter
    const selectIndex = rawText.toUpperCase().indexOf('SELECT');
    
    if (selectIndex === -1) {
        return NextResponse.json({ error: "AI failed to generate a SELECT statement." }, { status: 400 });
    }

    // 3. Extract everything from SELECT onwards
    const cleanSql = rawText.substring(selectIndex).trim();

    return NextResponse.json({ sql: cleanSql });

  } catch (error) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}