import mongoose from 'mongoose';

const delaySchema = new mongoose.Schema(
  {
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    reason: {
      type: String,
      enum: ['Traffic', 'Weather', 'Breakdown', 'Other'],
      required: true,
    },

    estimatedDelayMinutes: {
      type: Number,
      default: 0,
    },

    notes: {
      type: String,
      trim: true,
    },

    isResolved: {
      type: Boolean,
      default: false,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Delay = mongoose.model('Delay', delaySchema);

export default Delay;