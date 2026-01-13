const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    this.enabled = !!process.env.EMAIL_USER;
  }
  
  async sendAlertEmail(alert, nodeData) {
    if (!this.enabled) {
      console.log(' [DEMO] Email would be sent:', alert.message);
      return true;
    }
    
    const mailOptions = {
      from: `"Future Monitoring System" <${process.env.EMAIL_USER}>`,
      to: process.env.ALERT_RECIPIENTS || process.env.EMAIL_USER,
      subject: ` ${alert.severity} ALERT: ${alert.parameter} ${alert.source.toUpperCase()}`,
      html: this.generateAlertEmail(alert, nodeData)
    };
    
    try {
      await this.transporter.sendMail(mailOptions);
      console.log(' Alert email sent');
      return true;
    } catch (error) {
      console.error(' Email error:', error);
      return false;
    }
  }
  
  generateAlertEmail(alert, nodeData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(45deg, #ff6b6b, #ff8e53); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f5f5f5; }
          .alert-box { background: white; border-left: 5px solid #ff6b6b; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1> FUTURE MONITORING SYSTEM ALERT</h1>
            <h2>${alert.severity} Level Alert</h2>
          </div>
          
          <div class="content">
            <div class="alert-box">
              <h3>${alert.message}</h3>
              
              <table>
                <tr><td><strong>Alert Type:</strong></td><td>${alert.type}</td></tr>
                <tr><td><strong>Source:</strong></td><td>${alert.source.toUpperCase()}</td></tr>
                <tr><td><strong>Parameter:</strong></td><td>${alert.parameter}</td></tr>
                <tr><td><strong>Current Value:</strong></td><td>${alert.value.toFixed(2)}</td></tr>
                <tr><td><strong>Threshold:</strong></td><td>${alert.threshold}</td></tr>
                <tr><td><strong>Location:</strong></td><td>${JSON.stringify(alert.location)}</td></tr>
                <tr><td><strong>Time:</strong></td><td>${new Date(alert.timestamp).toLocaleString()}</td></tr>
              </table>
            </div>
            
            <h3>Recommended Actions:</h3>
            <ul>
              ${this.getRecommendedActions(alert)}
            </ul>
            
            <p>
              <a href="http://localhost:3000" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Live Dashboard
              </a>
            </p>
          </div>
          
          <div class="footer">
            <p>Future Monitoring System | Edge AI + IoT + Cloud</p>
            <p>This is an automated alert. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  getRecommendedActions(alert) {
    const actions = [];
    
    if (alert.source === 'air') {
      if (alert.parameter === 'PM2.5') {
        actions.push('<li>Close windows and doors</li>');
        actions.push('<li>Use air purifiers if available</li>');
        actions.push('<li>Sensitive individuals should avoid outdoor activities</li>');
        actions.push('<li>Consider wearing N95 masks if going outside</li>');
      }
      if (alert.parameter === 'CO') {
        actions.push('<li>Immediately ventilate the area</li>');
        actions.push('<li>Check for gas leaks</li>');
        actions.push('<li>If symptoms occur (headache, dizziness), seek fresh air immediately</li>');
      }
    }
    
    if (alert.source === 'water') {
      if (alert.parameter === 'pH') {
        actions.push('<li>Do not use for drinking until tested</li>');
        actions.push('<li>Contact water treatment authorities</li>');
      }
      if (alert.parameter === 'turbidity') {
        actions.push('<li>Boil water before drinking</li>');
        actions.push('<li>Use water filters</li>');
      }
    }
    
    if (actions.length === 0) {
      actions.push('<li>Monitor the situation</li>');
      actions.push('<li>Check dashboard for updates</li>');
      actions.push('<li>Contact system administrator if needed</li>');
    }
    
    return actions.join('');
  }
}

module.exports = new EmailService();