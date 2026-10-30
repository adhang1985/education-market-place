import mongoose from 'mongoose';
import User from './User.js';

const { ObjectId } = mongoose.Schema.Types;

// A student's learning request. Teachers see it as a "lead".
const requirementSchema = new mongoose.Schema(
  {
    student: { type: ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    studentClass: String,
    subjects: [String],
    mode: { type: String, enum: ['home', 'online', 'either'], default: 'either' },
    location: String, // approximate, shown before unlock (e.g. "South Delhi")
    address: String, // full address, hidden until unlock
    learningGoal: String,
    level: String,
    schedule: String,
    budgetMin: Number,
    budgetMax: Number,
    budgetUnit: { type: String, enum: ['hour', 'session', 'class', 'month', 'consult'], default: 'hour' },
    details: { type: String, maxlength: 300 },
    contactName: String,
    contactPhone: String,
    contactEmail: String,
    consent: { type: Boolean, default: false },
    preferredTeacher: { type: ObjectId, ref: 'User' },
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
);
requirementSchema.index({ status: 1, createdAt: -1 });

const unlockSchema = new mongoose.Schema(
  {
    teacher: { type: ObjectId, ref: 'User', required: true },
    requirement: { type: ObjectId, ref: 'Requirement', required: true },
    reported: { type: Boolean, default: false },
    reportReason: String,
  },
  { timestamps: true }
);
unlockSchema.index({ teacher: 1, requirement: 1 }, { unique: true });

const reviewSchema = new mongoose.Schema(
  {
    teacher: { type: ObjectId, ref: 'User', required: true },
    student: { type: ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
  },
  { timestamps: true }
);

const profileViewSchema = new mongoose.Schema({
  teacher: { type: ObjectId, ref: 'User', required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

const paymentSchema = new mongoose.Schema(
  {
    teacher: { type: ObjectId, ref: 'User', required: true },
    plan: { type: String, default: 'pro' },
    amount: { type: Number, required: true },
    reference: String,
  },
  { timestamps: true }
);

export const Requirement = mongoose.models.Requirement || mongoose.model('Requirement', requirementSchema);
export const Unlock = mongoose.models.Unlock || mongoose.model('Unlock', unlockSchema);
export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
export const ProfileView = mongoose.models.ProfileView || mongoose.model('ProfileView', profileViewSchema);
export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export { User };
