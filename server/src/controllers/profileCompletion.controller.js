const User = require('../models/User');
const Resume = require('../models/Resume');
const ProjectResource = require('../models/ProjectResource');
const ProfileCompletion = require('../models/ProfileCompletion');
const catchAsync = require('../utils/catchAsync');

function fieldDone(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

async function calculateCompletion(userId) {
  const [user, resumeCount, projectCount] = await Promise.all([
    User.findById(userId).lean(),
    Resume.countDocuments({ user: userId }),
    ProjectResource.countDocuments({ user: userId, type: 'project' })
  ]);

  const checks = [
    ['name', fieldDone(user?.name), 'profile'],
    ['bio', fieldDone(user?.bio), 'profile'],
    ['profilePicture', fieldDone(user?.profilePicture), 'profile'],
    ['skillsOffered', fieldDone(user?.skillsOffered), 'skills'],
    ['skillsWanted', fieldDone(user?.skillsWanted), 'learning'],
    ['resume', resumeCount > 0, 'proof'],
    ['project', projectCount > 0, 'proof']
  ];

  const completedFields = checks.filter(([, done]) => done).map(([name]) => name);
  const missingFields = checks.filter(([, done]) => !done).map(([name]) => name);
  const percentage = Math.round((completedFields.length / checks.length) * 100);

  const sectionTotals = checks.reduce((acc, [, , section]) => {
    acc[section] = (acc[section] || 0) + 1;
    return acc;
  }, {});
  const sectionDone = checks.reduce((acc, [, done, section]) => {
    acc[section] = (acc[section] || 0) + (done ? 1 : 0);
    return acc;
  }, {});

  const sections = Object.keys(sectionTotals).reduce((acc, section) => {
    acc[section] = Math.round((sectionDone[section] || 0) / sectionTotals[section] * 100);
    return acc;
  }, {});

  return { percentage, completedFields, missingFields, sections, lastCalculatedAt: new Date() };
}

const getMyProfileCompletion = catchAsync(async (req, res) => {
  const calculated = await calculateCompletion(req.user._id);
  const completion = await ProfileCompletion.findOneAndUpdate(
    { user: req.user._id },
    { ...calculated, user: req.user._id },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  res.status(200).json({ status: 'success', data: { completion } });
});

module.exports = { getMyProfileCompletion, calculateCompletion };
