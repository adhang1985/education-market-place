import { User, Requirement } from '../models/index.js';
import { CATEGORIES } from '../utils/categories.js';
import { publicTeacher } from '../utils/serializers.js';

const APPROVED = { role: 'teacher', 'teacher.status': 'approved' };

export async function categories() {
  const [teacherCounts, leadCounts] = await Promise.all([
    User.aggregate([{ $match: APPROVED }, { $unwind: '$teacher.categories' }, { $group: { _id: '$teacher.categories', n: { $sum: 1 } } }]),
    Requirement.aggregate([{ $match: { status: 'open' } }, { $group: { _id: '$category', n: { $sum: 1 } } }]),
  ]);
  const t = Object.fromEntries(teacherCounts.map((c) => [c._id, c.n]));
  const l = Object.fromEntries(leadCounts.map((c) => [c._id, c.n]));
  return CATEGORIES.map((c) => ({ ...c, teachers: t[c.slug] || 0, leads: l[c.slug] || 0 }));
}

export async function stats() {
  const [teachers, students, subjects, ratingAgg] = await Promise.all([
    User.countDocuments(APPROVED),
    User.countDocuments({ role: 'student' }),
    User.distinct('teacher.subjects.name', APPROVED),
    User.aggregate([{ $match: { ...APPROVED, 'teacher.reviewsCount': { $gt: 0 } } }, { $group: { _id: null, avg: { $avg: '$teacher.rating' } } }]),
  ]);
  return { teachers, students, subjects: subjects.length, rating: Math.round((ratingAgg[0]?.avg || 0) * 10) / 10 };
}

// Student's saved teachers
export async function favorites({ user }) {
  const list = await User.find({ _id: { $in: user.favorites }, ...APPROVED });
  return list.map(publicTeacher);
}
