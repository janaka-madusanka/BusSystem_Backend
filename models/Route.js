import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
    },

    origin: {
      type: String,
      required: [true, 'Origin is required'],
      trim: true,
    },

    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },

    stops: [
      {
        name: {
          type: String,
          required: true,
        },

        order: {
          type: Number,
          required: true,
        },
      },
    ],

    distanceKm: {
      type: Number,
      default: 0,
    },

    avgJourneyMinutes: {
      type: Number,
      default: 0,
    },

    fareRanges: {
      min: {
        type: Number,
        default: 0,
      },

      max: {
        type: Number,
        default: 0,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Route = mongoose.model('Route', routeSchema);

export default Route;