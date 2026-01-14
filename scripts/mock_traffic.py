import time
import json
import random
import requests
from datetime import datetime, timezone

# Configuration
# Ensure this matches the port defined in your vector.toml [sources.http_logs]
VECTOR_URL = "http://vector:8687"

# Helper to generate valid random IPs
def random_ip(prefix=None):
    if prefix:
        # Count how many octets are already in the prefix
        octet_count = len(prefix.split('.'))
        # Generate remaining octets to complete 4 total
        remaining = 4 - octet_count
        if remaining <= 0:
            return prefix  # Already complete
        parts = [prefix]
        for _ in range(remaining):
            parts.append(str(random.randint(1, 254)))
        return '.'.join(parts)
    return f"{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"

alerts_templates = [
    # 1. The "China" Scenario (For your AI Demo)
    {
        "category": "APT Activity (China)",
        "signature": "ET TROJAN APT.CN.Emissary Panda Beacon",
        "severity": 1,
        "src_ip_prefix": "59.110", # Alibaba Cloud / China Range simulation
        "dest_port": 443,
        "proto": "TCP"
    },
    # 2. Standard Malware
    {
        "category": "Potentially Bad Traffic",
        "signature": "ET MALWARE Win32/Generic Beacon",
        "severity": 1,
        "src_ip_prefix": "185.100",
        "dest_port": 8080,
        "proto": "TCP"
    },
    # 3. Web Attacks
    {
        "category": "Web Application Attack",
        "signature": "ET WEB_SERVER SQL Injection Attempt",
        "severity": 2,
        "src_ip_prefix": "45.33",
        "dest_port": 443,
        "proto": "TCP"
    },
    # 4. Noise (Internal Traffic)
    {
        "category": "Misc Activity",
        "signature": "SURICATA ICMP Ping",
        "severity": 3,
        "src_ip_prefix": "192.168.1",
        "dest_port": 0,
        "proto": "ICMP"
    },
    # 5. SSH Brute Force
    {
        "category": "Attempted Administrator Privilege Gain",
        "signature": "ET SCAN LibSSH Based Brute Force",
        "severity": 2,
        "src_ip_prefix": "103.20",
        "dest_port": 22,
        "proto": "TCP"
    }
]

print(f"Starting Mock Traffic Generator targeting {VECTOR_URL}...")

while True:
    # Pick a random alert template
    template = random.choice(alerts_templates)
    
    # Generate dynamic IPs so the dashboard looks alive
    src = random_ip(template.get("src_ip_prefix"))
    dest = "10.0.0.5" 
    
    # FIX: Manually format to "YYYY-MM-DDTHH:MM:SS.ssssssZ"
    # This matches Vector's "%Y-%m-%dT%H:%M:%S.%fZ" exactly
    current_time = datetime.utcnow().isoformat() + "Z"
    
    event = {
        "timestamp": current_time,
        "event_type": "alert",
        "src_ip": src,
        "src_port": random.randint(1024, 65535),
        "dest_ip": dest,
        "dest_port": template["dest_port"],
        "proto": template["proto"],
        "alert": {
            "action": "allowed",
            "gid": 1,
            "signature_id": random.randint(10000, 99999),
            "rev": 1,
            "signature": template["signature"],
            "category": template["category"],
            "severity": template["severity"]
        },
        "payload_printable": f"Fake Payload: {template['signature']} from {src}",
        "stream": 0,
        "packet": "AAAA", 
        "packet_info": { "linktype": 1 }
    }

    try:
        response = requests.post(VECTOR_URL, json=event)
        if response.status_code == 200:
            print(f"[{time.strftime('%H:%M:%S')}] Sent: {template['signature']} from {src}")
        else:
            print(f"Vector Rejected: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Error sending log: {e}")

    time.sleep(random.uniform(0.1, 1.5))