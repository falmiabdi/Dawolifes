import mongoose, { Schema, model, models } from 'mongoose'

const userSchema = new Schema(
  {
    // ── Auth ──────────────────────────────────────────────────────────
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'agent'], default: 'agent' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Suspended'], default: 'Pending' },
    rejectionReason: { type: String, default: '' },
    onboardingComplete: { type: Boolean, default: false },
    approvedAt: { type: Date },

    // ── Step 1: Personal Information ──────────────────────────────────
    fullName: { type: String, default: '' },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
    dateOfBirth: { type: String, default: '' },
    nationality: { type: String, default: 'Ethiopian' },
    preferredLanguage: { type: String, enum: ['English', 'Afaan Oromo', 'Amharic', ''], default: '' },

    // ── Step 2: Contact Information ───────────────────────────────────
    ethPhone: { type: String, default: '' },
    safaricomPhone: { type: String, default: '' },
    region: { type: String, default: '' },
    city: { type: String, default: '' },
    woreda: { type: String, default: '' },
    kebele: { type: String, default: '' },
    fullAddress: { type: String, default: '' },

    // ── Step 3: Identity Documents ────────────────────────────────────
    faydaFront: { type: String, default: '' },
    faydaBack: { type: String, default: '' },
    selfieFayda: { type: String, default: '' },
    passportPhoto: { type: String, default: '' },

    // ── Step 4: Education ─────────────────────────────────────────────
    highestEducation: {
      type: String,
      enum: ['Grade 10', 'Grade 12', 'TVET Certificate', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD', ''],
      default: '',
    },
    educationCertificate: { type: String, default: '' },

    // ── Step 5: Professional (all optional) ──────────────────────────
    agentExperience: { type: String, default: '' },
    companyName: { type: String, default: '' },
    officeAddress: { type: String, default: '' },
    businessLicenseNumber: { type: String, default: '' },
    businessLicenseFile: { type: String, default: '' },
    tinNumber: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
)

export const UserModel = models.User || model('User', userSchema)
