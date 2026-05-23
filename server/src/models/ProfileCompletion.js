const mongoose = require('mongoose');

const profileCompletionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Profile completion must belong to a user'],
      unique: true
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedFields: [{ type: String, trim: true }],
    missingFields: [{ type: String, trim: true }],
    sections: {
      profile: { type: Number, default: 0, min: 0, max: 100 },
      skills: { type: Number, default: 0, min: 0, max: 100 },
      learning: { type: Number, default: 0, min: 0, max: 100 },
      proof: { type: Number, default: 0, min: 0, max: 100 }
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProfileCompletion', profileCompletionSchema);
