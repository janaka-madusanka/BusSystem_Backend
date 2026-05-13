import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus is required'],
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Allow anonymous feedback
    },

    problemType: {
      type: String,
      enum: ['Complaint', 'Suggestion', 'Compliment', 'Other'],
      required: [true, 'Problem type is required'],
    },

    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },

    isReviewed: {
      type: Boolean,
      default: false,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;