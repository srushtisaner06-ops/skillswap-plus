/*
   Database Seed Script
   Run: npm run seed
*/

require('dotenv').config();

const mongoose = require('mongoose');
const env = require('./config/env');
const User = require('./models/User');
const Session = require('./models/Session');
const Booking = require('./models/Booking');
const Transaction = require('./models/Transaction');
const Review = require('./models/Review');
const Notification = require('./models/Notification');
const Activity = require('./models/Activity');
const { SESSION_STATUS, REQUEST_STATUS, TRANSACTION_TYPE, NOTIFICATION_TYPE } = require('./utils/constants');
const { BOOKING_STATUS } = require('./models/Booking');

const DEMO_PASSWORD = 'password123';

function daysFromNow(days, hour = 14, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function scheduledFields(days, startTime, durationMinutes) {
  const [hour, minute] = startTime.split(':').map(Number);
  const scheduledAt = daysFromNow(days, hour, minute);
  const end = new Date(scheduledAt.getTime() + durationMinutes * 60000);

  return {
    date: scheduledAt,
    scheduledAt,
    startTime,
    endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
    duration: durationMinutes
  };
}

function avatar(name, background = '6927ef') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=fff`;
}

async function createNotification({ user, type, message, icon, color, link = '#/dashboard', daysAgo = 0, read = false, metadata = {} }) {
  const createdAt = daysFromNow(-daysAgo, 10, 0);
  return Notification.create({
    user,
    type,
    message,
    icon,
    color,
    link,
    read,
    metadata,
    createdAt,
    updatedAt: createdAt
  });
}

async function createActivity({ user, type, title, message, icon, color, link = '#/dashboard', daysAgo = 0, metadata = {} }) {
  const createdAt = daysFromNow(-daysAgo, 11, 0);
  return Activity.create({
    user,
    type,
    title,
    message,
    icon,
    color,
    link,
    metadata,
    createdAt,
    updatedAt: createdAt
  });
}

const seedDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    await Promise.all([
      User.deleteMany({}),
      Session.deleteMany({}),
      Booking.deleteMany({}),
      Transaction.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
      Activity.deleteMany({})
    ]);
    console.log('Cleared existing demo data');

    const users = await User.create([
      {
        name: 'Lena Brooks',
        email: 'learner@skillswap.dev',
        password: DEMO_PASSWORD,
        bio: 'Frontend learner preparing for junior developer interviews. Focused on React, APIs, and product thinking.',
        skillsOffered: [
          { name: 'Technical Writing', level: 74 },
          { name: 'Notion Workflows', level: 68 },
          { name: 'Resume Review', level: 70 }
        ],
        skillsWanted: ['React', 'Node.js', 'MongoDB', 'Interview Preparation', 'UI/UX Design'],
        credits: 82,
        role: 'user',
        tier: 'Growth',
        level: 4,
        xp: 620,
        xpMax: 1000,
        streak: 5,
        profilePicture: avatar('Lena Brooks', '0f766e'),
        badges: [
          { name: 'Curious Learner', icon: 'school', color: 'sky' },
          { name: 'First Review', icon: 'rate_review', color: 'amber' }
        ],
        stats: {
          sessionsTaught: 0,
          sessionsAttended: 1,
          creditsEarned: 0,
          communityPosts: 2
        }
      },
      {
        name: 'Maya Iyer',
        email: 'mentor@skillswap.dev',
        password: DEMO_PASSWORD,
        bio: 'Senior full-stack engineer and product mentor. I help early-career developers build practical, review-ready projects.',
        skillsOffered: [
          { name: 'React', level: 94 },
          { name: 'Node.js', level: 91 },
          { name: 'MongoDB', level: 86 },
          { name: 'Interview Preparation', level: 88 },
          { name: 'UI/UX Design', level: 78 }
        ],
        skillsWanted: ['Product Strategy', 'Public Speaking', 'Design Systems'],
        credits: 246,
        rating: 4.9,
        ratingCount: 2,
        role: 'mentor',
        tier: 'Mentor Pro',
        level: 8,
        xp: 840,
        xpMax: 1200,
        streak: 12,
        profilePicture: avatar('Maya Iyer', '5000c8'),
        badges: [
          { name: 'Verified Mentor', icon: 'verified', color: 'emerald' },
          { name: 'Top Rated', icon: 'star', color: 'amber' },
          { name: 'API Expert', icon: 'hub', color: 'violet' }
        ],
        stats: {
          sessionsTaught: 2,
          sessionsAttended: 0,
          creditsEarned: 32,
          communityPosts: 5
        }
      },
      {
        name: 'Admin Patel',
        email: 'admin@skillswap.dev',
        password: DEMO_PASSWORD,
        bio: 'SkillSwap+ platform administrator for mentor quality, trust, and marketplace operations.',
        skillsOffered: [
          { name: 'Community Operations', level: 92 },
          { name: 'Mentor Review', level: 89 }
        ],
        skillsWanted: ['Analytics', 'Automation'],
        credits: 500,
        role: 'admin',
        tier: 'Admin',
        level: 10,
        xp: 1000,
        xpMax: 1000,
        streak: 20,
        profilePicture: avatar('Admin Patel', '1f2937'),
        badges: [
          { name: 'Platform Admin', icon: 'admin_panel_settings', color: 'violet' },
          { name: 'Mentor Approval', icon: 'how_to_reg', color: 'emerald' }
        ],
        stats: {
          sessionsTaught: 0,
          sessionsAttended: 0,
          creditsEarned: 0,
          communityPosts: 0
        }
      },
      {
        name: 'Noah Kim',
        email: 'noah.reviewer@skillswap.dev',
        password: DEMO_PASSWORD,
        bio: 'Backend developer using SkillSwap+ to sharpen product design and communication skills.',
        skillsOffered: [
          { name: 'SQL', level: 82 },
          { name: 'Debugging', level: 79 }
        ],
        skillsWanted: ['UI/UX Design', 'React', 'Interview Preparation'],
        credits: 64,
        role: 'user',
        tier: 'Growth',
        level: 3,
        xp: 410,
        xpMax: 1000,
        profilePicture: avatar('Noah Kim', '0369a1'),
        stats: {
          sessionsTaught: 0,
          sessionsAttended: 2,
          creditsEarned: 0,
          communityPosts: 1
        }
      }
    ]);

    const [learner, mentor, admin, reviewer] = users;
    console.log(`Created ${users.length} users`);

    const sessions = await Session.create([
      {
        title: 'React Fundamentals',
        description: 'Build a practical React mental model with components, props, state, effects, and clean project structure. The session ends with a small interactive profile card that learners can extend after the call.',
        skillCategory: 'Programming',
        host: mentor._id,
        ...scheduledFields(-9, '15:00', 90),
        creditsRequired: 14,
        maxParticipants: 4,
        participants: [learner._id],
        requests: [{ user: learner._id, status: REQUEST_STATUS.ACCEPTED, requestedAt: daysFromNow(-12, 9, 15) }],
        status: SESSION_STATUS.COMPLETED,
        meetingUrl: 'https://meet.jit.si/skillswap-react-fundamentals-demo',
        tags: ['React', 'JavaScript', 'Components', 'Frontend'],
        createdAt: daysFromNow(-18, 8, 30),
        updatedAt: daysFromNow(-9, 16, 45)
      },
      {
        title: 'UI/UX Design Basics',
        description: 'A hands-on introduction to user flows, wireframes, contrast, spacing, and practical critique. Learners leave with a simple Figma checklist for improving their next app screen.',
        skillCategory: 'Design',
        host: mentor._id,
        ...scheduledFields(-5, '13:00', 60),
        creditsRequired: 10,
        maxParticipants: 3,
        participants: [reviewer._id],
        requests: [{ user: reviewer._id, status: REQUEST_STATUS.ACCEPTED, requestedAt: daysFromNow(-8, 12, 0) }],
        status: SESSION_STATUS.COMPLETED,
        meetingUrl: 'https://meet.jit.si/skillswap-uiux-basics-demo',
        tags: ['UI/UX', 'Figma', 'Wireframes', 'Product Design'],
        createdAt: daysFromNow(-14, 9, 0),
        updatedAt: daysFromNow(-5, 14, 10)
      },
      {
        title: 'Node.js API Masterclass',
        description: 'Design and implement a production-minded Express API with validation, error handling, auth middleware, and clear controller/service boundaries. Ideal for learners preparing portfolio projects.',
        skillCategory: 'Programming',
        host: mentor._id,
        ...scheduledFields(3, '17:00', 90),
        creditsRequired: 18,
        maxParticipants: 4,
        participants: [reviewer._id],
        requests: [
          { user: learner._id, status: REQUEST_STATUS.PENDING, requestedAt: daysFromNow(-1, 18, 15) },
          { user: reviewer._id, status: REQUEST_STATUS.ACCEPTED, requestedAt: daysFromNow(-2, 11, 20) }
        ],
        status: SESSION_STATUS.OPEN,
        meetingUrl: 'https://meet.jit.si/skillswap-node-api-masterclass-demo',
        tags: ['Node.js', 'Express', 'REST API', 'Authentication'],
        createdAt: daysFromNow(-10, 10, 30),
        updatedAt: daysFromNow(-1, 18, 15)
      },
      {
        title: 'Interview Preparation',
        description: 'Mock interview practice for junior developers, including project storytelling, behavioral answers, debugging prompts, and a repeatable structure for explaining tradeoffs clearly.',
        skillCategory: 'Business',
        host: mentor._id,
        ...scheduledFields(6, '11:00', 75),
        creditsRequired: 12,
        maxParticipants: 2,
        participants: [],
        requests: [],
        status: SESSION_STATUS.OPEN,
        tags: ['Interview Preparation', 'Career', 'Communication', 'Portfolio'],
        createdAt: daysFromNow(-7, 8, 45),
        updatedAt: daysFromNow(-7, 8, 45)
      },
      {
        title: 'MongoDB for Beginners',
        description: 'Learn collections, schemas, indexes, query patterns, and how MongoDB fits inside a Node.js application. Includes a practical walkthrough of modeling users, sessions, and bookings.',
        skillCategory: 'Data Science',
        host: mentor._id,
        ...scheduledFields(10, '16:00', 75),
        creditsRequired: 11,
        maxParticipants: 5,
        participants: [],
        requests: [],
        status: SESSION_STATUS.OPEN,
        tags: ['MongoDB', 'Mongoose', 'Database Design', 'Indexes'],
        createdAt: daysFromNow(-6, 10, 0),
        updatedAt: daysFromNow(-6, 10, 0)
      },
      {
        title: 'Product Strategy for Engineers',
        description: 'Translate technical decisions into product outcomes. We will cover opportunity framing, user pain, success metrics, and how to communicate engineering tradeoffs to stakeholders.',
        skillCategory: 'Business',
        host: admin._id,
        ...scheduledFields(8, '12:00', 60),
        creditsRequired: 9,
        maxParticipants: 4,
        participants: [],
        requests: [],
        status: SESSION_STATUS.OPEN,
        tags: ['Product Strategy', 'Roadmaps', 'Metrics', 'Stakeholders'],
        createdAt: daysFromNow(-4, 15, 0),
        updatedAt: daysFromNow(-4, 15, 0)
      }
    ]);

    const [reactSession, uiuxSession, nodeSession] = sessions;
    console.log(`Created ${sessions.length} sessions`);

    const bookings = await Booking.create([
      {
        learner: learner._id,
        mentor: mentor._id,
        session: reactSession._id,
        status: BOOKING_STATUS.COMPLETED,
        creditsReserved: reactSession.creditsRequired,
        meetingUrl: reactSession.meetingUrl,
        scheduledAt: reactSession.scheduledAt,
        acceptedAt: daysFromNow(-11, 10, 0),
        completedAt: daysFromNow(-9, 16, 35),
        createdAt: daysFromNow(-12, 9, 15),
        updatedAt: daysFromNow(-9, 16, 35)
      },
      {
        learner: learner._id,
        mentor: mentor._id,
        session: nodeSession._id,
        status: BOOKING_STATUS.PENDING,
        creditsReserved: nodeSession.creditsRequired,
        scheduledAt: nodeSession.scheduledAt,
        createdAt: daysFromNow(-1, 18, 15),
        updatedAt: daysFromNow(-1, 18, 15)
      },
      {
        learner: reviewer._id,
        mentor: mentor._id,
        session: nodeSession._id,
        status: BOOKING_STATUS.ACCEPTED,
        creditsReserved: nodeSession.creditsRequired,
        meetingUrl: nodeSession.meetingUrl,
        scheduledAt: nodeSession.scheduledAt,
        acceptedAt: daysFromNow(-1, 10, 45),
        createdAt: daysFromNow(-2, 11, 20),
        updatedAt: daysFromNow(-1, 10, 45)
      },
      {
        learner: reviewer._id,
        mentor: mentor._id,
        session: uiuxSession._id,
        status: BOOKING_STATUS.COMPLETED,
        creditsReserved: uiuxSession.creditsRequired,
        meetingUrl: uiuxSession.meetingUrl,
        scheduledAt: uiuxSession.scheduledAt,
        acceptedAt: daysFromNow(-7, 9, 30),
        completedAt: daysFromNow(-5, 14, 5),
        createdAt: daysFromNow(-8, 12, 0),
        updatedAt: daysFromNow(-5, 14, 5)
      }
    ]);

    const [learnerCompletedBooking, learnerPendingBooking, reviewerAcceptedBooking, reviewerCompletedBooking] = bookings;
    console.log(`Created ${bookings.length} bookings`);

    await Transaction.create([
      {
        user: learner._id,
        type: TRANSACTION_TYPE.BONUS,
        amount: 100,
        balance: 100,
        description: 'Demo account starting credits',
        createdAt: daysFromNow(-20, 8, 0),
        updatedAt: daysFromNow(-20, 8, 0)
      },
      {
        user: learner._id,
        type: TRANSACTION_TYPE.SPEND,
        amount: -reactSession.creditsRequired,
        balance: 86,
        description: 'Reserved credits for React Fundamentals',
        relatedSession: reactSession._id,
        relatedBooking: learnerCompletedBooking._id,
        relatedUser: mentor._id,
        createdAt: daysFromNow(-12, 9, 15),
        updatedAt: daysFromNow(-12, 9, 15)
      },
      {
        user: learner._id,
        type: TRANSACTION_TYPE.SPEND,
        amount: -nodeSession.creditsRequired,
        balance: 68,
        description: 'Reserved credits for Node.js API Masterclass',
        relatedSession: nodeSession._id,
        relatedBooking: learnerPendingBooking._id,
        relatedUser: mentor._id,
        createdAt: daysFromNow(-1, 18, 15),
        updatedAt: daysFromNow(-1, 18, 15)
      },
      {
        user: learner._id,
        type: TRANSACTION_TYPE.BONUS,
        amount: 14,
        balance: 82,
        description: 'Project review bonus after React Fundamentals',
        relatedSession: reactSession._id,
        relatedUser: mentor._id,
        createdAt: daysFromNow(-8, 9, 0),
        updatedAt: daysFromNow(-8, 9, 0)
      },
      {
        user: mentor._id,
        type: TRANSACTION_TYPE.EARN,
        amount: reactSession.creditsRequired,
        balance: 228,
        description: 'Earned credits from React Fundamentals',
        relatedSession: reactSession._id,
        relatedBooking: learnerCompletedBooking._id,
        relatedUser: learner._id,
        createdAt: daysFromNow(-9, 16, 35),
        updatedAt: daysFromNow(-9, 16, 35)
      },
      {
        user: mentor._id,
        type: TRANSACTION_TYPE.EARN,
        amount: uiuxSession.creditsRequired,
        balance: 238,
        description: 'Earned credits from UI/UX Design Basics',
        relatedSession: uiuxSession._id,
        relatedBooking: reviewerCompletedBooking._id,
        relatedUser: reviewer._id,
        createdAt: daysFromNow(-5, 14, 5),
        updatedAt: daysFromNow(-5, 14, 5)
      },
      {
        user: mentor._id,
        type: TRANSACTION_TYPE.BONUS,
        amount: 8,
        balance: 246,
        description: 'Mentor quality bonus for consistent 5-star reviews',
        relatedUser: admin._id,
        createdAt: daysFromNow(-3, 10, 0),
        updatedAt: daysFromNow(-3, 10, 0)
      },
      {
        user: reviewer._id,
        type: TRANSACTION_TYPE.SPEND,
        amount: -nodeSession.creditsRequired,
        balance: 64,
        description: 'Reserved credits for Node.js API Masterclass',
        relatedSession: nodeSession._id,
        relatedBooking: reviewerAcceptedBooking._id,
        relatedUser: mentor._id,
        createdAt: daysFromNow(-2, 11, 20),
        updatedAt: daysFromNow(-2, 11, 20)
      }
    ]);
    console.log('Created credit ledger history');

    await Review.create([
      {
        reviewer: learner._id,
        reviewee: mentor._id,
        session: reactSession._id,
        rating: 5,
        feedback: 'Maya made React finally click. The examples were realistic, the pacing was calm, and I left with a small component I could reuse in my portfolio.',
        createdAt: daysFromNow(-8, 18, 30),
        updatedAt: daysFromNow(-8, 18, 30)
      },
      {
        reviewer: reviewer._id,
        reviewee: mentor._id,
        session: uiuxSession._id,
        rating: 5,
        feedback: 'The design critique checklist was immediately useful. Maya connected spacing, hierarchy, and user intent in a way that felt practical for engineers.',
        createdAt: daysFromNow(-4, 16, 0),
        updatedAt: daysFromNow(-4, 16, 0)
      }
    ]);
    console.log('Created reviews');

    await Promise.all([
      createNotification({
        user: learner._id,
        type: NOTIFICATION_TYPE.BOOKING_COMPLETED,
        message: 'React Fundamentals was completed. Your review has been submitted.',
        icon: 'rate_review',
        color: 'violet',
        link: '#/session',
        daysAgo: 8,
        read: true,
        metadata: { sessionId: reactSession._id, bookingId: learnerCompletedBooking._id }
      }),
      createNotification({
        user: learner._id,
        type: NOTIFICATION_TYPE.BOOKING_REQUESTED,
        message: 'Your request for Node.js API Masterclass is waiting for mentor approval.',
        icon: 'hourglass_top',
        color: 'amber',
        link: '#/dashboard',
        daysAgo: 1,
        metadata: { sessionId: nodeSession._id, bookingId: learnerPendingBooking._id }
      }),
      createNotification({
        user: learner._id,
        type: NOTIFICATION_TYPE.CREDIT,
        message: '18 credits are reserved in escrow for Node.js API Masterclass.',
        icon: 'account_balance_wallet',
        color: 'sky',
        link: '#/settings',
        daysAgo: 1,
        metadata: { bookingId: learnerPendingBooking._id }
      }),
      createNotification({
        user: mentor._id,
        type: NOTIFICATION_TYPE.SESSION,
        message: 'New booking request from Lena Brooks for Node.js API Masterclass.',
        icon: 'event',
        color: 'sky',
        link: '#/dashboard',
        daysAgo: 1,
        metadata: { bookingId: learnerPendingBooking._id }
      }),
      createNotification({
        user: mentor._id,
        type: NOTIFICATION_TYPE.CREDITS_RELEASED,
        message: '14 escrow credits were released for React Fundamentals.',
        icon: 'generating_tokens',
        color: 'emerald',
        link: '#/settings',
        daysAgo: 9,
        read: true,
        metadata: { bookingId: learnerCompletedBooking._id }
      }),
      createNotification({
        user: mentor._id,
        type: NOTIFICATION_TYPE.REVIEW_RECEIVED,
        message: 'Lena Brooks gave you a 5-star review for React Fundamentals.',
        icon: 'star',
        color: 'amber',
        link: '#/profile',
        daysAgo: 8,
        metadata: { sessionId: reactSession._id }
      }),
      createNotification({
        user: mentor._id,
        type: NOTIFICATION_TYPE.BOOKING_ACCEPTED,
        message: 'Noah Kim is accepted for Node.js API Masterclass. Meeting link is ready.',
        icon: 'event_available',
        color: 'emerald',
        link: '#/session',
        daysAgo: 1,
        metadata: { bookingId: reviewerAcceptedBooking._id }
      }),
      createNotification({
        user: admin._id,
        type: NOTIFICATION_TYPE.MENTOR_APPLICATION_UPDATE,
        message: 'Mentor approval queue: Lena Brooks has a draft mentor application ready for review.',
        icon: 'how_to_reg',
        color: 'violet',
        link: '#/mentor-apply',
        daysAgo: 2,
        metadata: { applicantEmail: 'learner@skillswap.dev', status: 'pending_review' }
      }),
      createNotification({
        user: admin._id,
        type: NOTIFICATION_TYPE.SYSTEM,
        message: 'Admin role permissions enabled for platform review demo.',
        icon: 'admin_panel_settings',
        color: 'emerald',
        link: '#/settings',
        daysAgo: 1,
        metadata: { role: 'admin' }
      })
    ]);
    console.log('Created realistic notifications');

    await Promise.all([
      createActivity({
        user: learner._id,
        type: 'session',
        title: 'Booking requested',
        message: 'Node.js API Masterclass is pending mentor approval.',
        icon: 'event',
        color: 'amber',
        link: '#/dashboard',
        daysAgo: 1,
        metadata: { bookingId: learnerPendingBooking._id }
      }),
      createActivity({
        user: learner._id,
        type: 'review',
        title: 'Review submitted',
        message: 'You reviewed React Fundamentals with 5 stars.',
        icon: 'star',
        color: 'amber',
        link: '#/profile',
        daysAgo: 8,
        metadata: { sessionId: reactSession._id }
      }),
      createActivity({
        user: mentor._id,
        type: 'credit',
        title: 'Credits earned',
        message: 'Escrow released 14 credits for React Fundamentals.',
        icon: 'generating_tokens',
        color: 'emerald',
        link: '#/settings',
        daysAgo: 9,
        metadata: { bookingId: learnerCompletedBooking._id }
      }),
      createActivity({
        user: mentor._id,
        type: 'session',
        title: 'Incoming request',
        message: 'Lena Brooks requested Node.js API Masterclass.',
        icon: 'event',
        color: 'sky',
        link: '#/dashboard',
        daysAgo: 1,
        metadata: { bookingId: learnerPendingBooking._id }
      }),
      createActivity({
        user: admin._id,
        type: 'system',
        title: 'Mentor approval visibility',
        message: 'Admin can review mentor queue and platform permissions.',
        icon: 'admin_panel_settings',
        color: 'violet',
        link: '#/settings',
        daysAgo: 1
      })
    ]);
    console.log('Created dashboard activity');

    console.log('\nDatabase seeded successfully');
    console.log('\nDemo credentials:');
    console.log('  Learner: learner@skillswap.dev / password123');
    console.log('  Mentor:  mentor@skillswap.dev / password123');
    console.log('  Admin:   admin@skillswap.dev / password123');
    console.log('\nSeeded feature coverage:');
    console.log('  Learner: completed booking, pending booking, notifications, submitted review, credit history');
    console.log('  Mentor: multiple sessions, accepted booking, completed bookings, mentor badge, reviews received, credits earned');
    console.log('  Admin: admin role, platform badges, mentor approval visibility notifications');
    console.log('  Marketplace: React, UI/UX, Node.js, Interview Preparation, MongoDB sessions with tags and credits');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();
