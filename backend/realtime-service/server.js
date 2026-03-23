const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5174",
  methods: ["GET", "POST"],
  credentials: true
}));

// Socket.IO configuration
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5174",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connected users and their roles
const connectedUsers = new Map();
const userSockets = new Map();

// MongoDB change streams for real-time updates
let changeStreams = {};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Handle user authentication
  socket.on('authenticate', async (userData) => {
    try {
      const { userId, role, token } = userData;
      
      // Here you would validate the token
      // For now, we'll assume it's valid
      
      connectedUsers.set(socket.id, {
        userId,
        role,
        socketId: socket.id,
        connectedAt: new Date()
      });
      
      userSockets.set(userId, socket.id);
      
      // Join role-based rooms
      socket.join(`role-${role}`);
      socket.join(`user-${userId}`);
      
      // Send confirmation
      socket.emit('authenticated', {
        success: true,
        userId,
        role,
        message: 'Successfully authenticated'
      });
      
      console.log(`User ${userId} (${role}) authenticated`);
      
      // Notify other users about new connection
      socket.broadcast.emit('user-connected', {
        userId,
        role,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('authentication-error', {
        message: 'Authentication failed'
      });
    }
  });
  
  // Handle pregnancy health updates
  socket.on('pregnancy-health-update', async (data) => {
    try {
      const { womanId, healthData, updatedBy } = data;
      
      // Broadcast to relevant users
      const targetRoles = ['asha', 'anganwadi', 'doctor', 'admin'];
      
      targetRoles.forEach(role => {
        io.to(`role-${role}`).emit('health-update', {
          type: 'pregnancy-health',
          womanId,
          healthData,
          updatedBy,
          timestamp: new Date(),
          message: `Health record updated for woman ${womanId}`
        });
      });
      
      // Also send to specific users if they're monitoring this woman
      const monitoringUsers = await getMonitoringUsers(womanId);
      monitoringUsers.forEach(userId => {
        const userSocketId = userSockets.get(userId);
        if (userSocketId) {
          io.to(userSocketId).emit('health-update', {
            type: 'pregnancy-health',
            womanId,
            healthData,
            updatedBy,
            timestamp: new Date(),
            priority: 'high'
          });
        }
      });
      
    } catch (error) {
      console.error('Error handling health update:', error);
      socket.emit('error', { message: 'Failed to process health update' });
    }
  });
  
  // Handle supplement updates
  socket.on('supplement-update', async (data) => {
    try {
      const { womanId, supplementData, updatedBy } = data;
      
      const targetRoles = ['asha', 'anganwadi', 'doctor'];
      
      targetRoles.forEach(role => {
        io.to(`role-${role}`).emit('supplement-update', {
          type: 'supplement-tracking',
          womanId,
          supplementData,
          updatedBy,
          timestamp: new Date(),
          message: `Supplement record updated for woman ${womanId}`
        });
      });
      
    } catch (error) {
      console.error('Error handling supplement update:', error);
      socket.emit('error', { message: 'Failed to process supplement update' });
    }
  });
  
  // Handle appointment updates
  socket.on('appointment-update', async (data) => {
    try {
      const { womanId, appointmentData, action, updatedBy } = data;
      
      const targetRoles = ['asha', 'anganwadi', 'doctor'];
      
      targetRoles.forEach(role => {
        io.to(`role-${role}`).emit('appointment-update', {
          type: 'appointment',
          womanId,
          appointmentData,
          action, // created, updated, cancelled, missed
          updatedBy,
          timestamp: new Date(),
          message: `Appointment ${action} for woman ${womanId}`
        });
      });
      
      // Send high priority notification for missed appointments
      if (action === 'missed') {
        const urgentRoles = ['asha', 'anganwadi', 'doctor'];
        urgentRoles.forEach(role => {
          io.to(`role-${role}`).emit('urgent-alert', {
            type: 'missed-appointment',
            womanId,
            appointmentData,
            updatedBy,
            timestamp: new Date(),
            priority: 'high',
            message: `Missed appointment for woman ${womanId} - immediate follow-up required`
          });
        });
      }
      
    } catch (error) {
      console.error('Error handling appointment update:', error);
      socket.emit('error', { message: 'Failed to process appointment update' });
    }
  });
  
  // Handle ASHA visit updates
  socket.on('asha-visit-update', async (data) => {
    try {
      const { womanId, visitData, updatedBy } = data;
      
      const targetRoles = ['asha', 'anganwadi', 'doctor'];
      
      targetRoles.forEach(role => {
        io.to(`role-${role}`).emit('asha-visit-update', {
          type: 'asha-visit',
          womanId,
          visitData,
          updatedBy,
          timestamp: new Date(),
          message: `ASHA visit completed for woman ${womanId}`
        });
      });
      
      // Check for high-risk visits
      if (visitData.healthAssessment && visitData.healthAssessment.riskScore >= 7) {
        const urgentRoles = ['asha', 'anganwadi', 'doctor', 'admin'];
        urgentRoles.forEach(role => {
          io.to(`role-${role}`).emit('urgent-alert', {
            type: 'high-risk-visit',
            womanId,
            visitData,
            updatedBy,
            timestamp: new Date(),
            priority: 'critical',
            message: `High-risk pregnancy detected during ASHA visit for woman ${womanId}`
          });
        });
      }
      
    } catch (error) {
      console.error('Error handling ASHA visit update:', error);
      socket.emit('error', { message: 'Failed to process ASHA visit update' });
    }
  });
  
  // Handle alert updates
  socket.on('alert-update', async (data) => {
    try {
      const { alertData, action, updatedBy } = data;
      
      // Determine target audience based on alert priority
      let targetRoles = ['asha', 'anganwadi'];
      
      if (alertData.priority === 'critical' || alertData.priority === 'urgent') {
        targetRoles.push('doctor', 'admin');
      }
      
      targetRoles.forEach(role => {
        io.to(`role-${role}`).emit('alert-update', {
          type: 'alert',
          alertData,
          action, // created, acknowledged, resolved, escalated
          updatedBy,
          timestamp: new Date(),
          message: `Alert ${action}: ${alertData.title}`
        });
      });
      
      // Send immediate notification for critical alerts
      if (alertData.priority === 'critical') {
        io.emit('critical-alert', {
          alertData,
          action,
          updatedBy,
          timestamp: new Date(),
          message: `CRITICAL ALERT: ${alertData.title}`,
          requiresImmediateAction: true
        });
      }
      
    } catch (error) {
      console.error('Error handling alert update:', error);
      socket.emit('error', { message: 'Failed to process alert update' });
    }
  });
  
  // Handle AI prediction updates
  socket.on('ai-prediction-update', async (data) => {
    try {
      const { womanId, predictionData, updatedBy } = data;
      
      const targetRoles = ['asha', 'anganwadi', 'doctor', 'admin'];
      
      targetRoles.forEach(role => {
        io.to(`role-${role}`).emit('ai-prediction-update', {
          type: 'ai-prediction',
          womanId,
          predictionData,
          updatedBy,
          timestamp: new Date(),
          message: `AI risk prediction updated for woman ${womanId}`
        });
      });
      
      // Send special notification for high-risk predictions
      if (predictionData.risk === 'HIGH' || predictionData.risk === 'CRITICAL') {
        targetRoles.forEach(role => {
          io.to(`role-${role}`).emit('urgent-alert', {
            type: 'ai-risk-prediction',
            womanId,
            predictionData,
            updatedBy,
            timestamp: new Date(),
            priority: predictionData.risk === 'CRITICAL' ? 'critical' : 'high',
            message: `AI predicts ${predictionData.risk.toLowerCase()} risk pregnancy for woman ${womanId}`
          });
        });
      }
      
    } catch (error) {
      console.error('Error handling AI prediction update:', error);
      socket.emit('error', { message: 'Failed to process AI prediction update' });
    }
  });
  
  // Handle real-time dashboard updates
  socket.on('dashboard-update', (data) => {
    try {
      const { dashboardType, updateData, targetRole } = data;
      
      if (targetRole) {
        io.to(`role-${targetRole}`).emit('dashboard-update', {
          type: dashboardType,
          updateData,
          timestamp: new Date()
        });
      } else {
        // Broadcast to all connected users
        socket.broadcast.emit('dashboard-update', {
          type: dashboardType,
          updateData,
          timestamp: new Date()
        });
      }
      
    } catch (error) {
      console.error('Error handling dashboard update:', error);
      socket.emit('error', { message: 'Failed to process dashboard update' });
    }
  });
  
  // Handle user location updates (for field workers)
  socket.on('location-update', (data) => {
    try {
      const { userId, location, timestamp } = data;
      
      const userInfo = connectedUsers.get(socket.id);
      if (userInfo) {
        // Broadcast location to supervisors
        io.to('role-admin').emit('field-worker-location', {
          userId,
          role: userInfo.role,
          location,
          timestamp: timestamp || new Date()
        });
        
        // Broadcast to other field workers in same area
        socket.broadcast.emit('nearby-worker-location', {
          userId,
          role: userInfo.role,
          location,
          timestamp: timestamp || new Date()
        });
      }
      
    } catch (error) {
      console.error('Error handling location update:', error);
      socket.emit('error', { message: 'Failed to process location update' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    try {
      const userInfo = connectedUsers.get(socket.id);
      if (userInfo) {
        connectedUsers.delete(socket.id);
        userSockets.delete(userInfo.userId);
        
        console.log(`User disconnected: ${userInfo.userId} (${userInfo.role})`);
        
        // Notify other users
        socket.broadcast.emit('user-disconnected', {
          userId: userInfo.userId,
          role: userInfo.role,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Helper function to get users monitoring a specific woman
async function getMonitoringUsers(womanId) {
  try {
    // This would query your database to find users who are monitoring this woman
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('Error getting monitoring users:', error);
    return [];
  }
}

// MongoDB Change Streams for real-time database updates
async function setupChangeStreams() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sampoornaangan');
    
    // Pregnancy Health Logs Change Stream
    const healthLogChangeStream = mongoose.connection.collection('pregnancyhealthlogs').watch();
    changeStreams.healthLogs = healthLogChangeStream;
    
    healthLogChangeStream.on('change', (change) => {
      if (change.operationType === 'insert' || change.operationType === 'update') {
        const document = change.fullDocument;
        
        // Broadcast health log updates
        io.emit('database-change', {
          collection: 'pregnancyhealthlogs',
          operation: change.operationType,
          document: document,
          timestamp: new Date()
        });
      }
    });
    
    // Alerts Change Stream
    const alertsChangeStream = mongoose.connection.collection('alerts').watch();
    changeStreams.alerts = alertsChangeStream;
    
    alertsChangeStream.on('change', (change) => {
      if (change.operationType === 'insert' || change.operationType === 'update') {
        const document = change.fullDocument;
        
        // Broadcast alert updates
        io.emit('database-change', {
          collection: 'alerts',
          operation: change.operationType,
          document: document,
          timestamp: new Date()
        });
        
        // Send immediate notification for critical alerts
        if (document.priority === 'critical' || document.priority === 'urgent') {
          io.emit('critical-alert', {
            alert: document,
            timestamp: new Date(),
            requiresImmediateAction: true
          });
        }
      }
    });
    
    console.log('MongoDB Change Streams setup completed');
    
  } catch (error) {
    console.error('Error setting up change streams:', error);
  }
}

// API endpoint to get connected users statistics
app.get('/api/realtime/stats', (req, res) => {
  try {
    const stats = {
      totalConnected: connectedUsers.size,
      connectedByRole: {},
      connectedUsers: Array.from(connectedUsers.values()).map(user => ({
        userId: user.userId,
        role: user.role,
        connectedAt: user.connectedAt
      }))
    };
    
    // Count by role
    connectedUsers.forEach(user => {
      stats.connectedByRole[user.role] = (stats.connectedByRole[user.role] || 0) + 1;
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// API endpoint to broadcast message to specific role
app.post('/api/realtime/broadcast', (req, res) => {
  try {
    const { role, message, data } = req.body;
    
    io.to(`role-${role}`).emit('broadcast-message', {
      message,
      data,
      timestamp: new Date(),
      from: 'system'
    });
    
    res.json({ success: true, message: `Broadcast sent to role: ${role}` });
  } catch (error) {
    console.error('Error broadcasting message:', error);
    res.status(500).json({ error: 'Failed to broadcast message' });
  }
});

// Start server
const PORT = process.env.REALTIME_PORT || 5009;
server.listen(PORT, async () => {
  console.log(`Real-time server running on port ${PORT}`);
  
  // Setup MongoDB change streams
  await setupChangeStreams();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Close change streams
  Object.values(changeStreams).forEach(stream => {
    if (stream) stream.close();
  });
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, io };
