import mongoose from 'mongoose';
import { Requirement, Unlock, User } from '../models/index.js';
import { HttpError, notFound, withStatus } from '../http.js';
import { leadView } from '../utils/serializers.js';

// Public preview list – never includes contact details unless the viewer unlocked it.
export async function list({ user, query }) {
  const filter = { status: 'open' };
  if (query.category && query.category !== 'all') filter.category = query.category;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Number(query.limit) || 20);

  const [items, total] = await Promise.all([
    Requirement.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('student', 'name phone email'),
    Requirement.countDocuments(filter),
  ]);
  const unlocks = user?.role === 'teacher' ? await Unlock.find({ teacher: user._id, requirement: { $in: items.map((i) => i._id) } }) : [];
  const map = new Map(unlocks.map((u) => [u.requirement.toString(), u]));
  return {
    items: items.map((r) => leadView(r, { unlocked: map.has(r._id.toString()), unlock: map.get(r._id.toString()) })),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function detail({ user, params }) {
  if (!mongoose.isValidObjectId(params.id)) throw notFound('Lead not found');
  const r = await Requirement.findById(params.id).populate('student', 'name phone email');
  if (!r) throw notFound('Lead not found');
  const unlock = user?.role === 'teacher' ? await Unlock.findOne({ teacher: user._id, requirement: r._id }) : null;
  const isOwnerOrAdmin = !!user && (user.role === 'admin' || r.student?._id.equals(user._id));
  return leadView(r, { unlocked: !!unlock || isOwnerOrAdmin, unlock });
}

export async function unlock({ user: me, params }) {
  if (me.teacher?.status !== 'approved') throw new HttpError(403, 'Your profile must be approved before unlocking leads');
  const r = await Requirement.findById(params.id).populate('student', 'name phone email');
  if (!r || r.status !== 'open') throw notFound('This lead is no longer available');

  const existing = await Unlock.findOne({ teacher: me._id, requirement: r._id });
  if (existing) return { lead: leadView(r, { unlocked: true, unlock: existing }), credits: me.subscription.credits };

  if (!r.consent) throw new HttpError(409, 'The student has not yet consented to share contact details', 'NO_CONSENT');
  if (!me.isPro()) throw new HttpError(402, 'Subscribe to TutorHub Pro to unlock contact details', 'NOT_PRO');

  // Atomically spend one credit so concurrent unlocks can't overdraw.
  const updated = await User.findOneAndUpdate({ _id: me._id, 'subscription.credits': { $gt: 0 } }, { $inc: { 'subscription.credits': -1 } }, { new: true });
  if (!updated) throw new HttpError(402, 'You have used all your contact unlocks. Renew to get more.', 'NO_CREDITS');

  try {
    const u = await Unlock.create({ teacher: me._id, requirement: r._id });
    return withStatus({ lead: leadView(r, { unlocked: true, unlock: u }), credits: updated.subscription.credits }, 201);
  } catch (e) {
    await User.updateOne({ _id: me._id }, { $inc: { 'subscription.credits': 1 } }); // refund on duplicate race
    throw e;
  }
}

export async function report({ user, params, body }) {
  const u = await Unlock.findOne({ teacher: user._id, requirement: params.id });
  if (!u) throw notFound('You can only report leads you have unlocked');
  if (u.reported) throw new HttpError(409, 'Replacement already requested');
  u.reported = true;
  u.reportReason = body.reason || 'Duplicate or invalid';
  await u.save();
  return { message: 'Replacement requested. Our team will review it shortly.' };
}
