import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const { event } = await req.json();

    // Dynamically choose the host based on where Next.js is running
    const aiHost = process.env.AI_HOST || '127.0.0.1'; 
    const aiUrl = `http://${aiHost}:11434/api/generate`;
    
    const prompt = `
    You are a Tier 3 Security Operations Center (SOC) Analyst. 
    Analyze the following Intrusion Detection System (IDS) alert.
    
    Alert Data:
    - Signature: ${event.alert_signature || "Unknown"}
    - Severity: ${event.alert_severity || "Unknown"}
    - Source IP: ${event.src_ip}
    - Destination IP: ${event.dest_ip}:${event.dest_port}
    - Payload (Snippet): ${event.raw_json || "No payload data"}

    Instructions:
    1. Explain what this specific attack IS in plain English.
    2. Assess if this looks like a False Positive.
    3. Recommend ONE concrete remediation step.
    
    Keep your response under 100 words. Be direct.
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
        return NextResponse.json(
            { analysis: "AI Service Offline or Model not loaded." }, 
            { status: 503 }
        );
    }

    const data = await response.json();
    return NextResponse.json({ analysis: data.response });

  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return NextResponse.json(
        { analysis: "Failed to reach AI Engine. Is Docker running?" }, 
        { status: 500 }
    );
  }
}