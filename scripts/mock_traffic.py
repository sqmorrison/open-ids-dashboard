import time
import json
import random
import requests
from datetime import datetime

# Configuration
VECTOR_URL = "http://localhost:8686"
# VECTOR_URL = "http://vector:8686"  # Docker internal URL
# If running locally outside docker, use "http://localhost:8686"

alerts = [
    {
        "category": "Attempted Information Leak",
        "signature": "ET SCAN Nmap Scripting Engine User-Agent",
        "severity": 2,
        "src_ip": "192.168.1.105",
        "dest_ip": "10.0.0.5",
        "dest_port": 80
    },
    {
        "category": "Potentially Bad Traffic",
        "signature": "ET MALWARE Win32/Generic Beacon",
        "severity": 1,
        "src_ip": "10.0.0.15",
        "dest_ip": "185.100.x.x",
        "dest_port": 443
    },
    {
        "category": "Web Application Attack",
        "signature": "ET WEB_SERVER SQL Injection Attempt",
        "severity": 1,
        "src_ip": "45.33.x.x",
        "dest_ip": "10.0.0.5",
        "dest_port": 443
    },
    {
        "category": "Misc Activity",
        "signature": "SURICATA ICMP Ping",
        "severity": 3,
        "src_ip": "192.168.1.50",
        "dest_ip": "10.0.0.5",
        "dest_port": 0
    }
]

print("Starting Mock Traffic Generator...")

while True:
    # Pick a random alert
    alert = random.choice(alerts)
    
    # Construct Suricata EVE JSON format
    event = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "event_type": "alert",
        "src_ip": alert["src_ip"],
        "src_port": random.randint(1024, 65535),
        "dest_ip": alert["dest_ip"],
        "dest_port": alert["dest_port"],
        "proto": "TCP",
        "alert": {
            "action": "allowed",
            "gid": 1,
            "signature_id": random.randint(10000, 99999),
            "rev": 1,
            "signature": alert["signature"],
            "category": alert["category"],
            "severity": alert["severity"]
        },
        "payload_printable": "GET /admin HTTP/1.1\r\nHost: 10.0.0.5\r\n\r\n"
    }

    try:
        # Send to Vector via HTTP
        requests.post(VECTOR_URL, json=event)
        print(f"Sent: {alert['signature']}")
    except Exception as e:
        print(f"Error sending log: {e}")

    # Random delay between events (0.5s to 3s)
    time.sleep(random.uniform(0.5, 3.0))