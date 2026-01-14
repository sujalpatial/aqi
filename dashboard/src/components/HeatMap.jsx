import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Box, Typography, Chip } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

// Fix for default icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default function HeatMap({ nodes }) {
  const [center, setCenter] = useState([28.7041, 77.1025]); // Delhi
  const [zoom, setZoom] = useState(10);
  
  const getColorFromPM25 = (pm25) => {
    if (pm25 <= 12) return '#10b981'; // Green
    if (pm25 <= 35) return '#f59e0b'; // Yellow
    if (pm25 <= 55) return '#f97316'; // Orange
    if (pm25 <= 150) return '#ef4444'; // Red
    return '#8b5cf6'; // Purple
  };
  
  const getRadiusFromPM25 = (pm25) => {
    return Math.min(30, Math.max(8, pm25 / 5));
  };
  
  const nodeArray = Object.values(nodes);
  
  if (nodeArray.length === 0) {
    return (
      <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">
          Waiting for sensor data to display heatmap...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: 400, borderRadius: 1, overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {nodeArray.map((node, index) => {
          const lat = node.location?.lat || center[0] + (Math.random() - 0.5) * 0.1;
          const lng = node.location?.lng || center[1] + (Math.random() - 0.5) * 0.1;
          const pm25 = node.air?.pm2_5 || 0;
          
          return (
            <CircleMarker
              key={index}
              center={[lat, lng]}
              radius={getRadiusFromPM25(pm25)}
              fillColor={getColorFromPM25(pm25)}
              color="#ffffff"
              weight={2}
              opacity={0.8}
              fillOpacity={0.6}
            >
              <Popup>
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Node: {node.node_id}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip 
                      label={`PM2.5: ${pm25.toFixed(1)}`}
                      size="small"
                      sx={{ bgcolor: getColorFromPM25(pm25), color: 'white' }}
                    />
                    {pm25 > 35 && <WarningIcon color="error" fontSize="small" />}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Temperature: {node.air?.temperature?.toFixed(1)}°C
                    <br />
                    Humidity: {node.air?.humidity?.toFixed(1)}%
                    <br />
                    pH: {node.water?.ph?.toFixed(1)}
                    <br />
                    Last update: {new Date(node.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </Box>
  );
}