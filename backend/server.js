const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const passwordResetRoutes = require('./routes/passwordReset');
const registrationRoutes = require('./routes/registration');
const reportsRoutes = require('./routes/reports');
const attendanceRoutes = require('./routes/attendance');
const attendanceTestRoutes = require('./routes/attendance-test');
const healthRoutes = require('./routes/health');
const systemSettingsRoutes = require('./routes/systemSettings');
const schemesRoutes = require('./routes/schemes-simple');
const feedbackRoutes = require('./routes/feedback');
const ashaRoutes = require('./routes/asha');
const pregnancyRoutes = require('./routes/pregnancy');
const sanitationRoutes = require('./routes/sanitation');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { initializeFirebase } = require('./config/firebase');

const app = express();

// Initialize Firebase Admin
try {
  initializeFirebase();
} catch (error) {
  console.log('Firebase initialization skipped:', error.message);
}

// CORS first so every response (including ping and preflight OPTIONS) gets CORS headers
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-frontend-domain.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};
app.use(cors(corsOptions));

// Security middleware
app.use(helmet());
app.use(compression());

// Ping for frontend connection check (before rate limit so it always works)
app.get('/api/ping', (req, res) => {
  res.json({ status: 'OK', ts: Date.now() });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

const PORT = process.env.PORT || 5000;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

// API routes
try {
  app.use('/api/auth', authRoutes);
} catch (e) { console.log('Auth routes not available'); }

try {
  app.use('/api/users', userRoutes);
} catch (e) { console.log('User routes not available'); }

try {
  app.use('/api/admin', adminRoutes);
} catch (e) { console.log('Admin routes not available'); }

try {
  app.use('/api/password-reset', passwordResetRoutes);
} catch (e) { console.log('Password reset routes not available'); }

try {
  app.use('/api/registration', registrationRoutes);
} catch (e) { console.log('Registration routes not available'); }

try {
  app.use('/api/reports', reportsRoutes);
} catch (e) { console.log('Reports routes not available'); }

try {
  app.use('/api/attendance', attendanceRoutes);
} catch (e) { console.log('Attendance routes not available'); }

try {
  app.use('/api/attendance-test', attendanceTestRoutes);
} catch (e) { console.log('Attendance test routes not available'); }

try {
  app.use('/api/health', healthRoutes);
} catch (e) { console.log('Health routes not available'); }

try {
  app.use('/api/admin/settings', systemSettingsRoutes);
} catch (e) { console.log('System settings routes not available'); }

// Schemes routes (essential for welfare benefits)
app.use('/api/schemes', schemesRoutes);

// Feedback routes (essential for parent feedback)
app.use('/api/feedback', feedbackRoutes);

// ASHA routes (for ASHA worker dashboard)
try {
  app.use('/api/asha', ashaRoutes);
} catch (e) { console.log('ASHA routes not available'); }

// Pregnancy routes (for pregnancy monitoring)
try {
  app.use('/api/pregnancy', pregnancyRoutes);
} catch (e) { console.log('Pregnancy routes not available'); }

// Sanitation routes (for sanitation worker dashboard)
try {
  app.use('/api/sanitation', sanitationRoutes);
} catch (e) { console.log('Sanitation routes not available'); }

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SampoornaAngan API',
    version: '1.0.0',
    health: '/health',
    availableEndpoints: [
      '/api/schemes',
      '/api/auth',
      '/api/users',
      '/health'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: ['/', '/health', '/api/schemes']
  });
});

// Error handling middleware
try {
  app.use(errorHandler);
} catch (e) {
  console.log('Custom error handler not available, using default');
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });
}

// Basic database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sampoornaangan';
    console.log('🔗 Attempting to connect to MongoDB:', mongoUri);
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('⚠️  Continuing without database connection...');
    return null;
  }
};

// Start server
const FALLBACK_PORT = 5000;

const listen = (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      const portHint = port !== 5000
        ? `\n💡 Frontend proxy: in forntend/.env set VITE_BACKEND_PORT=${port} so /api reaches this server.`
        : '';
      console.log(`
🚀 SampoornaAngan Backend Server Started
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server running on port ${port}
📊 Health check: http://localhost:${port}/health
📚 API Base URL: http://localhost:${port}/api
🔧 Available endpoints:
   • GET  /api/schemes - Get welfare schemes
   • GET  /api/schemes/enrollments - Get enrollments
   • POST /api/schemes/enroll - Enroll in scheme${portHint}
      `);
      resolve(server);
    });
    server.on('error', (err) => reject(err));
  });
};

const startServer = async () => {
  try {
    await connectDB();

    let server;
    try {
      server = await listen(PORT);
    } catch (err) {
      if (err.code === 'EADDRINUSE' && PORT !== FALLBACK_PORT) {
        console.warn(`⚠️ Port ${PORT} is already in use. Trying port ${FALLBACK_PORT}...`);
        server = await listen(FALLBACK_PORT);
        console.warn(`💡 To free port ${PORT}, stop the other process or set PORT=${FALLBACK_PORT} in backend/.env`);
      } else {
        throw err;
      }
    }

    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();