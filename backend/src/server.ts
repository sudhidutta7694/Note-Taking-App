import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import passport from './config/passport';

import authRoutes from './routes/auth';
import notesRoutes from './routes/notes';
import { debugHeaders } from './middleware/debugHeaders';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - Fixed to handle multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
  /\.vercel\.app$/,
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false // Sometimes needed for development
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Passport middleware
app.use(passport.initialize());

app.use('/api', debugHeaders);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// Add this directly in your server.ts/app.ts file
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});
