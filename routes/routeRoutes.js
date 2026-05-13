import express from 'express';

import {
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
} from '../controllers/routeController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public
router.get('/', getRoutes);
router.get('/:id', getRouteById);

// Admin only
router.post('/', protect, authorize('admin'), createRoute);
router.put('/:id', protect, authorize('admin'), updateRoute);
router.delete('/:id', protect, authorize('admin'), deleteRoute);

export default router;