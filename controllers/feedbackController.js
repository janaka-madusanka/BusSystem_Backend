import Feedback from '../models/Feedback.js';

// @desc    Submit feedback / complaint
// @route   POST /api/feedback
// @access  Private (passenger)
export const submitFeedback = async (req, res) => {
  try {
    const { bus, problemType, comment } = req.body;

    if (!bus || !problemType || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Bus, problem type, and comment are required',
      });
    }

    const feedback = await Feedback.create({
      bus,
      problemType,
      comment,
      submittedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all feedback (admin)
// @route   GET /api/feedback
// @access  Private (admin)
export const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('bus', 'busNumber busType')
      .populate('submittedBy', 'fullName email')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark feedback as reviewed (admin)
// @route   PUT /api/feedback/:id/review
// @access  Private (admin)
export const reviewFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        isReviewed: true,
        reviewedBy: req.user._id,
        reviewedAt: Date.now(),
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback reviewed',
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my feedback (passenger)
// @route   GET /api/feedback/my
// @access  Private (passenger)
export const getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({
      submittedBy: req.user._id,
    })
      .populate('bus', 'busNumber busType')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};