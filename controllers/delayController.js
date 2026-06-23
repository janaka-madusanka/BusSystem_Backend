import Delay from '../models/Delay.js';
import Timetable from '../models/Timetable.js';
import {
  getLiveTimetableForBus,
  getTodayDate,
} from './timetableController.js';

// @desc    Report a delay (conductor)
// @route   POST /api/delays
// @access  Private (conductor)
export const reportDelay = async (req, res) => {
  try {
    const { reason, estimatedDelayMinutes, notes } = req.body;
    const delayMinutes = Math.max(Number(estimatedDelayMinutes) || 0, 0);
    const allowedReasons = ['Traffic', 'Weather', 'Breakdown', 'Other'];
    const normalizedReason = allowedReasons.includes(reason) ? reason : 'Other';
    const normalizedNotes =
      notes || (normalizedReason === 'Other' && reason !== 'Other' ? reason : undefined);

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

    let delay = await Delay.findOne({
      bus: req.user.assignedBus,
      isResolved: false,
    });

    let timetable = await getLiveTimetableForBus(req.user.assignedBus);

    if (!timetable) {
      timetable = await Timetable.create({
        bus: req.user.assignedBus,
        date: getTodayDate(),
        trips: [],
        isLive: true,
        submittedBy: req.user._id,
      });
    }

    if (delayMinutes > 0) {
      if (!delay) {
        delay = new Delay({
          bus: req.user.assignedBus,
          reportedBy: req.user._id,
        });
      }

      delay.reportedBy = req.user._id;
      delay.reason = normalizedReason;
      delay.estimatedDelayMinutes = delayMinutes;
      delay.notes = normalizedNotes;
      delay.isResolved = false;
      delay.resolvedAt = null;
      await delay.save();
    } else if (delay) {
      delay.isResolved = true;
      delay.resolvedAt = Date.now();
      await delay.save();
    }

    timetable.currentStatus = delayMinutes > 0 ? 'Delayed' : 'Running';
    timetable.currentDelay = delayMinutes;
    timetable.lastUpdated = Date.now();
    await timetable.save();

    res.status(delay ? 200 : 201).json({
      success: true,
      message: delayMinutes > 0 ? 'Delay updated' : 'Delay cleared',
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
      .populate('bus', 'busNumber busType')
      .populate('reportedBy', 'fullName')
      .sort({ createdAt: -1 });

    const busIds = delays.map((delay) => delay.bus?._id).filter(Boolean);
    const timetables = await Timetable.find({ bus: { $in: busIds } }).sort({
      lastUpdated: -1,
    });
    const liveByBus = new Map();

    timetables.forEach((timetable) => {
      const key = timetable.bus.toString();
      if (!liveByBus.has(key)) liveByBus.set(key, timetable);
    });

    const data = delays.map((delay) => {
      const item = delay.toObject();
      const live = item.bus?._id ? liveByBus.get(item.bus._id.toString()) : null;

      if (live) {
        item.timetable = live._id;
        item.currentStatus = live.currentStatus;
        item.currentDelay = live.currentDelay;
        item.crowdLevel = live.crowdLevel;
        item.date = live.date;
      }

      return item;
    });

    res.status(200).json({
      success: true,
      count: data.length,
      data,
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

    const timetable = await getLiveTimetableForBus(delay.bus);

    if (timetable) {
      timetable.currentStatus = 'Running';
      timetable.currentDelay = 0;
      timetable.lastUpdated = Date.now();
      await timetable.save();
    }

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
