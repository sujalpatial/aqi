const express = require('express');
const mqtt = require('mqtt');
const http = require('http');
const emailService = require('./email-service');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// -------------------- In-memory storage --------------------
let sensorData = [];
let alerts = [];
let nodes = {};

// -------------------- MQTT Connection --------------------
console.log("🔗 Connecting to MQTT broker...");
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');

mqttClient.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  mqttClient.subscribe('future-monitoring/sensor-data');
  mqttClient.subscribe('future-monitoring/alerts');

  // 🧠 AI topics
  mqttClient.subscribe('future-monitoring/ai-alerts');
  mqttClient.subscribe('future-monitoring/ai-predictions');
});

// -------------------- MQTT Message Handler --------------------
mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    // 📡 Sensor data
    if (topic === 'future-monitoring/sensor-data') {
      sensorData.unshift(data);
      if (sensorData.length > 1000) sensorData.pop();

      nodes[data.node_id] = {
        ...data,
        lastSeen: new Date(),
        status: 'online'
      };

      const newAlerts = checkForAnomalies(data);

      if (newAlerts.length > 0) {
        alerts.unshift(...newAlerts);
        io.emit('new_alerts', newAlerts);

        for (const alert of newAlerts) {
          // Publish alert to MQTT
          mqttClient.publish(
            'future-monitoring/alerts',
            JSON.stringify(alert)
          );

          // 📧 Send email ONLY for CRITICAL alerts
          if (alert.severity === 'CRITICAL') {
            try {
              await emailService.sendAlertEmail(alert, data);
              console.log('📧 Critical alert email sent');
            } catch (emailError) {
              console.error('❌ Email sending failed:', emailError);
            }
          }
        }
      }

      io.emit('sensor_update', data);
      console.log(`📡 Node ${data.node_id} | PM2.5: ${data.air.pm2_5}`);
    }

    // 🤖 AI-based alerts
    else if (topic === 'future-monitoring/ai-alerts') {
      console.log(
        '🤖 AI Alert:',
        data.anomaly_result?.reason || 'Unknown anomaly'
      );

      const aiAlert = {
        type: 'AI_ALERT',
        severity: data.severity || 'WARNING',
        message: data.anomaly_result?.reason,
        prediction: data.anomaly_result,
        location: data.location,
        timestamp: data.timestamp || new Date()
      };

      alerts.unshift(aiAlert);
      io.emit('ai_alert', aiAlert);
    }

    // 🔮 AI predictions
    else if (topic === 'future-monitoring/ai-predictions') {
      console.log('🔮 AI Prediction:', data.prediction);
      io.emit('ai_prediction', data);
    }

  } catch (error) {
    console.error('❌ Error processing MQTT message:', error);
  }
});

// -------------------- Anomaly Detection --------------------
function checkForAnomalies(data) {
  const alerts = [];

  if (data.air.pm2_5 > 35) {
    alerts.push({
      type: 'WARNING',
      source: 'air',
      parameter: 'PM2.5',
      value: data.air.pm2_5,
      threshold: 35,
      message: `High PM2.5 detected: ${data.air.pm2_5.toFixed(1)} μg/m³`,
      location: data.location,
      timestamp: data.timestamp,
      severity: data.air.pm2_5 > 75 ? 'CRITICAL' : 'WARNING'
    });
  }

  if (data.air.co > 9) {
    alerts.push({
      type: 'WARNING',
      source: 'air',
      parameter: 'CO',
      value: data.air.co,
      threshold: 9,
      message: `High Carbon Monoxide: ${data.air.co.toFixed(1)} ppm`,
      location: data.location,
      timestamp: data.timestamp,
      severity: 'CRITICAL'
    });
  }

  if (data.water.ph < 6.5 || data.water.ph > 8.5) {
    alerts.push({
      type: 'WARNING',
      source: 'water',
      parameter: 'pH',
      value: data.water.ph,
      threshold: '6.5-8.5',
      message: `Unsafe pH level: ${data.water.ph.toFixed(1)}`,
      location: data.location,
      timestamp: data.timestamp,
      severity:
        data.water.ph < 4 || data.water.ph > 10
          ? 'CRITICAL'
          : 'WARNING'
    });
  }

  if (data.water.turbidity > 5) {
    alerts.push({
      type: 'WARNING',
      source: 'water',
      parameter: 'turbidity',
      value: data.water.turbidity,
      threshold: 5,
      message: `High turbidity: ${data.water.turbidity.toFixed(1)} NTU`,
      location: data.location,
      timestamp: data.timestamp,
      severity:
        data.water.turbidity > 50
          ? 'CRITICAL'
          : 'WARNING'
    });
  }

  return alerts;
}

// -------------------- REST APIs --------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeNodes: Object.keys(nodes).length
  });
});

app.get('/api/nodes', (req, res) => {
  res.json(nodes);
});

app.get('/api/data/recent', (req, res) => {
  res.json(sensorData.slice(0, 50));
});

app.get('/api/alerts', (req, res) => {
  res.json(alerts.slice(0, 20));
});

app.get('/api/data/historical', (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const filtered = sensorData.filter(
    d => new Date(d.timestamp) > cutoff
  );
  res.json(filtered);
});

// -------------------- Socket.IO --------------------
io.on('connection', (socket) => {
  console.log('🖥️ Dashboard connected:', socket.id);

  socket.emit('initial_data', {
    nodes,
    recentAlerts: alerts.slice(0, 10),
    recentData: sensorData.slice(0, 20)
  });

  socket.on('disconnect', () => {
    console.log('🖥️ Dashboard disconnected:', socket.id);
  });
});

// -------------------- Server Start --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(` Cloud backend running on port ${PORT}`);
  console.log(` MQTT Broker: broker.hivemq.com:1883`);
  console.log(` Health API: http://localhost:${PORT}/api/health`);
});
