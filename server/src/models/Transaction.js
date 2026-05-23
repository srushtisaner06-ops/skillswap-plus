/* ═══════════════════════════════════════════
   Transaction Model (Credit Ledger)
   ═══════════════════════════════════════════ */

const mongoose = require('mongoose');
const { TRANSACTION_TYPE } = require('../utils/constants');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must belong to a user']
    },

    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPE),
      required: [true, 'Transaction type is required']
    },

    amount: {
      type: Number,
      required: [true, 'Amount is required']
    },

    balance: {
      type: Number,
      required: [true, 'Balance after transaction is required']
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 200
    },

    relatedSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
    },

    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },

    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// ─── Indexes ───────────────────────────────

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ relatedSession: 1 });
transactionSchema.index({ relatedBooking: 1, type: 1, user: 1 }, {
  unique: true,
  partialFilterExpression: { relatedBooking: { $exists: true } }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
