/* ═══════════════════════════════════════════
   Application Constants
   ═══════════════════════════════════════════ */

module.exports = {
  // User roles
  ROLES: {
    USER: 'user',
    MENTOR: 'mentor',
    ADMIN: 'admin'
  },

  // Session statuses
  SESSION_STATUS: {
    OPEN: 'open',
    FULL: 'full',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Request statuses
  REQUEST_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected'
  },

  // Transaction types
  TRANSACTION_TYPE: {
    EARN: 'earn',
    SPEND: 'spend',
    BONUS: 'bonus',
    REFUND: 'refund'
  },

  // Notification types
  NOTIFICATION_TYPE: {
    SESSION: 'session',
    CREDIT: 'credit',
    REVIEW: 'review',
    COMMUNITY: 'community',
    SYSTEM: 'system',
    BOOKING_REQUESTED: 'booking_requested',
    BOOKING_ACCEPTED: 'booking_accepted',
    BOOKING_COMPLETED: 'booking_completed',
    CREDITS_RELEASED: 'credits_released',
    MENTOR_APPLICATION_UPDATE: 'mentor_application_update',
    REVIEW_RECEIVED: 'review_received',
    REFERRAL_REWARD: 'referral_reward',
    ASSIGNMENT_UPDATE: 'assignment_update'
  },

  // Skill categories
  SKILL_CATEGORIES: [
    'Programming',
    'Design',
    'Marketing',
    'Data Science',
    'Languages',
    'Music',
    'Writing',
    'Business',
    'Photography',
    'Cooking',
    'Fitness',
    'Finance',
    'Public Speaking',
    'Leadership',
    'Other'
  ],

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50
  }
};
