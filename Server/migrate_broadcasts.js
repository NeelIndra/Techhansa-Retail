require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const Broadcast = require('./models/Broadcast');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      family: 4
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB:`, error);
    process.exit(1);
  }
};

async function migrate() {
  await connectDB();
  const allNotifs = await Notification.find({});
  const broadcastMap = new Map();

  for (let n of allNotifs) {
    // If it's addressed to the admin (like Franchise request), skip it.
    if (n.userId === 'admin' || n.userId === 'admin123') continue;

    const key = n.title + '|' + n.message;
    if (!broadcastMap.has(key)) {
      broadcastMap.set(key, {
        title: n.title,
        message: n.message,
        createdAt: n.createdAt || new Date(),
        roles: ['All Users'] // Generic fallback
      });
    }
  }

  const existingBroadcasts = await Broadcast.find({});
  const existingKeys = new Set(existingBroadcasts.map(b => b.title + '|' + b.message));

  const toInsert = [];
  for (let [key, val] of broadcastMap.entries()) {
    if (!existingKeys.has(key)) {
      toInsert.push(val);
    }
  }

  if (toInsert.length > 0) {
    await Broadcast.insertMany(toInsert);
    console.log(`Migrated ${toInsert.length} old broadcasts.`);
  } else {
    console.log("No old broadcasts found to migrate.");
  }
  process.exit(0);
}

migrate();
