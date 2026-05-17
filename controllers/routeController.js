import Bus from '../models/Bus.js';
import Route from '../models/Route.js';
import User from '../models/User.js';


// @desc    Get all routes
// @route   GET /api/routes
// @access  Public
export const getRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ isActive: true });

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single route
// @route   GET /api/routes/:id
// @access  Public
export const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }

    res.status(200).json({
      success: true,
      data: route,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create route
// @route   POST /api/routes
// @access  Admin
export const createRoute = async (req, res) => {
  try {
    const route = await Route.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Route created',
      data: route,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Admin
export const updateRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Route updated',
      data: route,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete (deactivate) route
// @route   DELETE /api/routes/:id
// @access  Admin
export const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Route deactivated',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }

};

// @desc    Get route for logged-in conductor
// @route   GET /api/routes/my
// @access  Private (Conductor)
export const getMyRoute = async (req, res) => {
  try {
    // 1. Find logged-in user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2. Find assigned bus and populate route
    const bus = await Bus.findById(user.assignedBus).populate("route");

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not assigned",
      });
    }

    // 3. Return route
    res.json({
      success: true,
      data: bus.route,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};