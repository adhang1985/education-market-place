import { User, Requirement, Payment, Unlock } from '../models/index.js';
import { HttpError, notFound } from '../http.js';
import { escapeRegex, leadView, publicTeacher } from '../utils/serializers.js';
import { categoryName } from '../utils/categories.js';

const DAY = 864e5;
const pct = (cur, prev) => (prev ? Math.round(((cur - prev) / prev) * 100) : cur ? 100 : 0);

export async function stats({ query }) {
  const days = Math.min(365, Number(query.days) || 30);
  const now = new Date();
  const from = new Date(now - days * DAY);
  const prevFrom = new Date(now - 2 * days * DAY);
  const inRange = (a, b) => ({ createdAt: { $gte: a, $lt: b } });

  const [teachers, reqs, pros, revenueAgg, tNow, tPrev, rNow, rPrev, pNow, pPrev, revNow, revPrev, pending, reports] = await Promise.all([
    User.countDocuments({ role: 'teacher' }),
    Requirement.countDocuments(),
    User.countDocuments({ role: 'teacher', 'subscription.plan': 'pro', 'subscription.validUntil': { $gt: now } }),
    Payment.aggregate([{ $group: { _id: null, sum: { $sum: '$amount' } } }]),
    User.countDocuments({ role: 'teacher', ...inRange(from, now) }),
    User.countDocuments({ role: 'teacher', ...inRange(prevFrom, from) }),
    Requirement.countDocuments(inRange(from, now)),
    Requirement.countDocuments(inRange(prevFrom, from)),
    Payment.countDocuments(inRange(from, now)),
    Payment.countDocuments(inRange(prevFrom, from)),
    Payment.aggregate([{ $match: inRange(from, now) }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    Payment.aggregate([{ $match: inRange(prevFrom, from) }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    User.countDocuments({ role: 'teacher', 'teacher.status': 'pending' }),
    Unlock.countDocuments({ reported: true }),
  ]);

  // Cumulative user growth by month for the last 6 months.
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  const growth = await Promise.all(
    months.map(async (m) => {
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      const [t, s] = await Promise.all([
        User.countDocuments({ role: 'teacher', createdAt: { $lt: end } }),
        User.countDocuments({ role: 'student', createdAt: { $lt: end } }),
      ]);
      return { month: m.toLocaleString('en-US', { month: 'short' }), teachers: t, students: s };
    })
  );

  const recent = await User.find({ role: { $in: ['teacher', 'student'] } }).sort({ createdAt: -1 }).limit(5);

  return ({
    cards: {
      teachers: { value: teachers, change: pct(tNow, tPrev) },
      requirements: { value: reqs, change: pct(rNow, rPrev) },
      proSubscriptions: { value: pros, change: pct(pNow, pPrev) },
      revenue: { value: revenueAgg[0]?.sum || 0, change: pct(revNow[0]?.sum || 0, revPrev[0]?.sum || 0) },
    },
    pendingApprovals: pending,
    openReports: reports,
    growth,
    recent: recent.map((u) => ({
      id: u._id,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      status: u.role === 'teacher' ? u.teacher?.status : 'approved',
    })),
  });
}

export async function users({ query }) {
  const filter = { role: { $ne: 'admin' } };
  if (query.role) filter.role = query.role;
  if (query.status) filter['teacher.status'] = query.status;
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  return (
    users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt,
      status: u.teacher?.status,
      isPro: u.isPro(),
      teacher: u.role === 'teacher' ? publicTeacher(u) : undefined,
    }))
  );
}

export async function setUserStatus({ body, params }) {
  const { status } = body;
  if (!['approved', 'rejected', 'pending'].includes(status)) throw new HttpError(400, 'Invalid status');
  const u = await User.findOne({ _id: params.id, role: 'teacher' });
  if (!u) throw notFound('Teacher not found');
  u.teacher.status = status;
  await u.save();
  return { id: u._id, status };
}

export async function deleteUser({ params }) {
  const u = await User.findOneAndDelete({ _id: params.id, role: { $ne: 'admin' } });
  if (!u) throw notFound('User not found');
  if (u.role === 'student') await Requirement.updateMany({ student: u._id }, { status: 'closed' });
  return { ok: true };
}

export async function requirements({ query }) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  const items = await Requirement.find(filter).sort({ createdAt: -1 }).limit(200).populate('student', 'name phone email');
  const counts = await Unlock.aggregate([
    { $group: { _id: '$requirement', unlocks: { $sum: 1 }, reports: { $sum: { $cond: ['$reported', 1, 0] } } } },
  ]);
  const byId = Object.fromEntries(counts.map((c) => [c._id.toString(), c]));
  return (
    items.map((r) => ({
      ...leadView(r, { unlocked: true }),
      student: r.student?.name,
      unlocks: byId[r._id]?.unlocks || 0,
      reports: byId[r._id]?.reports || 0,
    }))
  );
}

export async function updateRequirement({ body, params }) {
  const r = await Requirement.findById(params.id);
  if (!r) throw notFound('Requirement not found');
  if (body.verified !== undefined) r.verified = !!body.verified;
  if (['open', 'closed'].includes(body.status)) r.status = body.status;
  await r.save();
  return { id: r._id, verified: r.verified, status: r.status };
}

export async function reports() {
  const items = await Unlock.find({ reported: true }).sort({ updatedAt: -1 }).populate('teacher', 'name email').populate('requirement', 'title category');
  return (
    items.map((u) => ({
      id: u._id,
      teacher: u.teacher?.name,
      teacherEmail: u.teacher?.email,
      lead: u.requirement?.title,
      category: categoryName(u.requirement?.category),
      reason: u.reportReason,
      reportedAt: u.updatedAt,
    }))
  );
}

// Resolve a "duplicate / invalid lead" report. refund=true returns the credit to the teacher.
export async function resolveReport({ body, params }) {
  const u = await Unlock.findById(params.id);
  if (!u || !u.reported) throw notFound('Report not found');
  if (body.refund) await User.updateOne({ _id: u.teacher }, { $inc: { 'subscription.credits': 1 } });
  u.reported = false;
  u.reportReason = body.refund ? `${u.reportReason} (refunded)` : `${u.reportReason} (dismissed)`;
  await u.save();
  return { ok: true };
}

export async function subscriptions() {
  const [payments, pros] = await Promise.all([
    Payment.find().sort({ createdAt: -1 }).limit(100).populate('teacher', 'name email'),
    User.find({ role: 'teacher', 'subscription.plan': 'pro' }).sort({ 'subscription.validUntil': -1 }),
  ]);
  return ({
    payments: payments.map((p) => ({ id: p._id, teacher: p.teacher?.name, email: p.teacher?.email, amount: p.amount, reference: p.reference, createdAt: p.createdAt })),
    subscribers: pros.map((u) => ({ id: u._id, name: u.name, email: u.email, active: u.isPro(), validUntil: u.subscription.validUntil, credits: u.subscription.credits })),
  });
}

