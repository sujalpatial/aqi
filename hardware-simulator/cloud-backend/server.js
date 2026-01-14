const express = require('express');
const mqtt = require('mqtt');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mcache = require('memory-cache');
require('dotenv').config();

// -------------------- App Setup --------------------
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// -------------------- Security & Performance --------------------

// Rate limiting (applies to REST APIs only)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', apiLimiter);

// Compression (gzip)
app.use(compression());

// CORS & JSON
app.use(cors());
app.use(express.json());

// -------------------- Cache Middleware --------------------
const cache = (duration) => {
  return (req, res, next) => {
    const key = '__express__' + req.originalUrl;
    const cachedBody = mcache.get(key);

    if (cachedBody) {
      return res.send(cachedBody);
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        mcache.put(key, body, duration * 1000);
        res.sendResponse(body);
      };
      next();
    }
  };
};

// -------------------- In-memory storage --------------------
let sensorData = [];
let alerts = [];
let nodes = {};

// -------------------- ROOT ROUTE --------------------
app.get('/', (req, res) => {
  res.status(200).send('🚀 Cloud backend is running successfully on Railway');
});

// -------------------- MQTT Connection --------------------
console.log('🔗 Connecting to MQTT broker...');
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');

mqttClient.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  mqttClient.subscribe('future-monitoring/sensor-data');
  mqttClient.subscribe('future-monitoring/alerts');
  mqttClient.subscribe('future-monitoring/ai-alerts');
  mqttClient.subscribe('future-monitoring/ai-predictions');
});

// -------------------- MQTT Message Handler --------------------
mqttClient.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

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
      }

      io.emit('sensor_update', data);
      console.log(`📡 Node ${data.node_id} | PM2.5: ${data.air.pm2_5}`);
    }

    else if (topic === 'future-monitoring/ai-alerts') {
      const aiAlert = {
        type: 'AI_ALERT',
        severity: data.severity || 'WARNING',
        message: data.anomaly_result?.reason,
        prediction: data.anomaly_result,
        location: data.location,
        timestamp: new Date()
      };

      alerts.unshift(aiAlert);
      io.emit('ai_alert', aiAlert);
    }

    else if (topic === 'future-monitoring/ai-predictions') {
      io.emit('ai_prediction', data);
    }

  } catch (err) {
    console.error('❌ MQTT message error:', err);
  }
});

// -------------------- Anomaly Detection --------------------
function checkForAnomalies(data) {
  const issues = [];

  if (data.air?.pm2_5 > 35) {
    issues.push({
      type: 'AIR',
      parameter: 'PM2.5',
      value: data.air.pm2_5,
      severity: data.air.pm2_5 > 75 ? 'CRITICAL' : 'WARNING',
      timestamp: data.timestamp,
      location: data.location
    });
  }

  if (data.air?.co > 9) {
    issues.push({
      type: 'AIR',
      parameter: 'CO',
      value: data.air.co,
      severity: 'CRITICAL',
      timestamp: data.timestamp,
      location: data.location
    });
  }

  if (data.water?.ph < 6.5 || data.water?.ph > 8.5) {
    issues.push({
      type: 'WATER',
      parameter: 'pH',
      value: data.water.ph,
      severity:
        data.water.ph < 4 || data.water.ph > 10
          ? 'CRITICAL'
          : 'WARNING',
      timestamp: data.timestamp,
      location: data.location
    });
  }

  return issues;
}

// -------------------- REST APIs --------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    nodesOnline: Object.keys(nodes).length
  });
});

// ✅ Cached for 30 seconds (SAFE)
app.get('/api/nodes', cache(30), (req, res) => {
  res.json(nodes);
});

app.get('/api/data/recent', (req, res) => {
  res.json(sensorData.slice(0, 50));
});

app.get('/api/alerts', (req, res) => {
  res.json(alerts.slice(0, 20));
});

// -------------------- Socket.IO --------------------
io.on('connection', (socket) => {
  console.log('🖥️ Client connected:', socket.id);

  socket.emit('initial_data', {
    nodes,
    alerts: alerts.slice(0, 10),
    data: sensorData.slice(0, 20)
  });

  socket.on('disconnect', () => {
    console.log('🖥️ Client disconnected:', socket.id);
  });
});

// -------------------- Server Start --------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
