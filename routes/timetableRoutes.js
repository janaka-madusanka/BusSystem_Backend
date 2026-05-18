import express from 'express';

import {
  getTimetable,
  getMyBusTimetable,
  upsertTimetable,
  updateTripStatus,
  getAllTimetables,
} from '../controllers/timetableController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/* =========================
   PUBLIC ROUTES
========================= */
router.get('/', getTimetable);

/* =========================
   CONDUCTOR ROUTES
========================= */
router.get(
  '/my-bus',
  protect,
  authorize('conductor'),
  getMyBusTimetable
);

router.post(
  '/',
  protect,
  authorize('conductor'),
  upsertTimetable
);

/* =========================
   ADMIN ROUTES
========================= */
router.get(
  '/all',
  protect,
  authorize('admin'),
  getAllTimetables
);

/* =========================
   SHARED (CONDUCTOR + ADMIN)
========================= */
router.put(
  '/:id/trip/:tripNumber',
  protect,
  authorize('conductor', 'admin'),
  updateTripStatus
);

export default router;