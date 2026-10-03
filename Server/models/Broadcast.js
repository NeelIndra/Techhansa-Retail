const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
  title: { type: String },
  message: { type: String },
  roles: [{ type: String }],
  posterUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Broadcast', broadcastSchema);
