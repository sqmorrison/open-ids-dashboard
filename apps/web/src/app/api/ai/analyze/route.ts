import { NextResponse } from 'next/server';

export const maxDuration = 60; // Allow 60 seconds for slow local CPUs

export async function POST(req: Request) {
  try {
    const { event } = await req.json();

    // Construct the Prompt
    // We give the AI the specific JSON context of the alert
    const prompt = `
    You are a Tier 3 Security Operations Center (SOC) Analyst. 
    Analyze the following Intrusion Detection System (IDS) alert.
    
    Alert Data:
    - Signature: ${event.alert?.signature || "Unknown"}
    - Category: ${event.alert?.category || "Unknown"}
    - Severity: ${event.alert?.severity || "Unknown"}
    - Source IP: ${event.src_ip}
    - Destination IP: ${event.dest_ip}:${event.dest_port}
    - Payload (Snippet): ${event.payload_printable || "No payload data"}

    Instructions:
    1. Explain what this specific attack IS in plain English.
    2. Assess if this looks like a False Positive (e.g., is the Source IP internal?).
    3. Recommend ONE concrete remediation step (e.g., "Block IP", "Check Cron jobs").
    
    Keep your response under 100 words. Be direct.
    `;

    // 2. Call the Local AI Service (Ollama)
    // Note: 'ai' is the docker service name
    const response = await fetch('http://ai:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral', // or 'llama3' depending on what the user pulled
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
        { analysis: "Failed to reach AI Engine." }, 
        { status: 500 }
    );
  }
}