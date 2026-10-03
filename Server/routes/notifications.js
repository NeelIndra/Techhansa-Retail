const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Broadcast = require('../models/Broadcast');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/broadcasts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'poster-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Temporary simple auth check since we're keeping it aligned with admin
// Depending on auth implementation, we might want to just get 'admin' notifications
// For this simple implementation, we'll fetch notifications intended for 'admin'

// GET /api/notifications/:userId
// Fetch all notifications for a user
router.get('/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PATCH /api/notifications/:userId/read-all
// Mark all notifications as read for a user
router.patch('/:userId/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId, unread: true }, { $set: { unread: false } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PATCH /api/notifications/:userId/:id/read
// Mark a specific notification as read
router.patch('/:userId/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.params.userId },
      { $set: { unread: false } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/notifications/seed (Optional, just to add initial data)
router.post('/seed', async (req, res) => {
  try {
    await Notification.deleteMany({ userId: 'admin' });
    
    const initialData = [
      { userId: 'admin', title: 'New Franchise Request', message: 'User fran123 has registered.', time: '10 mins ago', unread: true },
      { userId: 'admin', title: 'System Update', message: 'Central database synced successfully.', time: '1 hour ago', unread: false },
    ];
    
    await Notification.insertMany(initialData);
    res.json({ success: true, message: 'Notifications seeded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/notifications/broadcasts/history
// Fetch all broadcast history
router.get('/broadcasts/history', async (req, res) => {
  try {
    const broadcasts = await Broadcast.find().sort({ createdAt: -1 });
    res.json(broadcasts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/notifications/public/broadcast
// Fetch latest public broadcast
router.get('/public/broadcast', async (req, res) => {
  try {
    const broadcast = await Broadcast.findOne({ roles: 'website' }).sort({ createdAt: -1 });
    res.json(broadcast);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/notifications/broadcast
// Broadcast notification to specific roles
router.post('/broadcast', upload.single('poster'), async (req, res) => {
  try {
    let { title, message, roles } = req.body;
    
    // Parse roles if it's sent as a string (from FormData)
    if (typeof roles === 'string') {
      try {
        roles = JSON.parse(roles);
      } catch (e) {
        roles = roles.split(',');
      }
    }

    if (!roles || !Array.isArray(roles)) {
      return res.status(400).json({ message: 'An array of roles is required.' });
    }
    
    if (!req.file && (!title || !message)) {
      return res.status(400).json({ message: 'Either a poster or both title and message are required.' });
    }
    
    const baseUrl = req.protocol + '://' + req.get('host');
    const posterUrl = req.file ? `${baseUrl}/uploads/broadcasts/${req.file.filename}` : null;

    const User = require('../models/User');
    const userRoles = roles.filter(r => r !== 'website');
    let users = [];
    
    if (userRoles.length > 0) {
      users = await User.find({ role: { $in: userRoles } });
    }
    
    if (userRoles.length > 0 && users.length === 0) {
      return res.status(404).json({ message: 'No users found for the selected roles.' });
    }

    if (users.length > 0) {
      const notifications = users.map(user => ({
        userId: user.userId,
        title,
        message,
        unread: true,
        time: 'Just now' // Simplified for immediate display
      }));
      await Notification.insertMany(notifications);
    }

    const newBroadcast = new Broadcast({ title, message, roles, posterUrl });
    await newBroadcast.save();

    res.json({ success: true, message: `Notification broadcasted to ${users.length} users and/or website.` });
  } catch (err) {
    console.error('Broadcast Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/notifications/broadcast/:id
// Edit a broadcast
router.put('/broadcast/:id', upload.single('poster'), async (req, res) => {
  try {
    let { title, message, roles } = req.body;
    
    // Parse roles if it's sent as a string (from FormData)
    if (typeof roles === 'string') {
      try {
        roles = JSON.parse(roles);
      } catch (e) {
        roles = roles.split(',');
      }
    }

    if (!roles || !Array.isArray(roles)) {
      return res.status(400).json({ message: 'An array of roles is required.' });
    }
    
    const updateData = { title, message, roles };
    if (req.file) {
      const baseUrl = req.protocol + '://' + req.get('host');
      updateData.posterUrl = `${baseUrl}/uploads/broadcasts/${req.file.filename}`;
    }
    const updatedBroadcast = await Broadcast.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!updatedBroadcast) return res.status(404).json({ message: 'Broadcast not found' });
    res.json(updatedBroadcast);
  } catch (err) {
    console.error('Edit Broadcast Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE /api/notifications/broadcast/:id
// Delete a broadcast
router.delete('/broadcast/:id', async (req, res) => {
  try {
    const deletedBroadcast = await Broadcast.findByIdAndDelete(req.params.id);
    if (!deletedBroadcast) return res.status(404).json({ message: 'Broadcast not found' });
    res.json({ success: true, message: 'Broadcast deleted successfully' });
  } catch (err) {
    console.error('Delete Broadcast Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
