const { createClient } = require('@clickhouse/client');

const client = createClient({
  url: 'http://localhost:8123',
  database: 'ids',
});

const SIGNATURES = [
  "ET MALWARE Cobalt Strike Beacon Observed",
  "ET EXPLOIT Apache Log4j RCE Attempt",
  "GPL SSH Brute Force Attempt",
  "SURICATA STREAM Packet with invalid timestamp"
];

async function seed() {
  const rows = [];
  console.log("Generating 1,000 fake alerts...");

  for (let i = 0; i < 1000; i++) {
    const isAlert = Math.random() > 0.3; // 70% alerts, 30% noise
    const type = isAlert ? 'alert' : 'flow';
    
    rows.push({
      timestamp: Date.now(), // ClickHouse client handles date conversion
      event_type: type,
      src_ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      src_port: Math.floor(Math.random() * 65535),
      dest_ip: `10.0.0.${Math.floor(Math.random() * 255)}`,
      dest_port: [80, 443, 22, 53][Math.floor(Math.random() * 4)],
      proto: Math.random() > 0.5 ? 'TCP' : 'UDP',
      alert_action: 'allowed',
      alert_signature: isAlert ? SIGNATURES[Math.floor(Math.random() * SIGNATURES.length)] : '',
      alert_severity: Math.floor(Math.random() * 3) + 1,
      alert_category: 'Attempted Administrator Privilege Gain',
      raw_json: JSON.stringify({ note: "This is fake data for the demo" })
    });
  }

  await client.insert({
    table: 'events',
    values: rows,
    format: 'JSONEachRow',
  });

  console.log("Done! Data seeded.");
}

seed().catch(console.error);