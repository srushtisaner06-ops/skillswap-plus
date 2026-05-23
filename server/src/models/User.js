/* ═══════════════════════════════════════════
   User Model
   ═══════════════════════════════════════════ */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },

    password: {
      type: String,
      required: function() { return this.authProvider === 'local'; },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Never return password in queries by default
    },

    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined
    },

    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },

    skillsOffered: [
      {
        name: { type: String, required: true, trim: true },
        level: { type: Number, min: 0, max: 100, default: 50 }
      }
    ],

    skillsWanted: [
      {
        type: String,
        trim: true
      }
    ],

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    ratingCount: {
      type: Number,
      default: 0
    },

    credits: {
      type: Number,
      default: env.DEFAULT_CREDITS,
      min: 0
    },

    profilePicture: {
      type: String,
      default: ''
    },

    role: {
      type: String,
      enum: ['user', 'mentor', 'admin'],
      default: 'user'
    },

    level: {
      type: Number,
      default: 1,
      min: 1
    },

    xp: {
      type: Number,
      default: 0,
      min: 0
    },

    xpMax: {
      type: Number,
      default: 1000,
      min: 1
    },

    tier: {
      type: String,
      default: 'Starter',
      trim: true
    },

    streak: {
      type: Number,
      default: 0,
      min: 0
    },

    badges: [
      {
        name: { type: String, required: true, trim: true },
        icon: { type: String, default: 'stars', trim: true },
        color: { type: String, default: 'violet', trim: true }
      }
    ],

    stats: {
      sessionsTaught: { type: Number, default: 0, min: 0 },
      sessionsAttended: { type: Number, default: 0, min: 0 },
      creditsEarned: { type: Number, default: 0, min: 0 },
      communityPosts: { type: Number, default: 0, min: 0 }
    },

    refreshToken: {
      type: String,
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// ─── Indexes ───────────────────────────────

userSchema.index({ 'skillsOffered.name': 1 });
userSchema.index({ skillsWanted: 1 });
userSchema.index({ rating: -1 });
userSchema.index({ name: 1 });

// ─── Pre-save: Hash password ───────────────

userSchema.pre('save', async function () {
  // Only hash if password is modified
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Instance Methods ──────────────────────

/**
 * Compare a candidate password against the stored hash.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
