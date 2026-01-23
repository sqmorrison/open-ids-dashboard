import time
import json
import random
import requests
from datetime import datetime

# Configuration
VECTOR_URL = "http://vector:8687"

def random_ip(prefix=None):
    if prefix:
        octet_count = len(prefix.split('.'))
        remaining = 4 - octet_count
        if remaining <= 0:
            return prefix
        parts = [prefix]
        for _ in range(remaining):
            parts.append(str(random.randint(1, 254)))
        return '.'.join(parts)
    return f"{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"

alerts_templates = [
    {
        "category": "APT Activity (China)",
        "signature": "ET TROJAN APT.CN.Emissary Panda Beacon",
        "severity": 1,
        "src_ip_prefix": "59.110",
        "dest_port": 443,
        "proto": "TCP",
        "country": "China",
        "country_code": "CN" # Displays on Heat Map
    },
    {
        "category": "Potentially Bad Traffic",
        "signature": "ET MALWARE Win32/Generic Beacon",
        "severity": 1,
        "src_ip_prefix": "185.100",
        "dest_port": 8080,
        "proto": "TCP",
        "country": "Netherlands",
        "country_code": "NL"
    },
    {
        "category": "Web Application Attack",
        "signature": "ET WEB_SERVER SQL Injection Attempt",
        "severity": 2,
        "src_ip_prefix": "45.33",
        "dest_port": 443,
        "proto": "TCP",
        "country": "United States",
        "country_code": "US"
    },
    {
        "category": "SSH Brute Force",
        "signature": "ET SCAN LibSSH Based Brute Force",
        "severity": 2,
        "src_ip_prefix": "103.20",
        "dest_port": 22,
        "proto": "TCP",
        "country": "Vietnam",
        "country_code": "VN"
    },
    {
        "category": "System Compromise",
        "signature": "ET EXPLOIT Possible SolarWinds Backdoor",
        "severity": 1,
        "src_ip_prefix": "95.161",
        "dest_port": 443,
        "proto": "TCP",
        "country": "Russia",
        "country_code": "RU"
    }
]

print(f"Starting Mock Traffic Generator with GeoIP data targeting {VECTOR_URL}...")

while True:
    template = random.choice(alerts_templates)
    src = random_ip(template.get("src_ip_prefix"))
    dest = "10.0.0.5" 
    
    current_time = datetime.utcnow().isoformat() + "Z"
    
    # Event payload now includes explicit GeoIP fields for the Heat Map
    event = {
        "timestamp": current_time,
        "event_type": "alert",
        "src_ip": src,
        "src_port": random.randint(1024, 65535),
        "dest_ip": dest,
        "dest_port": template["dest_port"],
        "proto": template["proto"],
        
        # HEAT MAP FIELDS:
        "src_country": template["country"],
        "src_country_code": template["country_code"],
        
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
            print(f"[{time.strftime('%H:%M:%S')}] Sent: {template['signature']} from {template['country']} ({src})")
        else:
            print(f"Vector Rejected: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Error sending log: {e}")

    time.sleep(random.uniform(0.1, 1.0))