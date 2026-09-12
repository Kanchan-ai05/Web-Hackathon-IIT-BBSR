const path = require('path');
// Ensure dotenv is loaded immediately before any other module or database code
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

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

// Dynamic CORS configuration: permits configured CLIENT_URL, Vercel, Netlify, and dev origins
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
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.netlify.app') ||
        process.env.NODE_ENV !== 'production'
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

// Validate mandatory environment secrets
if (!process.env.MONGODB_URI) {
  console.error('💥 FATAL CONFIGURATION ERROR: process.env.MONGODB_URI is not defined.');
  console.error('Please configure MONGODB_URI in your environment variables or .env file.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('💥 FATAL CONFIGURATION ERROR: process.env.JWT_SECRET is not defined.');
  console.error('Please configure JWT_SECRET in your environment variables or .env file.');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
const maskedUri = MONGODB_URI.includes('@')
  ? MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:*****@')
  : MONGODB_URI;

const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  autoIndex: process.env.NODE_ENV !== 'production'
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB connection lost. Reconnecting...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB connection restored.');
});

let dbPromise = null;
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  if (!dbPromise) {
    dbPromise = mongoose
      .connect(MONGODB_URI, mongooseOptions)
      .then(async () => {
        console.log(`🔮 Connected to MongoDB Realm (${maskedUri})`);
        await seedDefaultShopItems().catch(() => {});
      })
      .catch((err) => {
        dbPromise = null;
        console.error('💥 Guild database connection failed:', err.message);
        if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
          console.error('👉 MongoDB Atlas Auth Failure: Verify your database username and password in MONGODB_URI.');
          console.error('👉 Note: If your password contains special characters (like @, #, %, !), ensure they are URL-encoded.');
        } else if (err.message.includes('whitelisted') || err.message.includes('selection timed out') || err.name === 'MongoServerSelectionError') {
          console.error('👉 MongoDB Atlas Network Issue: Verify that IP Whitelist in Atlas Network Access includes 0.0.0.0/0 (Allow Access from Anywhere).');
        }
        throw err;
      });
  }
  return dbPromise;
};

if (process.env.VERCEL) {
  app.use(async (req, res, next) => {
    try {
      await connectDB();
    } catch (e) {
      // Allow request to proceed to route handlers/error handlers
    }
    next();
  });
} else {
  connectDB()
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log(`🏰 Life RPG Server listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
        console.log(`⚔️  Guild Hall API mounted at /api`);
      });

      // Graceful shutdown
      const handleShutdown = async (signal) => {
        console.log(`\n🛡️  Received ${signal}. Shutting down Life RPG Server gracefully...`);
        server.close(async () => {
          await mongoose.connection.close(false);
          console.log('🔮 MongoDB Realm connection safely closed.');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => handleShutdown('SIGTERM'));
      process.on('SIGINT', () => handleShutdown('SIGINT'));
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = app;
