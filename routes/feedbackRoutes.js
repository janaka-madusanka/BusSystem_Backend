import express from 'express';

import {
  submitFeedback,
  getAllFeedback,
  reviewFeedback,
  getMyFeedback,
} from '../controllers/feedbackController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Passenger: submit feedback
router.post('/', protect, authorize('passenger'), submitFeedback);

// Passenger: get own feedback
router.get('/my', protect, authorize('passenger'), getMyFeedback);

// Admin: all feedback
router.get('/', protect, authorize('admin'), getAllFeedback);

// Admin: mark reviewed
router.put('/:id/review', protect, authorize('admin'), reviewFeedback);

export default router;