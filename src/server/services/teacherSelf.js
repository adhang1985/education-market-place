import { Requirement, Unlock, ProfileView, Review } from '../models/index.js';
import { CATEGORY_SLUGS } from '../utils/categories.js';
import { escapeRegex, leadView } from '../utils/serializers.js';

const DAY = 864e5;

// Requirements relevant to a teacher: same category, a subject they teach, or addressed to them.
export function leadMatchQuery(user) {
  const t = user.teacher || {};
  const or = [{ preferredTeacher: user._id }];
  if (t.categories?.length) or.push({ category: { $in: t.categories } });
  if (t.subjects?.length) or.push({ subjects: { $in: t.subjects.map((s) => new RegExp(`^${escapeRegex(s.name)}$`, 'i')) } });
  return { status: 'open', $or: or };
}

export async function dashboard({ user }) {
  const me = user;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const since30 = new Date(now - 30 * DAY);
  const since60 = new Date(now - 60 * DAY);
  const match = leadMatchQuery(me);

  const [newLeads, unlocked, views30, viewsPrev, recent, byDay] = await Promise.all([
    Requirement.countDocuments({ ...match, createdAt: { $gte: monthStart } }),
    Unlock.countDocuments({ teacher: me._id }),
    ProfileView.countDocuments({ teacher: me._id, createdAt: { $gte: since30 } }),
    ProfileView.countDocuments({ teacher: me._id, createdAt: { $gte: since60, $lt: since30 } }),
    Requirement.find(match).sort({ createdAt: -1 }).limit(4),
    ProfileView.aggregate([
      { $match: { teacher: me._id, createdAt: { $gte: since30 } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, n: { $sum: 1 } } },
    ]),
  ]);

  const counts = Object.fromEntries(byDay.map((d) => [d._id, d.n]));
  const series = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(now - (29 - i) * DAY).toISOString().slice(0, 10);
    return { date: day, value: counts[day] || 0 };
  });
  const unlockedIds = new Set((await Unlock.find({ teacher: me._id, requirement: { $in: recent.map((r) => r._id) } })).map((u) => u.requirement.toString()));

  return ({
    stats: {
      newLeads,
      contactsUnlocked: unlocked,
      profileViews: views30,
      viewsChange: viewsPrev ? Math.round(((views30 - viewsPrev) / viewsPrev) * 100) : null,
      rating: Math.round((me.teacher?.rating || 0) * 10) / 10,
      reviewsCount: me.teacher?.reviewsCount || 0,
    },
    recentLeads: recent.map((r) => leadView(r, { unlocked: unlockedIds.has(r._id.toString()) })),
    subscription: { ...me.toObject().subscription, active: me.isPro() },
    viewsSeries: series,
    status: me.teacher?.status,
    available: me.teacher?.available,
  });
}

const EDITABLE = ['headline', 'bio', 'experience', 'rate', 'city', 'modes', 'onlinePlatforms', 'qualification', 'teachingSince', 'languages', 'gallery'];

export async function updateProfile({ user, body }) {
  const me = user;
  if (body.name) me.name = body.name;
  if (body.phone !== undefined) me.phone = body.phone;
  for (const k of EDITABLE) if (body[k] !== undefined) me.teacher[k] = body[k];
  if (Array.isArray(body.categories)) me.teacher.categories = body.categories.filter((c) => CATEGORY_SLUGS.includes(c));
  if (Array.isArray(body.subjects)) {
    me.teacher.subjects = body.subjects
      .filter((s) => s.name?.trim())
      .map((s) => ({
        name: s.name.trim(),
        classFrom: s.classFrom ? Number(s.classFrom) : undefined,
        classTo: s.classTo ? Number(s.classTo) : undefined,
        label: s.label,
      }));
  }
  // Re-submitting a rejected profile puts it back in the approval queue.
  if (me.teacher.status === 'rejected') me.teacher.status = 'pending';
  await me.save();
  return { user: me.toSafeJSON() };
}

export async function setAvailability({ user, body }) {
  user.teacher.available = !!body.available;
  await user.save();
  return { available: user.teacher.available };
}

export async function reviews({ user }) {
  const reviews = await Review.find({ teacher: user._id }).sort({ createdAt: -1 }).populate('student', 'name');
  return reviews.map((r) => ({ id: r._id, rating: r.rating, comment: r.comment, student: r.student?.name, createdAt: r.createdAt }));
}

export async function unlocks({ user }) {
  const unlocks = await Unlock.find({ teacher: user._id })
    .sort({ createdAt: -1 })
    .populate({ path: 'requirement', populate: { path: 'student', select: 'name phone email' } });
  return unlocks.filter((u) => u.requirement).map((u) => ({ ...leadView(u.requirement, { unlocked: true, unlock: u }), unlockedAt: u.createdAt }));
}

