import Delay from '../models/Delay.js';
import Bus from '../models/Bus.js';

// @desc    Report a delay (conductor)
// @route   POST /api/delays
// @access  Private (conductor)
export const reportDelay = async (req, res) => {
  try {
    const { reason, estimatedDelayMinutes, notes } = req.body;

    if (!req.user.assignedBus) {
      return res.status(400).json({
        success: false,
        message: 'No bus assigned to this conductor',
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Delay reason is required',
      });
    }

    const delay = await Delay.create({
      bus: req.user.assignedBus,
      reportedBy: req.user._id,
      reason,
      estimatedDelayMinutes: estimatedDelayMinutes || 0,
      notes,
    });

    await Bus.findByIdAndUpdate(req.user.assignedBus, {
      currentStatus: 'Delayed',
      currentDelay: estimatedDelayMinutes || 0,
      lastUpdated: Date.now(),
    });

    res.status(201).json({
      success: true,
      message: 'Delay reported',
      data: delay,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active delays
// @route   GET /api/delays
// @access  Public
export const getActiveDelays = async (req, res) => {
  try {
    const delays = await Delay.find({ isResolved: false })
      .populate('bus', 'busNumber busType crowdLevel currentStatus')
      .populate('reportedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: delays.length,
      data: delays,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve delay
// @route   PUT /api/delays/:id/resolve
// @access  Private (conductor, admin)
export const resolveDelay = async (req, res) => {
  try {
    const delay = await Delay.findById(req.params.id);

    if (!delay) {
      return res.status(404).json({
        success: false,
        message: 'Delay not found',
      });
    }

    delay.isResolved = true;
    delay.resolvedAt = Date.now();
    await delay.save();

    await Bus.findByIdAndUpdate(delay.bus, {
      currentStatus: 'Running',
      currentDelay: 0,
      lastUpdated: Date.now(),
    });

    res.status(200).json({
      success: true,
      message: 'Delay resolved',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all delays (admin)
// @route   GET /api/delays/all
// @access  Private (admin)
export const getAllDelays = async (req, res) => {
  try {
    const delays = await Delay.find()
      .populate('bus', 'busNumber busType')
      .populate('reportedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: delays.length,
      data: delays,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyDelays = async (req, res) => {
  try {
    const delays = await Delay.find({
      reportedBy: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: delays,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};