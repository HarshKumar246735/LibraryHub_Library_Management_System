import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { runDueDateJob } from './jobs/dueDateJob.js';

try {
  await connectDB();
  console.log('MongoDB connected');
  if (env.enableJobs) {
    // In-process scheduler for single-instance hosting. Free tiers may sleep; see README for the cron alternative.
    const run = () => runDueDateJob().then((r) => console.log('Due-date job:', r)).catch((e) => console.error('Due-date job failed:', e.message));
    run();
    setInterval(run, 6 * 60 * 60 * 1000);
  }
  createApp().listen(env.port, () => console.log(`LibraryHub API listening on port ${env.port} (${env.nodeEnv})`));
} catch (err) {
  console.error('Failed to start server:', err.message);
  process.exit(1);
}
