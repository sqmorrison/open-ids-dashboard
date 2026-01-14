import { NextResponse } from 'next/server';

// Scenarios Definition
const SCENARIOS = {
  ransomware: {
    count: 40, // How many alerts to fire
    base_signature: "ET MALWARE Ransomware Activity Detected",
    category: "Ransomware",
    severity: 1,
    ip_prefix: "192.168.1", // Internal spread
  },
  sql_injection: {
    count: 25,
    base_signature: "ET WEB_SERVER SQL Injection Attempt",
    category: "Web Application Attack",
    severity: 1,
    ip_prefix: "45.33.2", // External attacker
  },
  china_apt: {
    count: 30,
    base_signature: "ET TROJAN APT.CN.Emissary Panda Beacon",
    category: "APT Activity (China)",
    severity: 1,
    ip_prefix: "59.110.1", // Alibaba Cloud / China
  }
};

export async function POST(req: Request) {
  try {
    const { type } = await req.json();
    const scenario = SCENARIOS[type as keyof typeof SCENARIOS];

    if (!scenario) {
      return NextResponse.json({ error: "Invalid scenario" }, { status: 400 });
    }

    // Determine Vector URL (Localhost for dev, 'vector' for docker)
    const vectorHost = process.env.VECTOR_HOST || 'localhost';
    const vectorUrl = `http://${vectorHost}:8687`;

    console.log(`[Simulation] Launching ${type} attack to ${vectorUrl}...`);

    const events = [];
    const now = new Date();

    // Generate Batch of Logs
    for (let i = 0; i < scenario.count; i++) {
        // Stagger timestamps slightly so they don't all look identical
        const timestamp = new Date(now.getTime() + i * 100).toISOString(); // isISOString() includes 'Z'
        
        // Randomize last octet of IP
        const src_ip = `${scenario.ip_prefix}.${Math.floor(Math.random() * 254) + 1}`;
        
        const event = {
            timestamp: timestamp,
            event_type: "alert",
            src_ip: src_ip,
            src_port: Math.floor(Math.random() * 60000) + 1024,
            dest_ip: "10.0.0.5",
            dest_port: 443,
            proto: "TCP",
            alert: {
                action: "allowed",
                gid: 1,
                signature_id: 100000 + i,
                rev: 1,
                signature: scenario.base_signature,
                category: scenario.category,
                severity: scenario.severity
            },
            // Add raw_json simulation for the AI
            payload_printable: `SIMULATED ATTACK PAYLOAD: ${scenario.base_signature}`
        };
        
        // Fire and forget (don't await every single one, just push to fetch promises)
        events.push(
            fetch(vectorUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            })
        );
    }

    // Execute all requests
    await Promise.all(events);

    return NextResponse.json({ 
        success: true, 
        message: `Injected ${scenario.count} ${type} alerts.` 
    });

  } catch (error) {
    console.error("Simulation Error:", error);
    return NextResponse.json({ error: "Failed to run simulation" }, { status: 500 });
  }
}