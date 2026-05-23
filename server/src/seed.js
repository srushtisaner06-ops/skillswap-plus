/* ═══════════════════════════════════════════
   Database Seed Script
   Run: npm run seed
   ═══════════════════════════════════════════ */

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('./config/env');
const User = require('./models/User');
const Session = require('./models/Session');
const Transaction = require('./models/Transaction');
const Review = require('./models/Review');
const Notification = require('./models/Notification');

const seedDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Session.deleteMany({}),
      Transaction.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Hash password once
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create users
    const users = await User.create([
      {
        name: 'Alex Rivera',
        email: 'alex@skillswap.plus',
        password: hashedPassword,
        bio: 'Full-stack developer with a passion for teaching React and UI design.',
        skillsOffered: [
          { name: 'React', level: 90 },
          { name: 'UI/UX Design', level: 85 },
          { name: 'TypeScript', level: 80 }
        ],
        skillsWanted: ['Machine Learning', 'Rust', 'Public Speaking'],
        credits: 250,
        rating: 4.8,
        ratingCount: 12,
        role: 'mentor'
      },
      {
        name: 'Sarah Chen',
        email: 'sarah@skillswap.plus',
        password: hashedPassword,
        bio: 'AI researcher and Python enthusiast. Love breaking down complex topics.',
        skillsOffered: [
          { name: 'Python', level: 95 },
          { name: 'Machine Learning', level: 88 },
          { name: 'Data Science', level: 82 }
        ],
        skillsWanted: ['React', 'UI/UX Design', 'Public Speaking'],
        credits: 180,
        rating: 4.9,
        ratingCount: 18,
        role: 'mentor'
      },
      {
        name: 'Marcus Thorne',
        email: 'marcus@skillswap.plus',
        password: hashedPassword,
        bio: 'Performance-obsessed frontend engineer. Let me help you ship faster apps.',
        skillsOffered: [
          { name: 'React', level: 92 },
          { name: 'JavaScript', level: 88 },
          { name: 'Performance Optimization', level: 90 }
        ],
        skillsWanted: ['Python', 'Docker', 'Kubernetes'],
        credits: 120,
        rating: 4.6,
        ratingCount: 8
      },
      {
        name: 'Priya Sharma',
        email: 'priya@skillswap.plus',
        password: hashedPassword,
        bio: 'UX designer turned public speaking coach. Communication is key!',
        skillsOffered: [
          { name: 'Public Speaking', level: 95 },
          { name: 'UX Research', level: 80 },
          { name: 'Leadership', level: 85 }
        ],
        skillsWanted: ['Python', 'Data Science', 'Photography'],
        credits: 90,
        rating: 4.7,
        ratingCount: 10
      },
      {
        name: 'Jordan Lee',
        email: 'jordan@skillswap.plus',
        password: hashedPassword,
        bio: 'New to SkillSwap+! Eager to learn and share photography skills.',
        skillsOffered: [
          { name: 'Photography', level: 75 },
          { name: 'Lightroom', level: 70 }
        ],
        skillsWanted: ['React', 'JavaScript', 'UI/UX Design'],
        credits: 10
      }
    ]);

    console.log(`👥 Created ${users.length} users`);

    // Create sessions
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const scheduledAt = (date, time) => {
      const datePart = new Date(date).toISOString().split('T')[0];
      return new Date(`${datePart}T${time}:00.000Z`);
    };

    const sessions = await Session.create([
      {
        title: 'Advanced Prompt Engineering',
        description: 'Learn to craft effective prompts for GPT-4 and Claude. We will cover chain-of-thought, few-shot learning, and structured output techniques.',
        skillCategory: 'Programming',
        host: users[1]._id,
        date: tomorrow,
        scheduledAt: scheduledAt(tomorrow, '15:00'),
        startTime: '15:00',
        endTime: '16:30',
        duration: 90,
        creditsRequired: 12,
        maxParticipants: 5,
        tags: ['AI', 'GPT', 'Prompt Engineering']
      },
      {
        title: 'React Performance Mastery',
        description: 'Deep dive into React.memo, useMemo, useCallback, code splitting, and profiling tools to make your apps blazingly fast.',
        skillCategory: 'Programming',
        host: users[2]._id,
        date: nextWeek,
        scheduledAt: scheduledAt(nextWeek, '10:00'),
        startTime: '10:00',
        endTime: '11:30',
        duration: 90,
        creditsRequired: 8,
        maxParticipants: 3,
        tags: ['React', 'Performance', 'Frontend']
      },
      {
        title: 'Public Speaking 101',
        description: 'Overcome stage fright and learn the fundamentals of persuasive speaking. Small group, supportive environment.',
        skillCategory: 'Public Speaking',
        host: users[3]._id,
        date: tomorrow,
        scheduledAt: scheduledAt(tomorrow, '18:00'),
        startTime: '18:00',
        endTime: '19:00',
        duration: 60,
        creditsRequired: 5,
        maxParticipants: 8,
        tags: ['Public Speaking', 'Communication', 'Soft Skills']
      },
      {
        title: 'UI/UX Design Fundamentals',
        description: 'From wireframes to high-fidelity mockups. Learn Figma best practices and design thinking methodology.',
        skillCategory: 'Design',
        host: users[0]._id,
        date: nextWeek,
        scheduledAt: scheduledAt(nextWeek, '14:00'),
        startTime: '14:00',
        endTime: '15:30',
        duration: 90,
        creditsRequired: 10,
        maxParticipants: 4,
        tags: ['Design', 'Figma', 'UX']
      }
    ]);

    console.log(`📚 Created ${sessions.length} sessions`);

    // Create some transactions for Alex
    await Transaction.create([
      {
        user: users[0]._id,
        type: 'earn',
        amount: 10,
        balance: 260,
        description: 'Earned 10 credits for teaching: "UI/UX Basics"',
        relatedUser: users[4]._id
      },
      {
        user: users[0]._id,
        type: 'spend',
        amount: -12,
        balance: 248,
        description: 'Spent 12 credits for session: "Advanced ML with Python"',
        relatedUser: users[1]._id
      },
      {
        user: users[0]._id,
        type: 'bonus',
        amount: 5,
        balance: 253,
        description: 'Streak bonus: 5-day teaching streak!'
      }
    ]);

    console.log('💳 Created sample transactions');

    // Create welcome notifications for all users
    for (const user of users) {
      await Notification.create({
        user: user._id,
        type: 'system',
        message: `Welcome to SkillSwap+, ${user.name}! Start by browsing sessions or creating your own.`,
        icon: 'celebration',
        color: 'emerald'
      });
    }

    console.log('🔔 Created welcome notifications');
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Test accounts (all use password: password123):');
    users.forEach((u) => {
      console.log(`   ${u.email} — ${u.name} (${u.credits} credits)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();
