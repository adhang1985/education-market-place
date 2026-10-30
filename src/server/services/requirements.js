import mongoose from 'mongoose';
import { Requirement, Unlock, User } from '../models/index.js';
import { HttpError, notFound, withStatus } from '../http.js';
import { CATEGORY_SLUGS, categoryName } from '../utils/categories.js';

const MODES = ['home', 'online', 'either'];

export async function create({ user, body }) {
  const b = body;
  if (!b.studentClass) throw new HttpError(400, "Student's class is required");
  if (!Array.isArray(b.subjects) || !b.subjects.length) throw new HttpError(400, 'Select at least one subject');
  if (!MODES.includes(b.mode)) throw new HttpError(400, 'Select a learning mode');
  if (b.mode !== 'online' && !b.location) throw new HttpError(400, 'Location is required for in-person classes');
  if (b.details && b.details.length > 300) throw new HttpError(400, 'Additional details can be at most 300 characters');

  const category = CATEGORY_SLUGS.includes(b.category) ? b.category : 'school';
  const isSchoolClass = /^\d+$/.test(String(b.studentClass));
  const title = b.title?.trim() || (isSchoolClass ? `Class ${b.studentClass} - ${b.subjects.join(', ')}` : `${b.subjects.join(', ')} (${categoryName(category)})`);

  let preferredTeacher;
  if (b.preferredTeacher && mongoose.isValidObjectId(b.preferredTeacher) && (await User.exists({ _id: b.preferredTeacher, role: 'teacher' })))
    preferredTeacher = b.preferredTeacher;

  const r = await Requirement.create({
    student: user._id,
    category,
    title,
    studentClass: String(b.studentClass),
    subjects: b.subjects,
    mode: b.mode,
    location: b.mode === 'online' && !b.location ? 'Online' : b.location,
    address: b.address,
    learningGoal: b.learningGoal,
    level: b.level,
    schedule: b.schedule,
    budgetMin: b.budgetMin || undefined,
    budgetMax: b.budgetMax || undefined,
    budgetUnit: b.budgetUnit || 'hour',
    details: b.details,
    contactName: user.name,
    contactPhone: b.contactPhone || user.phone,
    contactEmail: user.email,
    consent: !!b.consent,
    preferredTeacher,
  });
  if (b.contactPhone && !user.phone) {
    user.phone = b.contactPhone;
    await user.save();
  }
  return withStatus(r, 201);
}

export async function mine({ user }) {
  const reqs = await Requirement.find({ student: user._id }).sort({ createdAt: -1 }).lean();
  const counts = await Unlock.aggregate([{ $match: { requirement: { $in: reqs.map((r) => r._id) } } }, { $group: { _id: '$requirement', n: { $sum: 1 } } }]);
  const byId = Object.fromEntries(counts.map((c) => [c._id.toString(), c.n]));
  return reqs.map((r) => ({ ...r, id: r._id, categoryName: categoryName(r.category), teachersConnected: byId[r._id.toString()] || 0 }));
}

// Students may grant consent or close/reopen their own request.
export async function update({ user, body, params }) {
  const r = await Requirement.findOne({ _id: params.id, student: user._id });
  if (!r) throw notFound('Requirement not found');
  if (body.consent !== undefined) r.consent = !!body.consent;
  if (['open', 'closed'].includes(body.status)) r.status = body.status;
  await r.save();
  return r;
}

