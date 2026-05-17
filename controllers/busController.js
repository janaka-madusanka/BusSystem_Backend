import Bus from '../models/Bus.js';
import Timetable from '../models/Timetable.js';

// @desc    Get all buses
// @route   GET /api/buses
// @access  Public
export const getBuses = async (req, res) => {
  try {
    const filter = { isActive: true };

    if (req.query.busType && req.query.busType !== 'All') {
      filter.busType = req.query.busType;
    }

    const buses = await Bus.find(filter)
      .populate('route', 'name origin destination stops')
      .populate('conductor', 'firstName lastName email');

    res.status(200).json({
      success: true,
      count: buses.length,
      data: buses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bus by ID
// @route   GET /api/buses/:id
// @access  Public
export const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate(
        'route',
        'name origin destination stops distanceKm avgJourneyMinutes fareRanges'
      )
      .populate('conductor', 'firstName lastName email');

    if (!bus) {
      return res
        .status(404)
        .json({ success: false, message: 'Bus not found' });
    }

    res.status(200).json({ success: true, data: bus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Live delay status
// @route   GET /api/buses/live-delay
// @access  Public
export const getLiveDelayStatus = async (req, res) => {
  try {
    const buses = await Bus.find({
      isActive: true,
      currentStatus: { $in: ['Running', 'Delayed'] },
    })
      .populate('route', 'origin destination')
      .select(
        'busNumber busType currentStatus currentDelay crowdLevel route lastUpdated'
      );

    res.status(200).json({
      success: true,
      count: buses.length,
      data: buses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update crowd level
// @route   PUT /api/buses/:id/crowd
// @access  Private
export const updateCrowdLevel = async (req, res) => {
  const { level } = req.body;

  const validLevels = ['Low', 'Medium', 'High', 'Fully Crowded'];

  if (!validLevels.includes(level)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid crowd level' });
  }

  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res
        .status(404)
        .json({ success: false, message: 'Bus not found' });
    }

    bus.crowdReports.push({
      reportedBy: req.user._id,
      level,
    });

    const recent = bus.crowdReports.slice(-20);

    const counts = {
      Low: 0,
      Medium: 0,
      High: 0,
      'Fully Crowded': 0,
    };

    recent.forEach((r) => {
      counts[r.level]++;
    });

    bus.crowdLevel = Object.keys(counts).reduce((a, b) =>
      counts[a] >= counts[b] ? a : b
    );

    bus.lastUpdated = Date.now();

    await bus.save();

    res.status(200).json({
      success: true,
      message: 'Crowd level updated',
      crowdLevel: bus.crowdLevel,
      totalReports: recent.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create bus
// @route   POST /api/buses
// @access  Admin
export const createBus = async (req, res) => {
  try {
    console.log('CREATE BUS HIT');
    console.log(req.body);

    const existingBus = await Bus.findOne({
      busNumber: req.body.busNumber,
    });

    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: 'Bus number already exists',
      });
    }

    const bus = await Bus.create(req.body);

    console.log('BUS CREATED');

    res.status(201).json({
      success: true,
      message: 'Bus created successfully',
      data: bus,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update bus
// @route   PUT /api/buses/:id
// @access  Admin
export const updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!bus) {
      return res
        .status(404)
        .json({ success: false, message: 'Bus not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Bus updated',
      data: bus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete (deactivate) bus
// @route   DELETE /api/buses/:id
// @access  Admin
export const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!bus) {
      return res
        .status(404)
        .json({ success: false, message: 'Bus not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Bus deactivated',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged-in conductor's bus
// @route   GET /api/buses/my-bus
// @access  Private (Conductor)
export const getMyBus = async (req, res) => {
  try {
    const bus = await Bus.findOne({
      conductor: req.user._id,
      isActive: true,
    })
      .populate('route', 'name origin destination')
      .populate('conductor', 'firstName lastName');

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'No bus assigned to this conductor',
      });
    }

    res.status(200).json({
      success: true,
      data: bus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};