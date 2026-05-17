import express from 'express';

import {
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  getMyRoute,
} from '../controllers/routeController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get("/my", (req, res, next) => {
  console.log("MY ROUTE HIT");
  next();
}, protect, authorize("conductor"), getMyRoute);
// Public
router.get('/', getRoutes);
router.get('/:id', (req, res, next) => {
  console.log("GET ROUTE BY ID HIT:", req.params.id);
  next();
}, getRouteById);

// Admin only
router.post('/', protect, authorize('admin'), createRoute);
router.put('/:id', protect, authorize('admin'), updateRoute);
router.delete('/:id', protect, authorize('admin'), deleteRoute);

export default router;