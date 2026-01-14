import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime

MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
TOPIC = "future-monitoring/sensor-data"

class VirtualSensorNode:
    def __init__(self, node_id="node_001"):
        self.node_id = node_id
        self.location = {"lat": 28.7041, "lng": 77.1025} # Delhi, India
        
    def generate_air_data(self):
        """Generate realistic air quality data"""
        return {
            "pm2_5": random.uniform(10, 300),  
            "pm10": random.uniform(20, 500),
            "no2": random.uniform(0.01, 0.5),   # ppm
            "co": random.uniform(0.1, 10),      # ppm
            "o3": random.uniform(0.01, 0.2),    # ppm
            "voc": random.uniform(100, 1000),   # ppb
            "temperature": random.uniform(15, 45),  # °C
            "humidity": random.uniform(20, 95),     # %
            "pressure": random.uniform(980, 1030)   # hPa
        }
    
    def generate_water_data(self):
        """Generate realistic water quality data"""
        return {
            "ph": random.uniform(5.0, 9.0),         # pH scale
            "turbidity": random.uniform(0, 100),    # NTU
            "tds": random.uniform(100, 1000),       # ppm
            "conductivity": random.uniform(100, 1500),  # μS/cm
            "temperature": random.uniform(10, 35),  # °C
            "orp": random.uniform(-500, 500),       
            "do": random.uniform(2, 12)             
        }
    
    def generate_payload(self):
        """Create complete sensor payload"""
        return {
            "node_id": self.node_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "location": self.location,
            "air": self.generate_air_data(),
            "water": self.generate_water_data(),
            "battery": random.uniform(3.2, 4.2),  # volts
            "signal_strength": random.uniform(-90, -50)  # dBm
        }

client = mqtt.Client()
client.connect(MQTT_BROKER, MQTT_PORT)

sensor = VirtualSensorNode()

print("🚀 Virtual Sensor Node Started")
print("📡 Publishing to MQTT broker...")
print("📍 Simulating location: Delhi, India")

while True:
    data = sensor.generate_payload()
   
    if random.random() < 0.1:  
        data["air"]["pm2_5"] = random.uniform(300, 500) 
        print("⚠️  Generated ANOMALY: High PM2.5")
    
    if random.random() < 0.05:  # 5% chance
        data["water"]["ph"] = random.uniform(2, 4)  
        print("⚠️  Generated ANOMALY: Low pH")

    client.publish(TOPIC, json.dumps(data))
    print(f"📤 Published: PM2.5={data['air']['pm2_5']:.1f}, pH={data['water']['ph']:.1f}")
    
    time.sleep(10)  