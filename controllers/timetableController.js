import Timetable from '../models/Timetable.js';
import Bus from '../models/Bus.js';

const parseTimeToMinutes = (time) => {
  if (!time) return null;

  const value = String(time).trim().toLowerCase();
  const match = value.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);

  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const period = match[3];

  if (minutes > 59 || hours > 23 || (period && (hours < 1 || hours > 12))) {
    return null;
  }

  if (period === 'pm' && hours !== 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const textMatches = (value, search) =>
  String(value || '').toLowerCase().includes(search);

export const getTodayDate = () => new Date().toLocaleDateString('en-GB');

export const getLiveTimetableForBus = async (busId) => {
  const today = getTodayDate();

  let timetable = await Timetable.findOne({ bus: busId, date: today });

  if (!timetable) {
    timetable = await Timetable.findOne({ bus: busId }).sort({ updatedAt: -1 });
  }

  return timetable;
};

const getConductorBus = async (user) => {
  if (user.assignedBus) {
    const assignedBus = await Bus.findOne({
      _id: user.assignedBus,
      isActive: true,
    }).populate('route', 'name origin destination stops');

    if (assignedBus) return assignedBus;
  }

  return Bus.findOne({
    conductor: user._id,
    isActive: true,
  }).populate('route', 'name origin destination stops');
};

// @desc    Get timetable by date
// @route   GET /api/timetable?date=20/04/2026&time=08:30
// @access  Public
export const getTimetable = async (req, res) => {
  try {
    const { date, time, busType, bus, origin, destination, stop } = req.query;
    const requestedTime = parseTimeToMinutes(time);

    if (time && requestedTime === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:mm, H:mm, 08:30, or 8:30 AM',
      });
    }

    const filter = {};
    if (date) filter.date = date;
    if (bus) filter.bus = bus;

    let timetables = await Timetable.find(filter)
      .populate({
        path: 'bus',
        match:
          busType && busType !== 'All'
            ? { busType, isActive: true }
            : { isActive: true },
        select: 'busNumber busType',
        populate: { path: 'route', select: 'name origin destination stops' },
      })
      .populate('submittedBy', 'fullName');

    const originSearch = origin ? origin.trim().toLowerCase() : null;
    const destinationSearch = destination ? destination.trim().toLowerCase() : null;
    const stopSearch = stop ? stop.trim().toLowerCase() : null;

    timetables = timetables
      .filter((t) => t.bus !== null)
      .filter((t) => {
        const route = t.bus.route;
        if (!route) return false;

        if (originSearch && !textMatches(route.origin, originSearch)) return false;
        if (
          destinationSearch &&
          !textMatches(route.destination, destinationSearch)
        ) {
          return false;
        }
        if (
          stopSearch &&
          !route.stops?.some((routeStop) => textMatches(routeStop.name, stopSearch))
        ) {
          return false;
        }

        return true;
      })
      .map((timetable) => {
        if (requestedTime === null) return timetable;

        const matchingTrips = timetable.trips.filter((trip) => {
          const departureTime = parseTimeToMinutes(trip.departureTime);
          return departureTime !== null && departureTime >= requestedTime;
        });

        if (matchingTrips.length === timetable.trips.length) return timetable;

        const timetableObject = timetable.toObject();
        timetableObject.trips = matchingTrips;
        return timetableObject;
      })
      .filter((timetable) => !time || timetable.trips.length > 0);

    res.status(200).json({
      success: true,
      count: timetables.length,
      data: timetables,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get conductor bus timetable
// @route   GET /api/timetable/my-bus
// @access  Private
export const getMyBusTimetable = async (req, res) => {
  try {
    const { date } = req.query;
    const timetableDate = date || new Date().toLocaleDateString('en-GB');
    const bus = await getConductorBus(req.user);

    if (!bus) {
      return res.status(400).json({
        success: false,
        message: 'No bus assigned to this conductor',
      });
    }

    const timetable = await Timetable.findOne({
      bus: bus._id,
      date: timetableDate,
    })
      .populate({
        path: 'bus',
        select: 'busNumber busType route',
        populate: { path: 'route', select: 'name origin destination stops' },
      })
      .populate('submittedBy', 'firstName lastName email');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'No timetable found for this date',
        data: {
          bus,
          date: timetableDate,
          timetable: null,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        bus,
        date: timetableDate,
        timetable,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const saveTimetableForBus = async ({ busId, date, trips, userId }) => {
  if (!date || !Array.isArray(trips) || trips.length === 0) {
    const error = new Error('Date and trips are required');
    error.statusCode = 400;
    throw error;
  }

  const bus = await Bus.findOne({ _id: busId, isActive: true });

  if (!bus) {
    const error = new Error('Bus not found');
    error.statusCode = 404;
    throw error;
  }

  const timetable = await Timetable.findOneAndUpdate(
    { bus: bus._id, date },
    {
      bus: bus._id,
      date,
      trips,
      isLive: true,
      submittedBy: userId,
      lastUpdated: Date.now(),
    },
    { upsert: true, new: true, runValidators: true }
  )
    .populate({
      path: 'bus',
      select: 'busNumber busType route',
      populate: { path: 'route', select: 'name origin destination stops' },
    })
    .populate('submittedBy', 'firstName lastName email');

  return timetable;
};

// @desc    Create or update timetable
// @route   POST /api/timetable
// @access  Private
export const upsertTimetable = async (req, res) => {
  try {
    const { date, trips } = req.body;
    const bus = await getConductorBus(req.user);

    if (!bus) {
      return res.status(400).json({
        success: false,
        message: 'No bus assigned to this conductor',
      });
    }

    const timetable = await saveTimetableForBus({
      busId: bus._id,
      date,
      trips,
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Timetable updated successfully',
      data: timetable,
    });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

// @desc    Create or update timetable for selected bus
// @route   POST /api/timetable/bus/:busId
// @access  Private
export const upsertBusTimetable = async (req, res) => {
  try {
    const { date, trips } = req.body;

    if (req.user.role === 'conductor') {
      const bus = await getConductorBus(req.user);

      if (!bus || bus._id.toString() !== req.params.busId) {
        return res.status(403).json({
          success: false,
          message: 'You can only manage your assigned bus timetable',
        });
      }
    }

    const timetable = await saveTimetableForBus({
      busId: req.params.busId,
      date,
      trips,
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Timetable updated successfully',
      data: timetable,
    });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
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

    if (req.user.role === 'conductor') {
      const bus = await getConductorBus(req.user);
      if (!bus || timetable.bus.toString() !== bus._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your assigned bus timetable',
        });
      }
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

    timetable.currentStatus = hasInProgress ? 'Running' : 'Scheduled';
    timetable.lastUpdated = Date.now();
    await timetable.save();

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
