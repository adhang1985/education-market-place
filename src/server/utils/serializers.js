import { categoryName } from './categories.js';

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isProDoc = (u) => u?.subscription?.plan === 'pro' && new Date(u.subscription.validUntil) > new Date();

export function subjectLabel(s) {
  if (s.classFrom && s.classTo) return s.classFrom === s.classTo ? `Class ${s.classFrom}` : `Class ${s.classFrom} - ${s.classTo}`;
  return s.label || '';
}

// Public view of a teacher – never exposes email/phone.
export function publicTeacher(u) {
  const t = u.teacher || {};
  return {
    id: u._id,
    name: u.name,
    avatar: u.avatar,
    isPro: isProDoc(u),
    verified: t.status === 'approved',
    headline: t.headline,
    bio: t.bio,
    categories: t.categories || [],
    subjects: (t.subjects || []).map((s) => ({ name: s.name, classFrom: s.classFrom, classTo: s.classTo, label: s.label, display: subjectLabel(s) })),
    experience: t.experience,
    rate: t.rate,
    city: t.city,
    modes: t.modes || [],
    onlinePlatforms: t.onlinePlatforms,
    qualification: t.qualification,
    teachingSince: t.teachingSince,
    languages: t.languages || [],
    gallery: t.gallery || [],
    rating: Math.round((t.rating || 0) * 10) / 10,
    reviewsCount: t.reviewsCount || 0,
    available: t.available,
    createdAt: u.createdAt,
  };
}

const maskPhone = (p = '') => (p.length > 6 ? p.slice(0, 6) + '*'.repeat(Math.max(4, p.length - 6)) : '**********');

// Lead view for teachers. Contact details only when `unlocked` is true.
export function leadView(r, { unlocked = false, unlock } = {}) {
  const ageHours = (Date.now() - new Date(r.createdAt).getTime()) / 36e5;
  const out = {
    id: r._id,
    title: r.title,
    category: r.category,
    categoryName: categoryName(r.category),
    studentClass: r.studentClass,
    subjects: r.subjects,
    mode: r.mode,
    location: r.location,
    learningGoal: r.learningGoal,
    level: r.level,
    schedule: r.schedule,
    budgetMin: r.budgetMin,
    budgetMax: r.budgetMax,
    budgetUnit: r.budgetUnit,
    details: r.details,
    verified: r.verified,
    consent: r.consent,
    status: r.status,
    createdAt: r.createdAt,
    isNew: ageHours < 24,
    unlocked,
    reported: unlock?.reported || false,
  };
  if (unlocked) {
    out.contact = {
      name: r.contactName || r.student?.name,
      phone: r.contactPhone || r.student?.phone,
      email: r.contactEmail || r.student?.email,
      address: r.address || r.location,
    };
  } else {
    out.maskedContact = { phone: maskPhone(r.contactPhone || r.student?.phone), area: r.location };
  }
  return out;
}
