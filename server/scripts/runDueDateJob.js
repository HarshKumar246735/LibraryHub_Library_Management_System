// For Render Cron Jobs or any scheduler:  npm run job:due-dates
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { runDueDateJob } from '../jobs/dueDateJob.js';

try {
  await connectDB(env.mongoUri);
  console.log('Due-date job finished:', await runDueDateJob());
} finally {
  await mongoose.disconnect();
}
