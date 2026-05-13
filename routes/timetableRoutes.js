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

// Public: search timetable
router.get('/', getTimetable);

// Admin: all timetables
router.get('/all', protect, authorize('admin'), getAllTimetables);

// Conductor: their bus timetable
router.get('/my-bus', protect, authorize('conductor'), getMyBusTimetable);

// Conductor: create/update timetable
router.post('/', protect, authorize('conductor'), upsertTimetable);

// Conductor/Admin: update trip status
router.put(
  '/:id/trip/:tripNumber',
  protect,
  authorize('conductor', 'admin'),
  updateTripStatus
);

export default router;