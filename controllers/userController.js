import User from '../models/User.js';
import Bus from '../models/Bus.js';
import Feedback from '../models/Feedback.js';
import Delay from '../models/Delay.js';
import Timetable from '../models/Timetable.js';

// @desc    Get all users (admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('assignedBus', 'busNumber busType')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create conductor/admin user
export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, assignedBus } = req.body;

    if (!['conductor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Only conductor or admin roles can be created here',
      });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    const user = await User.create({
  firstName,
  lastName,
  email,
  password,
  role,
  assignedBus: assignedBus || null,
});

    // sync bus
    if (role === 'conductor' && assignedBus) {
      await Bus.findByIdAndUpdate(assignedBus, {
        conductor: user._id,
      });
    }

    res.status(201).json({
      success: true,
      message: `${role} account created`,
      data: {
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user
export const updateUser = async (req, res) => {
  try {
    const { assignedBus, isActive, firstName, lastName, role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { assignedBus, isActive, firstName, lastName, role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated',
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete (deactivate) user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin dashboard stats
export const getAdminStats = async (req, res) => {
  try {
    const [activeBuses, registeredPassengers, pendingFeedback, activeDelays] =
      await Promise.all([
        Bus.countDocuments({ isActive: true }),
        User.countDocuments({ role: 'passenger', isActive: true }),
        Feedback.countDocuments({ isReviewed: false }),
        Delay.countDocuments({ isResolved: false }),
      ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const delaysToday = await Delay.find({
      createdAt: { $gte: today },
      isResolved: false,
    });

    const avgDelay =
      delaysToday.length > 0
        ? Math.round(
            delaysToday.reduce(
              (sum, d) => sum + (d.estimatedDelayMinutes || 0),
              0
            ) / delaysToday.length
          )
        : 0;

    const recentFeedback = await Feedback.find()
      .populate('bus', 'busNumber')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('bus problemType comment createdAt');

    res.status(200).json({
      success: true,
      data: {
        activeBuses,
        registeredPassengers,
        pendingFeedback,
        activeDelays,
        avgDelayMinutes: avgDelay,
        recentFeedback,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Passenger dashboard
export const getPassengerDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'subscribedAlerts',
      'busNumber currentDelay currentStatus'
    );

    const recentDelayed = await Bus.find({
      currentStatus: 'Delayed',
      isActive: true,
    })
      .select('busNumber busType currentDelay crowdLevel')
      .limit(3);

    res.status(200).json({
      success: true,
      data: {
        name: `${user.firstName} ${user.lastName}`,
        subscribedAlerts: user.subscribedAlerts,
        recentDelayed,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle bus alerts
export const toggleBusAlert = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const busId = req.params.busId;

    const idx = user.subscribedAlerts.findIndex(
      (id) => id.toString() === busId
    );

    if (idx === -1) {
      user.subscribedAlerts.push(busId);
    } else {
      user.subscribedAlerts.splice(idx, 1);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: idx === -1 ? 'Alert subscribed' : 'Alert unsubscribed',
      subscribed: idx === -1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};