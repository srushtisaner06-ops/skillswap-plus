/* ═══════════════════════════════════════════
   Notification Routes
   ═══════════════════════════════════════════ */

const express = require('express');
const router = express.Router();

const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

// All notification routes require auth
router.get('/',              protect, getNotifications);
router.get('/unread-count',  protect, getUnreadCount);
router.patch('/read-all',    protect, markAllAsRead);
router.patch('/:id/read',   protect, markAsRead);

module.exports = router;
