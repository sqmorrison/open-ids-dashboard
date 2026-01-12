import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userQuery } = await req.json();

    // DYNAMIC URL SELECTION:
    // If running in Docker (hostname 'web' or similar), use 'ai'.
    // If running locally (npm run dev), use '127.0.0.1'.
    // We default to '127.0.0.1' for development safety, or use env var if set.
    const aiHost = process.env.AI_HOST || '127.0.0.1'; 
    const aiUrl = `http://${aiHost}:11434/api/generate`;

    console.log(`Connecting to AI at: ${aiUrl}`); // Debug Log

    const prompt = `
    You are a Database Expert. Convert the request into ClickHouse SQL.
    Table: ids.events
    Columns: timestamp, src_ip, dest_ip, alert_severity (1=Crit, 2=High, 3=Med), alert_category.
    Request: "${userQuery}"
    Rules: Return ONLY SQL. No Markdown.
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
        const errText = await response.text();
        console.error("AI Service Error:", errText);
        return NextResponse.json({ error: `Ollama Error: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    
    // Clean markdown if present
    let sql = data.response.trim();
    sql = sql.replace(/```sql/g, '').replace(/```/g, '').trim();

    return NextResponse.json({ sql });

  } catch (error) {
    console.error("Critical AI Route Failure:", error);
    return NextResponse.json({ error: "Failed to reach AI service. Is Docker running?" }, { status: 500 });
  }
}