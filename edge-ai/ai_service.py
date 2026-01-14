import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import json
import paho.mqtt.client as mqtt
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class EdgeAIService:
    def __init__(self):
        self.anomaly_model = None
        self.scaler = StandardScaler()
        self.training_data = []
        self.is_trained = False
        self.prediction_history = []
        
    def train_initial_model(self, initial_data):
        """Train initial anomaly detection model"""
        if len(initial_data) < 50:
            print("  Not enough data for training")
            return False
            
        # Prepare features
        features = self.extract_features(initial_data)
        
        # Train Isolation Forest
        self.anomaly_model = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42
        )
        
        scaled_features = self.scaler.fit_transform(features)
        self.anomaly_model.fit(scaled_features)
        self.is_trained = True
        
        print(f" Anomaly detection model trained on {len(initial_data)} samples")
        return True
    
    def extract_features(self, data_points):
        """Extract features for ML model"""
        features = []
        for dp in data_points:
            features.append([
                dp['air']['pm2_5'],
                dp['air']['pm10'],
                dp['air']['no2'],
                dp['air']['co'],
                dp['air']['temperature'],
                dp['air']['humidity'],
                dp['water']['ph'],
                dp['water']['turbidity'],
                dp['water']['tds'],
                dp['water']['temperature']
            ])
        return np.array(features)
    
    def detect_anomalies(self, new_data):
        """Detect anomalies in new sensor readings"""
        if not self.is_trained or self.anomaly_model is None:
            return {"anomaly": False, "confidence": 0, "reason": "Model not trained"}
        
        # Extract features
        features = self.extract_features([new_data])
        scaled_features = self.scaler.transform(features)
        
        # Predict anomaly
        prediction = self.anomaly_model.predict(scaled_features)[0]
        anomaly_score = self.anomaly_model.score_samples(scaled_features)[0]
        
        is_anomaly = prediction == -1
        confidence = abs(anomaly_score)
        
        # Determine anomaly reason
        reason = "Normal"
        if is_anomaly:
            reason = self.explain_anomaly(new_data)
        
        return {
            "anomaly": bool(is_anomaly),
            "confidence": float(confidence),
            "reason": reason,
            "anomaly_score": float(anomaly_score),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    def explain_anomaly(self, data):
        """Generate human-readable explanation for anomaly"""
        reasons = []
        
        # Check individual parameters
        if data['air']['pm2_5'] > 150:
            reasons.append(f"Extremely high PM2.5 ({data['air']['pm2_5']:.1f} μg/m³)")
        
        if data['air']['co'] > 9:
            reasons.append(f"High CO level ({data['air']['co']:.1f} ppm)")
        
        if data['water']['ph'] < 5 or data['water']['ph'] > 9:
            reasons.append(f"Extreme pH ({data['water']['ph']:.1f})")
        
        if data['water']['turbidity'] > 50:
            reasons.append(f"High turbidity ({data['water']['turbidity']:.1f} NTU)")
        
        # Check for sudden changes
        if len(self.prediction_history) > 10:
            last_data = self.prediction_history[-10:]
            avg_pm25 = np.mean([d['air']['pm2_5'] for d in last_data])
            current_pm25 = data['air']['pm2_5']
            
            if current_pm25 > avg_pm25 * 2:  # Doubled suddenly
                reasons.append(f"PM2.5 spike: {avg_pm25:.1f} → {current_pm25:.1f}")
        
        return " | ".join(reasons) if reasons else "Statistical anomaly"
    
    def predict_future(self, historical_data, hours_ahead=3):
        """Simple time series prediction (simplified)"""
        if len(historical_data) < 24:
            return {"prediction": "Insufficient data", "confidence": 0}
        
        # Extract PM2.5 history
        pm25_history = [d['air']['pm2_5'] for d in historical_data[-24:]]
        
        # Simple moving average prediction
        window = 6
        if len(pm25_history) >= window:
            last_values = pm25_history[-window:]
            predicted = np.mean(last_values) * (1 + 0.1 * hours_ahead)  # Simple trend
            
            # Add some randomness for realism
            predicted += np.random.normal(0, predicted * 0.1)
            
            # Determine trend
            if len(pm25_history) >= 2:
                trend = "↑ increasing" if pm25_history[-1] > pm25_history[-2] else "↓ decreasing"
            else:
                trend = "→ stable"
            
            return {
                "prediction": {
                    "pm2_5_in_3h": float(predicted),
                    "aqi_in_3h": self.calculate_aqi_from_pm25(predicted),
                    "trend": trend,
                    "confidence": 0.7,
                    "recommendation": self.get_recommendation(predicted)
                },
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        
        return {"prediction": "Insufficient data", "confidence": 0}
    
    def calculate_aqi_from_pm25(self, pm25):
        """Calculate AQI from PM2.5"""
        # Simplified calculation
        if pm25 <= 12: return (50/12) * pm25
        elif pm25 <= 35.4: return 50 + (50/(35.4-12)) * (pm25-12)
        elif pm25 <= 55.4: return 100 + (50/(55.4-35.4)) * (pm25-35.4)
        elif pm25 <= 150.4: return 150 + (100/(150.4-55.4)) * (pm25-55.4)
        elif pm25 <= 250.4: return 200 + (100/(250.4-150.4)) * (pm25-150.4)
        elif pm25 <= 350.4: return 300 + (100/(350.4-250.4)) * (pm25-250.4)
        elif pm25 <= 500.4: return 400 + (100/(500.4-350.4)) * (pm25-350.4)
        else: return 500
    
    def get_recommendation(self, predicted_pm25):
        """Get health recommendation based on prediction"""
        if predicted_pm25 <= 35:
            return "Air quality good. Normal outdoor activities safe."
        elif predicted_pm25 <= 75:
            return "Moderate air quality. Sensitive individuals should reduce prolonged outdoor exertion."
        elif predicted_pm25 <= 115:
            return "Unhealthy for sensitive groups. Children and elderly should avoid outdoor activities."
        elif predicted_pm25 <= 150:
            return "Unhealthy. Everyone should reduce outdoor activities."
        else:
            return "Very unhealthy to hazardous. Avoid all outdoor activities. Use air purifiers."

# ==================== MQTT INTEGRATION ====================
class EdgeAIBridge:
    def __init__(self):
        self.mqtt_client = mqtt.Client()
        self.ai_service = EdgeAIService()
        self.data_buffer = []
        
    def connect(self):
        self.mqtt_client.connect("broker.hivemq.com", 1883)
        self.mqtt_client.subscribe("future-monitoring/sensor-data")
        self.mqtt_client.on_message = self.on_message
        self.mqtt_client.loop_start()
        print(" Edge AI Service Started")
        print(" Listening for sensor data...")
      
    def on_message(self, client, userdata, msg):
        try:
            data = json.loads(msg.payload.decode())
            
            # Add to buffer for training
            self.data_buffer.append(data)
            
            # Train model when we have enough data
            if len(self.data_buffer) == 100 and not self.ai_service.is_trained:
                print(" Training anomaly detection model...")
                self.ai_service.train_initial_model(self.data_buffer)
            
            # Detect anomalies
            if self.ai_service.is_trained:
                anomaly_result = self.ai_service.detect_anomalies(data)
                
                if anomaly_result["anomaly"]:
                    print(f"🚨 ANOMALY DETECTED: {anomaly_result['reason']}")
                    print(f"   Confidence: {anomaly_result['confidence']:.2f}")
                    
                    # Publish anomaly alert
                    alert_payload = {
                        "type": "AI_ANOMALY",
                        "node_id": data["node_id"],
                        "data": data,
                        "anomaly_result": anomaly_result,
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    }
                    
                    self.mqtt_client.publish(
                        "future-monitoring/ai-alerts",
                        json.dumps(alert_payload)
                    )
                
                # Store for prediction history
                self.ai_service.prediction_history.append(data)
                
                # Generate predictions every 10 minutes
                if len(self.ai_service.prediction_history) % 60 == 0:
                    prediction = self.ai_service.predict_future(
                        self.ai_service.prediction_history[-100:],
                        hours_ahead=3
                    )
                    
                    if "prediction" in prediction and prediction["prediction"] != "Insufficient data":
                        prediction_payload = {
                            "type": "AI_PREDICTION",
                            "node_id": data["node_id"],
                            "prediction": prediction,
                            "timestamp": datetime.utcnow().isoformat() + "Z"
                        }
                        
                        self.mqtt_client.publish(
                            "future-monitoring/ai-predictions",
                            json.dumps(prediction_payload)
                        )
                        
                        print(f"🔮 AI Prediction: AQI in 3h = {prediction['prediction']['aqi_in_3h']:.0f}")
                        
        except Exception as e:
            print(f"Error in AI processing: {e}")

if __name__ == "__main__":
    bridge = EdgeAIBridge()
    bridge.connect()
    
    import time
    while True:
        time.sleep(1)