import express from 'express';

import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAdminStats,
  getPassengerDashboard,
  toggleBusAlert,
} from '../controllers/userController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Passenger dashboard
router.get(
  '/dashboard',
  protect,
  authorize('passenger'),
  getPassengerDashboard
);

// Passenger: toggle bus alert subscription
router.put(
  '/alerts/:busId',
  protect,
  authorize('passenger'),
  toggleBusAlert
);

// Admin stats
router.get(
  '/admin/stats',
  protect,
  authorize('admin'),
  getAdminStats
);

// Admin: manage users
router.get('/', protect, authorize('admin'), getAllUsers);
router.post('/', protect, authorize('admin'), createUser);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

export default router;