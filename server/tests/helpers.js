const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Session = require('../src/models/Session');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');
const { SESSION_STATUS, NOTIFICATION_TYPE } = require('../src/utils/constants');

const password = 'Password123!';

function uniqueEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@example.com`;
}

async function registerUser(overrides = {}) {
  const payload = {
    name: overrides.name || 'Test User',
    email: overrides.email || uniqueEmail('user'),
    password: overrides.password || password
  };

  const response = await request(app).post('/api/auth/register').send(payload);
  expect(response.status).toBe(201);

  return {
    id: response.body.data.user._id,
    token: response.body.data.accessToken,
    user: response.body.data.user,
    password: payload.password,
    email: payload.email,
    agent: request(app)
  };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

function futureDate(days = 7) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(12, 0, 0, 0);
  return date.toISOString();
}

async function createSessionFor(host, overrides = {}) {
  const doc = await Session.create({
    title: overrides.title || 'Modern JavaScript Mentoring',
    description: overrides.description || 'A practical session with enough detail for validation.',
    skillCategory: overrides.skillCategory || 'Programming',
    host: host.id || host._id || host,
    date: overrides.date || futureDate(),
    scheduledAt: overrides.scheduledAt || new Date(futureDate()),
    startTime: overrides.startTime || '10:00',
    endTime: overrides.endTime || '11:00',
    duration: overrides.duration || 60,
    creditsRequired: overrides.creditsRequired || 3,
    maxParticipants: overrides.maxParticipants || 1,
    participants: overrides.participants || [],
    status: overrides.status || SESSION_STATUS.OPEN,
    tags: overrides.tags || ['javascript', 'testing']
  });

  return doc;
}

async function setCredits(userId, credits) {
  await User.findByIdAndUpdate(userId, { credits });
}

async function createNotificationFor(userId, overrides = {}) {
  return Notification.create({
    user: userId,
    type: overrides.type || NOTIFICATION_TYPE.SYSTEM,
    message: overrides.message || 'Test notification',
    icon: overrides.icon || 'info',
    color: overrides.color || 'violet',
    read: overrides.read || false,
    link: overrides.link || ''
  });
}

function objectId() {
  return new mongoose.Types.ObjectId().toString();
}

module.exports = {
  app,
  request,
  mongoose,
  registerUser,
  authHeader,
  createSessionFor,
  createNotificationFor,
  setCredits,
  futureDate,
  objectId,
  password
};
