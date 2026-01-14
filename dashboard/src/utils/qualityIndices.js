export function calculateAQI(airData) {
  const pm25 = airData.pm2_5;
  
  if (pm25 <= 12) return 50 * (pm25 / 12);
  if (pm25 <= 35.4) return 50 + 50 * ((pm25 - 12) / (35.4 - 12));
  if (pm25 <= 55.4) return 100 + 50 * ((pm25 - 35.4) / (55.4 - 35.4));
  if (pm25 <= 150.4) return 150 + 100 * ((pm25 - 55.4) / (150.4 - 55.4));
  if (pm25 <= 250.4) return 200 + 100 * ((pm25 - 150.4) / (250.4 - 150.4));
  if (pm25 <= 350.4) return 300 + 100 * ((pm25 - 250.4) / (350.4 - 250.4));
  if (pm25 <= 500.4) return 400 + 100 * ((pm25 - 350.4) / (500.4 - 350.4));
  return 500;
}

export function calculateWQI(waterData) {
  let score = 100;
  // pH penalty
  if (waterData.ph < 6.5 || waterData.ph > 8.5) {
    score -= 30;
  } else if (waterData.ph < 6.8 || waterData.ph > 8.2) {
    score -= 15;
  }
  
  // Turbidity penalty
  if (waterData.turbidity > 10) score -= 25;
  else if (waterData.turbidity > 5) score -= 10;
  
  // TDS penalty
  if (waterData.tds > 500) score -= 20;
  else if (waterData.tds > 300) score -= 10;
  
  return Math.max(0, score);
}

export function getAQICategory(aqi) {
  if (aqi <= 50) return { level: 'Good', color: '#10b981' };
  if (aqi <= 100) return { level: 'Moderate', color: '#f59e0b' };
  if (aqi <= 150) return { level: 'Unhealthy for Sensitive', color: '#f97316' };
  if (aqi <= 200) return { level: 'Unhealthy', color: '#ef4444' };
  if (aqi <= 300) return { level: 'Very Unhealthy', color: '#8b5cf6' };
  return { level: 'Hazardous', color: '#7c3aed' };
}