import express from 'express';

import {
  reportDelay,
  getActiveDelays,
  resolveDelay,
  getAllDelays,
} from '../controllers/delayController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public: view active delays
router.get('/', getActiveDelays);

// Admin: all delays
router.get('/all', protect, authorize('admin'), getAllDelays);

// Conductor: report delay
router.post('/', protect, authorize('conductor'), reportDelay);

// Conductor / Admin: resolve delay
router.put(
  '/:id/resolve',
  protect,
  authorize('conductor', 'admin'),
  resolveDelay
);

export default router;