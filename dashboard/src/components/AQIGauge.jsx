import React from 'react';
import { Box, Typography } from '@mui/material';

export default function AQIGauge({ value }) {
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