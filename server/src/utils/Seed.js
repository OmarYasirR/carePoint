require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');

/**
 * Bootstraps a fresh database with one account per role so you can
 * actually log in and explore the app without hand-inserting bcrypt
 * hashes into Mongo. Idempotent — safe to re-run; skips any account
 * whose email already exists rather than duplicating or resetting it.
 *
 * Usage: npm run seed   (from /server, with .env configured)
 */

const STANDARD_WEEK = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday,
  isWorkingDay: true,
  shifts: [{ startTime: '09:00', endTime: '17:00', slotDurationMinutes: 20, maxPatientsPerSlot: 1 }],
  breaks: [{ startTime: '12:30', endTime: '13:15' }],
}));
const WEEKEND_OFF = [0, 6].map((weekday) => ({ weekday, isWorkingDay: false, shifts: [], breaks: [] }));
const DEFAULT_WEEK = [...WEEKEND_OFF, ...STANDARD_WEEK].sort((a, b) => a.weekday - b.weekday);

const accounts = [
  {
    role: 'admin',
    user: {
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'admin@carepoint.dev',
      password: 'Admin123!',
      phone: '+1 555-0100',
    },
  },
  {
    role: 'doctor',
    user: {
      firstName: 'Amara',
      lastName: 'Okafor',
      email: 'dr.okafor@carepoint.dev',
      password: 'Doctor123!',
      phone: '+1 555-0101',
    },
    profile: {
      specialty: 'Cardiology',
      qualifications: ['MD', 'FACC'],
      licenseNumber: 'LIC-10234',
      yearsOfExperience: 12,
      consultationFee: 150,
      bio: 'Board-certified cardiologist focused on preventive heart health and long-term patient care.',
      weeklyAvailability: DEFAULT_WEEK,
      isOnline: true,
    },
  },
  {
    role: 'doctor',
    user: {
      firstName: 'Daniel',
      lastName: 'Lee',
      email: 'dr.lee@carepoint.dev',
      password: 'Doctor123!',
      phone: '+1 555-0102',
    },
    profile: {
      specialty: 'Pediatrics',
      qualifications: ['MD'],
      licenseNumber: 'LIC-10235',
      yearsOfExperience: 7,
      consultationFee: 110,
      bio: 'Pediatrician passionate about preventive care and family-centered treatment plans.',
      weeklyAvailability: DEFAULT_WEEK,
      isOnline: false,
    },
  },
  {
    role: 'patient',
    user: {
      firstName: 'Jordan',
      lastName: 'Taylor',
      email: 'patient@carepoint.dev',
      password: 'Patient123!',
      phone: '+1 555-0103',
    },
    profile: {
      dateOfBirth: new Date('1994-03-12'),
      gender: 'Other',
      bloodGroup: 'O+',
      address: { city: 'Springfield', country: 'USA' },
      emergencyContact: { name: 'Riley Taylor', relationship: 'Sibling', phone: '+1 555-0199' },
    },
  },
];

async function seed() {
  await connectDB();
  console.log('\nSeeding CarePoint demo accounts...\n');

  for (const entry of accounts) {
    const existing = await User.findOne({ email: entry.user.email });
    if (existing) {
      console.log(`SKIP  ${entry.role.padEnd(8)} ${entry.user.email} (already exists)`);
      continue;
    }

    const user = await User.create({ ...entry.user, role: entry.role });

    if (entry.role === 'doctor') {
      await DoctorProfile.create({ user: user._id, ...entry.profile });
    } else if (entry.role === 'patient') {
      await PatientProfile.create({ user: user._id, ...entry.profile });
    }

    console.log(`CREATE ${entry.role.padEnd(8)} ${entry.user.email} / ${entry.user.password}`);
  }

  console.log('\nDone. Sign in at /login with any of the accounts above.\n');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});