// Creates the first administrator account.
// Credentials must be provided through environment variables.
//
// PowerShell usage:
// $env:ADMIN_EMAIL = "admin@example.com"
// $env:ADMIN_PASSWORD = "StrongPass123"
// $env:ADMIN_NAME = "Library Administrator"
// npm run create-admin

import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';
import { User, ROLES } from '../models/User.js';

const {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME = 'Library Administrator',
} = process.env;

// Validate required environment variables.
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('\n❌ Missing administrator credentials.');
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.\n');
  process.exit(1);
}

// Validate email format.
const email = ADMIN_EMAIL.trim().toLowerCase();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
  console.error('\n❌ Please provide a valid administrator email address.\n');
  process.exit(1);
}

// Validate password strength.
if (
  ADMIN_PASSWORD.length < 8 ||
  !/[a-z]/.test(ADMIN_PASSWORD) ||
  !/[A-Z]/.test(ADMIN_PASSWORD) ||
  !/[0-9]/.test(ADMIN_PASSWORD)
) {
  console.error('\n❌ Password does not meet the requirements.');
  console.error('Use at least 8 characters, including:');
  console.error('- One uppercase letter');
  console.error('- One lowercase letter');
  console.error('- One number\n');
  process.exit(1);
}

let exitCode = 0;

try {
  console.log('\nConnecting to the LibraryHub database...');

  await connectDB(env.mongoUri);

  console.log('Database connected successfully.');

  // Check whether an account already exists.
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    console.error('\n⚠️ An account with this email already exists.');

    if (existingUser.role === ROLES.ADMIN) {
      console.log('This account already has the administrator role.');
    } else {
      console.log(
        'The existing account has a different role. No changes were made.'
      );
    }

    console.log('Use the existing account or choose another email address.\n');
  } else {
    // Create the administrator account.
    await User.create({
      fullName: ADMIN_NAME.trim(),
      email,
      password: ADMIN_PASSWORD,
      role: ROLES.ADMIN,
    });

    console.log('\n✅ Administrator created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Name: ${ADMIN_NAME.trim()}`);
    console.log(`Role: ${ROLES.ADMIN}`);
    console.log('\nYou can now try logging in to LibraryHub.\n');
  }
} catch (error) {
  exitCode = 1;

  console.error('\n❌ Failed to create the administrator.');

  if (error.code === 11000) {
    console.error('An account with this email already exists.');
  } else {
    console.error('Error:', error.message);
  }
} finally {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error('Warning: Could not disconnect from MongoDB:', error.message);
    exitCode = 1;
  }
}

if (exitCode !== 0) {
  process.exitCode = exitCode;
}