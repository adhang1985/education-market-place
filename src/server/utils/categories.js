// Marketplace categories (wireframe page 9). `slug` is what is stored on teachers and requirements.
export const CATEGORIES = [
  { slug: 'music', name: 'Music Education', short: 'Music', desc: 'Vocal, guitar, piano, tabla', icon: '♪', tone: 'violet' },
  { slug: 'exams', name: 'Competitive Exams', short: 'Exams', desc: 'RAS, UPSC, SSC, Banking, JEE, NEET', icon: '★', tone: 'blue' },
  { slug: 'dance', name: 'Online Dance', short: 'Dance', desc: 'Bollywood, classical, hip-hop', icon: '✦', tone: 'orange' },
  { slug: 'programming', name: 'Programming & Software', short: 'Programming', desc: 'Python, web dev, Java, AI', icon: '</>', tone: 'green' },
  { slug: 'wellness', name: 'Health & Wellness', short: 'Wellness', desc: 'Yoga, meditation, fitness', icon: '+', tone: 'violet' },
  { slug: 'languages', name: 'Language & Culture', short: 'Languages', desc: 'English, French, Hindi, culture', icon: 'Aa', tone: 'blue' },
  { slug: 'school', name: 'School Tutoring', short: 'School', desc: 'Classes 1–12, all boards', icon: 'A+', tone: 'orange' },
  { slug: 'cooking', name: 'Baking & Cooking', short: 'Cooking', desc: 'Baking, Indian cuisine, basics', icon: '◍', tone: 'green' },
  { slug: 'career', name: 'Career Consultations', short: 'Career', desc: 'CV, interviews, career path', icon: '◆', tone: 'violet' },
  { slug: 'astrology', name: 'Learn Astrology', short: 'Astrology', desc: 'Kundli, Vedic astrology, basics', icon: '☾', tone: 'blue' },
  { slug: 'art', name: 'Art & Creativity', short: 'Art', desc: 'Drawing, painting, craft', icon: '✎', tone: 'orange' },
  { slug: 'other', name: 'More Categories', short: 'More', desc: 'Sports, photography, finance & more', icon: '+', tone: 'green' },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
export const categoryName = (slug) => CATEGORIES.find((c) => c.slug === slug)?.name || slug;

export const PRO_PLAN = {
  id: 'pro',
  name: 'Pro Teacher Plan',
  price: 299,
  currency: 'INR',
  period: 'month',
  credits: 10,
  durationDays: 30,
  features: [
    '10 contact unlocks per month',
    'Priority visibility in search results',
    'Access to new leads first',
    'View full student details (phone & address)',
    'Build your profile credibility',
    'Cancel anytime',
  ],
};
