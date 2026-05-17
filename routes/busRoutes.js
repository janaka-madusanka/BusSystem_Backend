import express from 'express';

import {
  getBuses,
  getBusById,
  getLiveDelayStatus,
  updateCrowdLevel,
  createBus,
  updateBus,
  deleteBus,
  getMyBus,
} from '../controllers/busController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/my-bus', protect, authorize('conductor'), getMyBus);
router.get('/live-delay', getLiveDelayStatus);
// Public routes
router.get('/', getBuses);

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