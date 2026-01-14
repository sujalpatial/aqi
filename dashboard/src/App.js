import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, Alert, Chip, Card, CardContent, LinearProgress, Stack } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WaterIcon from '@mui/icons-material/Water';
import WarningIcon from '@mui/icons-material/Warning';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff',
    },
    secondary: {
      main: '#ff6b6b',
    },
    background: {
      default: '#0a1929',
      paper: '#1e293b',
    },
  },
});

// SIMPLE COMPONENTS (no imports needed)
function AQIGauge({ value }) {
  return (
    <Box sx={{ position: 'relative', width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ 
          width: 180, 
          height: 180, 
          borderRadius: '50%', 
          border: '10px solid',
          borderColor: value <= 50 ? '#10b981' : 
                      value <= 100 ? '#f59e0b' : 
                      value <= 150 ? '#f97316' : 
                      value <= 200 ? '#ef4444' : '#8b5cf6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="h3">{Math.round(value)}</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
          Air Quality Index
        </Typography>
      </Box>
    </Box>
  );
}

function NodeStatus({ nodes, selectedNode, onSelectNode }) {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" gutterBottom>Connected Nodes</Typography>
      <Stack spacing={1}>
        {Object.keys(nodes).map(nodeId => (
          <Chip 
            key={nodeId}
            label={nodeId}
            onClick={() => onSelectNode(nodeId)}
            color={selectedNode === nodeId ? "primary" : "default"}
            variant={selectedNode === nodeId ? "filled" : "outlined"}
            sx={{ justifyContent: 'flex-start' }}
          />
        ))}
      </Stack>
    </Box>
  );
}

function AlertPanel({ alerts }) {
  return (
    <Stack spacing={1}>
      {alerts.slice(0, 3).map((alert, index) => (
        <Alert key={index} severity="warning" sx={{ mb: 1 }}>
          {alert.message || `Alert ${index + 1}`}
        </Alert>
      ))}
      {alerts.length === 0 && (
        <Alert severity="success">No active alerts</Alert>
      )}
    </Stack>
  );
}

function RealTimeChart({ data }) {
  return (
    <Box sx={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
          <Legend />
          <Line type="monotone" dataKey="pm2_5" stroke="#00d4ff" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="ph" stroke="#10b981" />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

function HeatMap({ nodes }) {
  return (
    <Box sx={{ height: 300, bgcolor: 'background.paper', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography color="text.secondary">
        Heatmap would show here. Install react-leaflet for map visualization.
      </Typography>
    </Box>
  );
}

function DashboardLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box component="header" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h5" fontWeight="bold">
          Future Monitoring System
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Next-Gen Air & Water Quality Monitoring
        </Typography>
      </Box>
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      <Box component="footer" sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Edge AI + IoT + Cloud Dashboard | Data updates every 10 seconds
        </Typography>
      </Box>
    </Box>
  );
}

// MAIN APP COMPONENT
function App() {
  const [nodes, setNodes] = useState({});
  const [recentData, setRecentData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Mock data for demo
  useEffect(() => {
    // Simulate initial data
    const mockNode = {
      node_id: 'node_001',
      timestamp: new Date().toISOString(),
      air: {
        pm2_5: 45.2,
        pm10: 65.1,
        no2: 0.05,
        co: 0.8,
        o3: 0.02,
        voc: 150,
        temperature: 27.5,
        humidity: 65
      },
      water: {
        ph: 7.2,
        turbidity: 12.5,
        tds: 350,
        temperature: 22.0
      },
      location: {
        lat: 28.7041,
        lng: 77.1025
      },
      battery: 3.8,
      signal_strength: -65
    };
    
    setNodes({ 'node_001': mockNode });
    setSelectedNode('node_001');
    
    // Generate mock chart data
    const mockChartData = Array.from({ length: 20 }, (_, i) => ({
      time: `${i * 5}:00`,
      pm2_5: 30 + Math.sin(i * 0.5) * 20,
      ph: 7.0 + Math.cos(i * 0.3) * 0.5,
      temperature: 25 + Math.sin(i * 0.2) * 5
    }));
    
    setRecentData(mockChartData);
    
    // Mock alerts
    setAlerts([
      {
        message: 'PM2.5 levels approaching threshold: 45.2 μg/m³',
        severity: 'warning'
      },
      {
        message: 'Water pH is optimal: 7.2',
        severity: 'success'
      }
    ]);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      const newPm25 = 30 + Math.random() * 40;
      const newDataPoint = {
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        pm2_5: newPm25,
        ph: 6.8 + Math.random() * 0.8,
        temperature: 24 + Math.random() * 8
      };
      
      setRecentData(prev => [...prev.slice(-19), newDataPoint]);
      
      // Update node data
      setNodes(prev => ({
        ...prev,
        'node_001': {
          ...prev['node_001'],
          air: {
            ...prev['node_001'].air,
            pm2_5: newPm25,
            temperature: newDataPoint.temperature
          },
          timestamp: new Date().toISOString()
        }
      }));
      
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const currentData = selectedNode ? nodes[selectedNode] : null;
  const aqi = currentData ? (currentData.air.pm2_5 * 2) : 50; // Simple calculation
  
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <DashboardLayout>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', background: 'linear-gradient(45deg, #00d4ff 30%, #0088ff 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                FUTURE MONITORING SYSTEM
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Air & Water Quality Monitoring with Edge AI
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Chip icon={<NetworkCheckIcon />} label={`${Object.keys(nodes).length} Nodes Online`} color="success" variant="outlined" />
              <Chip icon={<WarningIcon />} label={`${alerts.length} Active Alerts`} color={alerts.length > 0 ? "error" : "default"} />
            </Stack>
          </Box>
          
          <Grid container spacing={3}>
            {/* Left Column - Gauges & Status */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WbSunnyIcon /> Air Quality Index
                </Typography>
                <AQIGauge value={aqi} />
                
                <Typography variant="h6" sx={{ mt: 4, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WaterIcon /> Water Quality Index
                </Typography>
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h2" color="success.main">
                    7.2
                  </Typography>
                </Box>
                
                <NodeStatus nodes={nodes} selectedNode={selectedNode} onSelectNode={setSelectedNode} />
              </Paper>
            </Grid>
            
            {/* Middle Column - Charts */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 3 }}>Real-time Sensor Data</Typography>
                <RealTimeChart data={recentData} />
                
                <Typography variant="h6" sx={{ mt: 4, mb: 3 }}>Parameter Distribution</Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recentData.slice(-5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
                      <Legend />
                      <Bar dataKey="pm2_5" name="PM2.5" fill="#00d4ff" />
                      <Bar dataKey="temperature" name="Temp (°C)" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            
            {/* Right Column - Alerts & Details */}
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon /> Active Alerts
                </Typography>
                <AlertPanel alerts={alerts} />
                
                {currentData && (
                  <>
                    <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Node Details</Typography>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Node ID:</Typography>
                            <Typography variant="body2">{currentData.node_id}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Location:</Typography>
                            <Chip size="small" icon={<GpsFixedIcon />} label="Delhi, IN" />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Battery:</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <BatteryFullIcon fontSize="small" />
                              <Typography variant="body2">{currentData.battery?.toFixed(2) || '3.8'}V</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Last Update:</Typography>
                            <Typography variant="body2">
                              {new Date(currentData.timestamp).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                    
                    <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Current Readings</Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Card variant="outlined">
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="caption" color="text.secondary">PM2.5</Typography>
                            <Typography variant="h6" color={currentData.air.pm2_5 > 35 ? 'error' : 'success'}>
                              {currentData.air.pm2_5.toFixed(1)}
                              <Typography variant="caption" color="text.secondary"> μg/m³</Typography>
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card variant="outlined">
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="caption" color="text.secondary">pH</Typography>
                            <Typography variant="h6" color={currentData.water.ph < 6.5 || currentData.water.ph > 8.5 ? 'error' : 'success'}>
                              {currentData.water.ph.toFixed(1)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </>
                )}
              </Paper>
            </Grid>
            
            {/* Full Width - Heatmap */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>Pollution Heatmap</Typography>
                <HeatMap nodes={nodes} />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </DashboardLayout>
    </ThemeProvider>
  );
}

export default App;