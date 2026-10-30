import { Payment } from '../models/index.js';
import { PRO_PLAN } from '../utils/categories.js';

export const plan = () => PRO_PLAN;

// Mock checkout: records a payment and activates/renews Pro for 30 days.
// Swap this for a real gateway (Razorpay/Stripe) webhook in production.
export async function subscribe({ user: me }) {
  const now = new Date();
  const wasPro = me.isPro();
  const base = wasPro ? me.subscription.validUntil : now;
  await Payment.create({ teacher: me._id, amount: PRO_PLAN.price, reference: `MOCK-${now.getTime()}` });

  me.subscription.plan = 'pro';
  me.subscription.validUntil = new Date(base.getTime() + PRO_PLAN.durationDays * 864e5);
  me.subscription.credits = (wasPro ? me.subscription.credits : 0) + PRO_PLAN.credits;
  me.subscription.creditsTotal = me.subscription.credits;
  await me.save();
  return { user: me.toSafeJSON(), message: 'Welcome to TutorHub Pro!' };
}

// Cancelling keeps access until validUntil; we simply stop renewal (no auto-renew in mock).
export const cancel = ({ user }) => ({
  message: `Your plan stays active until ${user.subscription.validUntil?.toDateString() || 'the end of the period'}.`,
});
