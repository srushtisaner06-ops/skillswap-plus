const Session = require('../models/Session');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const ProjectResource = require('../models/ProjectResource');
const Resume = require('../models/Resume');
const Recommendation = require('../models/Recommendation');
const Activity = require('../models/Activity');
const { calculateCompletion } = require('./profileCompletion.controller');
const catchAsync = require('../utils/catchAsync');

function startOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthLabel(date) {
  return date.toLocaleString('en', { month: 'short', timeZone: 'UTC' });
}

const getDashboardAnalytics = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const firstMonth = startOfMonth(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)));

  const [
    hosting,
    attending,
    transactions,
    projectCount,
    resourceCount,
    resumeCount,
    recommendationCount,
    unreadNotifications,
    recentActivity,
    completion
  ] = await Promise.all([
    Session.countDocuments({ host: userId }),
    Session.countDocuments({ participants: userId }),
    Transaction.find({ user: userId, createdAt: { $gte: firstMonth } }).sort({ createdAt: 1 }).lean(),
    ProjectResource.countDocuments({ user: userId, type: 'project' }),
    ProjectResource.countDocuments({ user: userId, type: 'resource' }),
    Resume.countDocuments({ user: userId }),
    Recommendation.countDocuments({ user: userId, status: { $ne: 'dismissed' } }),
    Notification.countDocuments({ user: userId, read: false }),
    Activity.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean(),
    calculateCompletion(userId)
  ]);

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = startOfMonth(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1)));
    return { date, label: monthLabel(date), earned: 0, spent: 0, activity: 0 };
  });

  transactions.forEach((transaction) => {
    const key = startOfMonth(transaction.createdAt).getTime();
    const bucket = months.find((m) => m.date.getTime() === key);
    if (!bucket) return;
    if (transaction.amount >= 0) bucket.earned += transaction.amount;
    else bucket.spent += Math.abs(transaction.amount);
    bucket.activity += 1;
  });

  const creditsEarned = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const creditsSpent = transactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        sessionsTaught: hosting,
        sessionsAttended: attending,
        creditsEarned,
        creditsSpent,
        projects: projectCount,
        resources: resourceCount,
        resumes: resumeCount,
        recommendations: recommendationCount,
        unreadNotifications,
        profileCompletion: completion.percentage
      },
      charts: {
        creditsByMonth: months.map(({ label, earned, spent }) => ({ label, earned, spent })),
        activityByMonth: months.map(({ label, activity }) => ({ label, activity }))
      },
      recentActivity,
      profileCompletion: completion
    }
  });
});

module.exports = { getDashboardAnalytics };
