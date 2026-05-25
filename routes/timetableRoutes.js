import express from 'express';

import {
  getTimetable,
  getMyBusTimetable,
  upsertTimetable,
  upsertBusTimetable,
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

<<<<<<< HEAD
// Conductor/Admin: create/update timetable for selected bus
router.post(
  '/bus/:busId',
  protect,
  authorize('conductor', 'admin'),
  upsertBusTimetable
);

// Conductor/Admin: update trip status
=======
/* =========================
   SHARED (CONDUCTOR + ADMIN)
========================= */
>>>>>>> 29750a206965801820dd079fdb3ddeb33e3b09f5
router.put(
  '/:id/trip/:tripNumber',
  protect,
  authorize('conductor', 'admin'),
  updateTripStatus
);

export default router;
