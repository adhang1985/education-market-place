import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    classFrom: Number, // school classes only, e.g. 6
    classTo: Number, // e.g. 10
    label: String, // free-form level, e.g. "Beginner – Advanced"
  },
  { _id: false }
);

const teacherSchema = new mongoose.Schema(
  {
    headline: String,
    bio: String,
    categories: [String],
    subjects: [subjectSchema],
    experience: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    city: String,
    modes: [{ type: String, enum: ['online', 'home'] }],
    onlinePlatforms: { type: String, default: 'Google Meet, Zoom' },
    qualification: String,
    teachingSince: Number,
    languages: [String],
    gallery: [String],
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    available: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: String,
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
    avatar: String,
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    teacher: teacherSchema,
    subscription: {
      plan: { type: String, enum: ['free', 'pro'], default: 'free' },
      validUntil: Date,
      credits: { type: Number, default: 0 },
      creditsTotal: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.isPro = function () {
  return this.subscription?.plan === 'pro' && this.subscription.validUntil > new Date();
};

userSchema.methods.toSafeJSON = function () {
  const { _id, name, email, phone, role, avatar, favorites, teacher, subscription, createdAt } = this.toObject();
  return {
    id: _id,
    name,
    email,
    phone,
    role,
    avatar,
    favorites,
    teacher,
    subscription: role === 'teacher' ? { ...subscription, active: this.isPro() } : undefined,
    createdAt,
  };
};

// Reuse the compiled model when Next.js hot-reloads this module in development.
export default mongoose.models.User || mongoose.model('User', userSchema);
