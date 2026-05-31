import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  tripNumber: {
    type: Number,
    required: true,
  },

  departureTime: {
    type: String,
    required: true,
  },

  arrivalTime: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled',
  },
});

const timetableSchema = new mongoose.Schema(
  {
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },

    date: {
      type: String, // "20/04/2026"
      required: [true, 'Date is required'],
    },

    trips: [tripSchema],

    currentStatus: {
      type: String,
      enum: ['Running', 'Delayed', 'Completed', 'Scheduled', 'Inactive'],
      default: 'Scheduled',
    },

    currentDelay: {
      type: Number,
      default: 0,
      min: 0,
    },

    crowdLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Fully Crowded'],
      default: 'Low',
    },

    crowdReports: [
      {
        reportedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        level: {
          type: String,
          enum: ['Low', 'Medium', 'High', 'Fully Crowded'],
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    isLive: {
      type: Boolean,
      default: false,
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// One timetable per bus per date
timetableSchema.index(
  { bus: 1, date: 1 },
  { unique: true }
);

const Timetable = mongoose.model(
  'Timetable',
  timetableSchema
);

export default Timetable;
