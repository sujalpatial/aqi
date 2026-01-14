import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Chip, LinearProgress, Stack, Alert, AlertTitle } from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TimelineIcon from '@mui/icons-material/Timeline';
import WarningIcon from '@mui/icons-material/Warning';
import { useSocket } from '../hooks/useSocket';

export default function AIPanel() {
  const [aiAlerts, setAiAlerts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const socket = useSocket('http://localhost:5000');
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('ai_alert', (data) => {
      setAiAlerts(prev => [data, ...prev.slice(0, 4)]);
    });
    
    socket.on('ai_prediction', (data) => {
      setPredictions(prev => [data, ...prev.slice(0, 2)]);
    });
    
    return () => {
      socket.off('ai_alert');
      socket.off('ai_prediction');
    };
  }, [socket]);
  
  const latestPrediction = predictions[0];
  
  return (
    <Stack spacing={2}>
      {/* AI Prediction Card */}
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PsychologyIcon color="primary" />
            <Typography variant="h6">Edge AI Predictions</Typography>
          </Box>
          
          {latestPrediction ? (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Next 3 hours forecast:
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Predicted AQI
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4">
                      {latestPrediction.prediction.prediction?.aqi_in_3h?.toFixed(0) || 'N/A'}
                    </Typography>
                    <Chip 
                      label={latestPrediction.prediction.prediction?.trend || '→'} 
                      color={
                        latestPrediction.prediction.prediction?.trend?.includes('↑') 
                          ? 'error' 
                          : 'success'
                      }
                      size="small"
                    />
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Prediction Confidence
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(latestPrediction.prediction.confidence || 0) * 100}
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {(latestPrediction.prediction.confidence || 0) * 100}% confidence
                  </Typography>
                </Box>
                
                <Alert severity="info" sx={{ mt: 1 }}>
                  <AlertTitle>Recommendation</AlertTitle>
                  {latestPrediction.prediction.prediction?.recommendation || 
                   'No specific recommendation available.'}
                </Alert>
              </Stack>
            </Box>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              AI predictions will appear here once enough data is collected...
            </Typography>
          )}
        </CardContent>
      </Card>
      
      {/* AI Alerts */}
      {aiAlerts.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WarningIcon color="error" />
              <Typography variant="h6">AI Anomaly Detection</Typography>
              <Chip label={aiAlerts.length} size="small" color="error" />
            </Box>
            
            <Stack spacing={1}>
              {aiAlerts.slice(0, 3).map((alert, index) => (
                <Alert 
                  key={index} 
                  severity="warning"
                  sx={{ 
                    border: 1, 
                    borderColor: 'warning.light',
                    bgcolor: 'rgba(255, 152, 0, 0.05)'
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    {alert.anomaly_result?.reason || 'Anomaly detected'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Confidence: {(alert.anomaly_result?.confidence * 100)?.toFixed(0)}%
                  </Typography>
                </Alert>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}