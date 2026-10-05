const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    index: true 
  }, // 'admin' for global admin notifications or specific user ID
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  unread: { 
    type: Boolean, 
    default: true 
  },
  broadcastId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Broadcast',
    required: false
  },
  time: { 
    type: String 
  }, // Optional: pre-formatted time string if needed, or we can just use createdAt
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
