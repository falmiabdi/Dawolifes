import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  username: string
  email: string
  password: string
  role: 'admin' | 'agent' | 'user'
  roles: string[]
  status: 'Pending' | 'Approved' | 'Rejected' | 'Suspended'
  rejectionReason?: string
  isRootAdmin: boolean
  profilePhoto?: string
  phone?: string
  documents?: {
    type: string
    url: string
  }[]
  education?: {
    institution: string
    degree: string
    year: number
  }[]
  professionalInfo?: {
    licenseNumber: string
    companyName: string
    officeAddress: string
  }
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'agent', 'user'], default: 'user' },
    roles: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Suspended'],
      default: 'Pending',
    },
    rejectionReason: { type: String },
    isRootAdmin: { type: Boolean, default: false },
    profilePhoto: { type: String },
    phone: { type: String },
    documents: [
      {
        type: { type: String },
        url: { type: String },
      },
    ],
    education: [
      {
        institution: { type: String },
        degree: { type: String },
        year: { type: Number },
      },
    ],
    professionalInfo: {
      licenseNumber: { type: String },
      companyName: { type: String },
      officeAddress: { type: String },
    },
  },
  { timestamps: true }
)

export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema)
