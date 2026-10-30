export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export function timeAgo(date) {
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)} min ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)} hour${Math.floor(h) === 1 ? '' : 's'} ago`;
  const d = h / 24;
  if (d < 30) return `${Math.floor(d)} day${Math.floor(d) === 1 ? '' : 's'} ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const UNIT_LABEL = { hour: 'hour', session: 'session', class: 'class', month: 'month', consult: 'consult' };

export function budget(lead) {
  if (!lead.budgetMin && !lead.budgetMax) return 'Budget flexible';
  const unit = UNIT_LABEL[lead.budgetUnit] || 'hour';
  if (lead.budgetMin && lead.budgetMax) return `${inr(lead.budgetMin)}–${inr(lead.budgetMax).slice(1)} / ${unit}`;
  return `${inr(lead.budgetMin || lead.budgetMax)} / ${unit}`;
}

export const MODE_LABEL = { home: "At Student's Home", online: 'Online', either: 'Online or at home' };
export const MODE_SHORT = { home: 'At home', online: 'Online', either: 'Online / Home' };

export const teacherModes = (modes = []) =>
  modes.map((m) => (m === 'online' ? 'Online' : 'Home tuition')).join(' • ');

export const CLASS_OPTIONS = [...Array.from({ length: 12 }, (_, i) => String(i + 1)), 'College', 'Adult / Professional'];
export const classLabel = (c) => (/^\d+$/.test(c) ? `Class ${c}` : c);

export const SUBJECT_SUGGESTIONS = [
  'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Sanskrit', 'Social Science', 'Computer Science',
  'Accountancy', 'Economics', 'JEE', 'NEET', 'UPSC', 'RAS', 'SSC', 'Banking', 'Spoken English', 'French', 'Python', 'SQL', 'Web Development',
  'Java', 'Guitar', 'Keyboard', 'Vocal', 'Tabla', 'Bollywood Dance', 'Kathak', 'Yoga', 'Meditation', 'Baking', 'Indian Cuisine',
  'Resume Review', 'Mock Interviews', 'Vedic Astrology', 'Drawing', 'Painting',
];
