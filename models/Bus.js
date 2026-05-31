import mongoose from 'mongoose';

const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: [true, 'Bus number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },

    busType: {
      type: String,
      enum: ['CTB', 'Private'],
      required: [true, 'Bus type is required'],
    },

    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: [true, 'Route is required'],
    },

    conductor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    currentStatus: {
      type: String,
      enum: ['Running', 'Delayed', 'Completed', 'Scheduled', 'Inactive'],
      default: 'Scheduled',
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite in dev (important for nodemon)
const Bus =
  mongoose.models.Bus || mongoose.model('Bus', busSchema);

export default Bus;
