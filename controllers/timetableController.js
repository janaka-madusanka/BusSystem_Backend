import Timetable from '../models/Timetable.js';
import Bus from '../models/Bus.js';

// @desc    Get timetable by date
// @route   GET /api/timetable
// @access  Public
export const getTimetable = async (req, res) => {
  try {
    const { date, busType } = req.query;

    const filter = {};
    if (date) filter.date = date;

    let timetables = await Timetable.find(filter)
      .populate({
        path: 'bus',
        match:
          busType && busType !== 'All'
            ? { busType, isActive: true }
            : { isActive: true },
        select: 'busNumber busType currentStatus currentDelay crowdLevel',
        populate: { path: 'route', select: 'origin destination' },
      })
      .populate('submittedBy', 'fullName');

    timetables = timetables.filter((t) => t.bus !== null);

    res.status(200).json({
      success: true,
      count: timetables.length,
      data: timetables,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// @desc    Create or update timetable
// @route   POST /api/timetable
// @access  Private
export const upsertTimetable = async (req, res) => {
  try {
    const { date, trips } = req.body;

    if (!req.user.assignedBus) {
      return res.status(400).json({
        success: false,
        message: 'No bus assigned to this conductor',
      });
    }

    if (!date || !Array.isArray(trips) || trips.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Date and trips are required',
      });
    }

    const timetable = await Timetable.findOneAndUpdate(
      { bus: req.user.assignedBus, date },
      {
        bus: req.user.assignedBus,
        date,
        trips,
        isLive: true,
        submittedBy: req.user._id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    await Bus.findByIdAndUpdate(req.user.assignedBus, {
      currentStatus: 'Scheduled',
      lastUpdated: Date.now(),
    });

    res.status(200).json({
      success: true,
      message: 'Timetable updated successfully',
      data: timetable,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update trip status
// @route   PUT /api/timetable/:id/trip/:tripNumber
// @access  Private
export const updateTripStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      'Scheduled',
      'In Progress',
      'Completed',
      'Cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip status',
      });
    }

    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found',
      });
    }

    const trip = timetable.trips.find(
      (t) => t.tripNumber === Number(req.params.tripNumber)
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    trip.status = status;
    await timetable.save();

    const hasInProgress = timetable.trips.some(
      (t) => t.status === 'In Progress'
    );

    await Bus.findByIdAndUpdate(timetable.bus, {
      currentStatus: hasInProgress ? 'Running' : 'Scheduled',
    });

    res.status(200).json({
      success: true,
      message: 'Trip status updated',
      data: timetable,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all timetables (admin)
// @route   GET /api/timetable/all
// @access  Private
export const getAllTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find()
      .populate('bus', 'busNumber busType')
      .populate('submittedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: timetables.length,
      data: timetables,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getMyBusTimetable = async (req, res) => {
  try {
    if (!req.user.assignedBus) {
      return res.status(400).json({
        success: false,
        message: 'No bus assigned to this conductor',
      });
    }

    const today = new Date().toLocaleDateString('en-GB');

    // 1️⃣ Try today first
    let timetable = await Timetable.findOne({
      bus: req.user.assignedBus,
      date: today,
    }).populate('bus', 'busNumber busType currentDelay currentStatus');

    // 2️⃣ If no today timetable → get latest
    if (!timetable) {
      timetable = await Timetable.findOne({
        bus: req.user.assignedBus,
      })
        .sort({ createdAt: -1 })
        .populate('bus', 'busNumber busType currentDelay currentStatus');
    }

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'No timetable found',
      });
    }

    res.status(200).json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};