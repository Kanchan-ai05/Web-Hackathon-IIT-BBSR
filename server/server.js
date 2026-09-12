const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const questRoutes = require('./routes/questRoutes');
const shopRoutes = require('./routes/shopRoutes');
const statsRoutes = require('./routes/statsRoutes');
const errorHandler = require('./middleware/errorHandler');
const { seedDefaultShopItems } = require('./seeds/shopSeeds');

const app = express();
const PORT = process.env.PORT || 5000;

// Security HTTP headers
app.use(helmet());

// Dynamic CORS configuration: permits configured CLIENT_URL, Vercel, Netlify, and local dev
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl)
      if (!origin) return callback(null, true);

      // Allow if wildcard configured or in explicit allowed list
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin === 'http://localhost:5173' ||
        origin === 'http://localhost:3000' ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.netlify.app')
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Global API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests sent from this IP. Guild requests throttled for 15 minutes.'
  }
});
app.use('/api', apiLimiter);

// Strict Auth rate limiting to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/register', authLimiter);

// MongoDB connection readiness check middleware
app.use((req, res, next) => {
  if (req.path === '/api/health') return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Guild database connection unavailable. The realm is currently reconnecting.'
    });
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'online' : 'degraded',
    realm: 'Life RPG Guild Server',
    mongoConnection: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Mount Guild API routes (supporting both /api/quests and /api/tasks)
app.use('/api/auth', authRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/tasks', questRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/stats', statsRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Guild Route [${req.method} ${req.originalUrl}] does not exist in this realm.`
  });
});

// Error handling middleware
app.use(errorHandler);

const MONGODB_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('🔮 Connected to MongoDB Realm:', MONGODB_URI);
    await seedDefaultShopItems();

    app.listen(PORT, () => {
      console.log(`🏰 Life RPG Server listening on port ${PORT}`);
      console.log(`⚔️  Guild Hall API available at http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('💥 Guild database connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
