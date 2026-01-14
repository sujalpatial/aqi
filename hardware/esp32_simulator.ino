// ESP32 Simulator for Future Monitoring System
// This simulates what would run on actual hardware

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YourWiFi";
const char* password = "YourPassword";

const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* topic = "future-monitoring/sensor-data";

WiFiClient espClient;
PubSubClient client(espClient);

// Sensor simulation
float pm2_5 = 25.0;
float ph = 7.0;
float temperature = 25.0;

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n FUTURE MONITORING SYSTEM - ESP32 SIMULATOR");
  Serial.println("================================================");
  
  setupWiFi();
  setupMQTT();
  
  Serial.println(" System initialized");
  Serial.println(" Ready to send sensor data...\n");
}

void setupWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n WiFi connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void setupMQTT() {
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  
  reconnectMQTT();
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    String clientId = "ESP32-FutureMonitor-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println(" MQTT connected");
      client.subscribe("future-monitoring/commands");
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");
  
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void generateSensorData() {
  // Simulate realistic sensor readings
  pm2_5 += random(-5, 5) * 0.1;
  pm2_5 = constrain(pm2_5, 10, 300);
  
  ph += random(-10, 10) * 0.01;
  ph = constrain(ph, 5.0, 9.0);
  
  temperature += random(-5, 5) * 0.1;
  temperature = constrain(temperature, 15, 40);
}

void publishSensorData() {
  StaticJsonDocument<512> doc;
  
  doc["node_id"] = "ESP32_001";
  doc["timestamp"] = "2024-01-01T12:00:00Z"; // In real implementation, use actual time
  
  JsonObject air = doc.createNestedObject("air");
  air["pm2_5"] = pm2_5;
  air["pm10"] = pm2_5 * 1.5;
  air["no2"] = 0.05;
  air["co"] = 0.8;
  air["o3"] = 0.02;
  air["temperature"] = temperature;
  air["humidity"] = 45.5;
  air["pressure"] = 1013.25;
  
  JsonObject water = doc.createNestedObject("water");
  water["ph"] = ph;
  water["turbidity"] = 12.5;
  water["tds"] = 350;
  water["temperature"] = temperature - 3;
  
  doc["location"]["lat"] = 28.7041;
  doc["location"]["lng"] = 77.1025;
  doc["battery"] = 3.8;
  doc["signal_strength"] = -65;
  
  char buffer[512];
  serializeJson(doc, buffer);
  
  client.publish(topic, buffer);
  
  Serial.print(" Published: PM2.5=");
  Serial.print(pm2_5);
  Serial.print(", pH=");
  Serial.print(ph);
  Serial.print(", Temp=");
  Serial.print(temperature);
  Serial.println("°C");
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  generateSensorData();
  publishSensorData();
  
  delay(10000);
}