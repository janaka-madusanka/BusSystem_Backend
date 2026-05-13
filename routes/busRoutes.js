import express from 'express';

import {
  getBuses,
  getBusById,
  getLiveDelayStatus,
  updateCrowdLevel,
  createBus,
  updateBus,
  deleteBus,
} from '../controllers/busController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getBuses);
router.get('/live-delay', getLiveDelayStatus);
router.get('/:id', getBusById);

// Passenger / Conductor / Admin
router.put(
  '/:id/crowd',
  protect,
  authorize('passenger', 'conductor', 'admin'),
  updateCrowdLevel
);

// Admin only
router.post('/', protect, authorize('admin'), createBus);
router.put('/:id', protect, authorize('admin'), updateBus);
router.delete('/:id', protect, authorize('admin'), deleteBus);

export default router;