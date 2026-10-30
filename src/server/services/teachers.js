import mongoose from 'mongoose';
import { User, Review, ProfileView } from '../models/index.js';
import { HttpError, notFound, withStatus } from '../http.js';
import { escapeRegex, publicTeacher } from '../utils/serializers.js';

const BASE = { role: 'teacher', 'teacher.status': 'approved' };

const EXPERIENCE = { '0-1': [0, 2], '2-5': [2, 5], '5-10': [5, 10], '10+': [10, 100] };
const list = (v) => (v ? String(v).split(',').filter(Boolean) : []);

function buildFilter(qs) {
  const and = [];
  if (qs.q) {
    const rx = new RegExp(escapeRegex(qs.q), 'i');
    and.push({ $or: [{ name: rx }, { 'teacher.headline': rx }, { 'teacher.subjects.name': rx }, { 'teacher.categories': rx }, { 'teacher.bio': rx }] });
  }
  if (qs.subject) and.push({ 'teacher.subjects.name': new RegExp(`^${escapeRegex(qs.subject)}$`, 'i') });
  if (qs.category) and.push({ 'teacher.categories': qs.category });
  if (qs.studentClass && !isNaN(qs.studentClass)) {
    const n = Number(qs.studentClass);
    and.push({ 'teacher.subjects': { $elemMatch: { classFrom: { $lte: n }, classTo: { $gte: n } } } });
  }

  // Teaching mode: "online" | "home" | "both" (checkbox list) or the single dropdown value.
  const modes = list(qs.modes || qs.mode);
  if (modes.length) {
    and.push({
      $or: modes.map((m) => (m === 'both' ? { 'teacher.modes': { $all: ['online', 'home'] } } : { 'teacher.modes': m })),
    });
  }

  // Location: in-person needs a city match; otherwise online teachers also qualify.
  if (qs.location) {
    const city = { 'teacher.city': new RegExp(escapeRegex(qs.location), 'i') };
    and.push(modes.length === 1 && modes[0] === 'home' ? city : { $or: [city, { 'teacher.modes': 'online' }] });
  }

  const exp = list(qs.experience).filter((e) => EXPERIENCE[e]);
  if (exp.length) and.push({ $or: exp.map((e) => ({ 'teacher.experience': { $gte: EXPERIENCE[e][0], $lt: EXPERIENCE[e][1] } })) });

  if (qs.minPrice || qs.maxPrice) {
    const rate = {};
    if (qs.minPrice) rate.$gte = Number(qs.minPrice);
    if (qs.maxPrice) rate.$lte = Number(qs.maxPrice);
    and.push({ 'teacher.rate': rate });
  }
  const ratings = list(qs.rating).map(Number).filter(Boolean);
  if (ratings.length) and.push({ 'teacher.rating': { $gte: Math.min(...ratings) } });

  return and.length ? { ...BASE, $and: and } : { ...BASE };
}

const SORTS = {
  relevance: { isPro: -1, 'teacher.rating': -1, 'teacher.reviewsCount': -1 },
  rating: { 'teacher.rating': -1, 'teacher.reviewsCount': -1 },
  price_asc: { 'teacher.rate': 1 },
  price_desc: { 'teacher.rate': -1 },
  experience: { 'teacher.experience': -1 },
};

export async function search({ query }) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Number(query.limit) || 10);
  const filter = buildFilter(query);

  const [result] = await User.aggregate([
    { $match: filter },
    { $addFields: { isPro: { $and: [{ $eq: ['$subscription.plan', 'pro'] }, { $gt: ['$subscription.validUntil', new Date()] }] } } },
    { $sort: { ...(SORTS[query.sort] || SORTS.relevance), _id: 1 } },
    { $facet: { items: [{ $skip: (page - 1) * limit }, { $limit: limit }], total: [{ $count: 'n' }] } },
  ]);

  // Facet counts for the filter sidebar (over all approved teachers).
  const count = (extra) => User.countDocuments({ ...BASE, ...extra });
  const [online, home, both, ...rest] = await Promise.all([
    count({ 'teacher.modes': 'online' }),
    count({ 'teacher.modes': 'home' }),
    count({ 'teacher.modes': { $all: ['online', 'home'] } }),
    ...Object.values(EXPERIENCE).map(([a, b]) => count({ 'teacher.experience': { $gte: a, $lt: b } })),
    ...[4.5, 4, 3.5].map((r) => count({ 'teacher.rating': { $gte: r } })),
  ]);
  const expKeys = Object.keys(EXPERIENCE);

  return {
    items: result.items.map(publicTeacher),
    total: result.total[0]?.n || 0,
    page,
    pages: Math.ceil((result.total[0]?.n || 0) / limit),
    facets: {
      modes: { online, home, both },
      experience: Object.fromEntries(expKeys.map((k, i) => [k, rest[i]])),
      rating: { 4.5: rest[4], 4: rest[5], 3.5: rest[6] },
    },
  };
}

export async function featured() {
  const teachers = await User.find(BASE).sort({ 'teacher.featured': -1, 'teacher.rating': -1 }).limit(3);
  return teachers.map(publicTeacher);
}

export async function subjects() {
  const names = await User.distinct('teacher.subjects.name', BASE);
  return names.sort();
}

// Public profile. Pending/rejected profiles are visible only to their owner and admins.
// track=false for server-side renders, which must not count as views (the browser calls recordView instead).
export async function profile({ user, params, query = {}, track = query.noTrack !== '1' }) {
  if (!mongoose.isValidObjectId(params.id)) throw notFound('Teacher not found');
  const teacher = await User.findOne({ _id: params.id, role: 'teacher' });
  const isSelfOrAdmin = user && (user.id === params.id || user.role === 'admin');
  if (!teacher || (teacher.teacher?.status !== 'approved' && !isSelfOrAdmin)) throw notFound('Teacher not found');

  if (track && user?.id !== params.id) await ProfileView.create({ teacher: teacher._id });
  const reviews = await Review.find({ teacher: teacher._id }).sort({ createdAt: -1 }).limit(20).populate('student', 'name');
  return {
    ...publicTeacher(teacher),
    status: teacher.teacher?.status,
    reviews: reviews.map((r) => ({ id: r._id, rating: r.rating, comment: r.comment, student: r.student?.name || 'Student', createdAt: r.createdAt })),
  };
}

export async function recordView({ user, params }) {
  if (!mongoose.isValidObjectId(params.id)) throw notFound('Teacher not found');
  const exists = await User.exists({ _id: params.id, ...BASE });
  if (!exists) throw notFound('Teacher not found');
  if (user?.id !== params.id) await ProfileView.create({ teacher: params.id });
  return { ok: true };
}

export async function addReview({ user, params, body }) {
  const rating = Number(body.rating);
  if (!(rating >= 1 && rating <= 5)) throw new HttpError(400, 'Rating must be between 1 and 5');
  const teacher = await User.findOne({ _id: params.id, ...BASE });
  if (!teacher) throw notFound('Teacher not found');
  if (await Review.exists({ teacher: teacher._id, student: user._id })) throw new HttpError(409, 'You have already reviewed this teacher');

  const review = await Review.create({ teacher: teacher._id, student: user._id, rating, comment: body.comment });
  const t = teacher.teacher;
  t.rating = ((t.rating || 0) * (t.reviewsCount || 0) + rating) / ((t.reviewsCount || 0) + 1);
  t.reviewsCount = (t.reviewsCount || 0) + 1;
  await teacher.save();
  return withStatus({ id: review._id, rating, comment: review.comment, student: user.name, createdAt: review.createdAt }, 201);
}

export async function toggleFavorite({ user, params }) {
  const id = params.id;
  const has = user.favorites.some((f) => f.toString() === id);
  user.favorites = has ? user.favorites.filter((f) => f.toString() !== id) : [...user.favorites, id];
  await user.save();
  return { favorites: user.favorites, favorited: !has };
}
