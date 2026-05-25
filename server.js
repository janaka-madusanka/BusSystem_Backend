import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import busRoutes from './routes/busRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import delayRoutes from './routes/delayRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();
await connectDB();

const app = express();


app.use(cors());
app.use(express.json());



// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/delays', delayRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/users', userRoutes);



// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BusTrak API is running',
    timestamp: new Date(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
