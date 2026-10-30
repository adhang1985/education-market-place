import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Requirement, Unlock, Review, ProfileView, Payment } from './models/index.js';

const DAY = 864e5;
const HOUR = 36e5;
const ago = (ms) => new Date(Date.now() - ms);

// Deterministic pseudo-random so every seed looks the same.
let s = 42;
const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const sub = (name, classFrom, classTo, label) => ({ name, classFrom, classTo, label });

const TEACHERS = [
  {
    name: 'Priya Sharma', email: 'priya@tutorhub.com', featured: true, pro: { credits: 8 },
    headline: 'Maths, Science', categories: ['school'], experience: 5, rate: 500, city: 'Delhi', modes: ['online', 'home'],
    subjects: [sub('Mathematics', 6, 10), sub('Science', 6, 10), sub('Physics', 11, 12), sub('Chemistry', 11, 12)],
    qualification: 'B.Tech (IIT Delhi)', teachingSince: 2019, languages: ['English', 'Hindi'], rating: 4.8, reviewsCount: 120,
    bio: 'I am a passionate and patient teacher with 5+ years of experience in teaching Mathematics and Science to school students. I focus on concept clarity, regular practice and building confidence in students.',
  },
  {
    name: 'Rahul Verma', email: 'rahul@tutorhub.com', featured: true, pro: { credits: 6 },
    headline: 'Physics, JEE', categories: ['school', 'exams'], experience: 8, rate: 700, city: 'Delhi', modes: ['home'],
    subjects: [sub('Physics', 11, 12), sub('Chemistry', 11, 12), sub('JEE', null, null, 'JEE Main & Advanced')],
    qualification: 'M.Sc Physics (DU)', teachingSince: 2016, languages: ['English', 'Hindi'], rating: 4.9, reviewsCount: 210,
    bio: 'JEE mentor with 8 years of experience. I break down tough Physics problems into simple steps and run weekly mock tests.',
  },
  {
    name: 'Sneha Kapoor', email: 'sneha@tutorhub.com', featured: true,
    headline: 'English, Spoken English', categories: ['languages', 'school'], experience: 4, rate: 400, city: 'Delhi', modes: ['online'],
    subjects: [sub('English', 6, 12), sub('Spoken English', null, null, 'All levels')],
    qualification: 'MA English (JNU)', teachingSince: 2020, languages: ['English', 'Hindi'], rating: 4.7, reviewsCount: 88,
    bio: 'Communication coach helping students and professionals speak English fluently and confidently.',
  },
  {
    name: 'Amit Kumar', email: 'amit@tutorhub.com', pro: { credits: 10 },
    headline: 'Computer Science, Python', categories: ['programming', 'school'], experience: 8, rate: 600, city: 'Jaipur', modes: ['online'],
    subjects: [sub('Computer Science', 9, 12), sub('Python', null, null, 'Beginner – Advanced'), sub('SQL', null, null, 'Beginner – Intermediate')],
    qualification: 'MCA (NIT Jaipur)', teachingSince: 2016, languages: ['English', 'Hindi'], rating: 4.6, reviewsCount: 76,
    bio: 'Software engineer turned educator. Hands-on Python, SQL and interview preparation with real projects.',
  },
  {
    name: 'Kavita Rathore', email: 'kavita@tutorhub.com', pro: { credits: 9 },
    headline: 'RAS, Rajasthan GK', categories: ['exams'], experience: 10, rate: 800, city: 'Jaipur', modes: ['online', 'home'],
    subjects: [sub('RAS', null, null, 'Prelims & Mains'), sub('Rajasthan GK', null, null, 'All levels'), sub('UPSC', null, null, 'Prelims')],
    qualification: 'MA History (University of Rajasthan)', teachingSince: 2014, languages: ['Hindi', 'English'], rating: 4.8, reviewsCount: 142,
    bio: 'Mentored 300+ RAS aspirants with structured notes, daily quizzes and full-length test series.',
  },
  {
    name: 'Arjun Mehta', email: 'arjun@tutorhub.com',
    headline: 'Guitar, Keyboard', categories: ['music'], experience: 7, rate: 600, city: 'Mumbai', modes: ['online', 'home'],
    subjects: [sub('Guitar', null, null, 'Beginner – Advanced'), sub('Keyboard', null, null, 'Beginner – Intermediate')],
    qualification: 'Trinity Grade 8 (Guitar)', teachingSince: 2017, languages: ['English', 'Hindi'], rating: 4.7, reviewsCount: 64,
    bio: 'Fun, song-based music lessons for kids and adults. Learn chords, strumming and your favourite songs from day one.',
  },
  {
    name: 'Riya Desai', email: 'riya@tutorhub.com',
    headline: 'Bollywood, Kathak', categories: ['dance', 'wellness'], experience: 5, rate: 450, city: 'Pune', modes: ['online'],
    subjects: [sub('Bollywood Dance', null, null, 'All levels'), sub('Kathak', null, null, 'Beginner')],
    qualification: 'Visharad in Kathak', teachingSince: 2019, languages: ['English', 'Hindi', 'Marathi'], rating: 4.6, reviewsCount: 41,
    bio: 'High-energy dance classes that double as a workout. Choreography for weddings and events too.',
  },
  {
    name: 'Ananya Iyer', email: 'ananya@tutorhub.com',
    headline: 'Yoga, Meditation', categories: ['wellness'], experience: 9, rate: 400, city: 'Bengaluru', modes: ['online'],
    subjects: [sub('Yoga', null, null, 'All levels'), sub('Meditation', null, null, 'All levels')],
    qualification: 'RYT-500 Certified', teachingSince: 2015, languages: ['English', 'Tamil'], rating: 4.9, reviewsCount: 97,
    bio: 'Gentle, alignment-focused yoga and breathwork for beginners and busy professionals.',
  },
  {
    name: 'Farhan Ali', email: 'farhan@tutorhub.com',
    headline: 'Baking, Indian cuisine', categories: ['cooking'], experience: 6, rate: 900, city: 'Jaipur', modes: ['online', 'home'],
    subjects: [sub('Baking', null, null, 'Beginner – Intermediate'), sub('Indian Cuisine', null, null, 'All levels')],
    qualification: 'Diploma in Culinary Arts (IHM)', teachingSince: 2018, languages: ['Hindi', 'English', 'Urdu'], rating: 4.5, reviewsCount: 33,
    bio: 'Professional pastry chef teaching cakes, breads and everyday Indian cooking with simple home equipment.',
  },
  {
    name: 'Meera Joshi', email: 'meera@tutorhub.com', pro: { credits: 7 },
    headline: 'Career coaching, Interviews', categories: ['career'], experience: 12, rate: 1500, city: 'Gurugram', modes: ['online'],
    subjects: [sub('Resume Review', null, null, 'Professionals'), sub('Mock Interviews', null, null, 'Professionals')],
    qualification: 'MBA (IIM Indore), ex-HR Lead', teachingSince: 2012, languages: ['English', 'Hindi'], rating: 4.8, reviewsCount: 58,
    bio: 'Former HR lead. I help you craft a sharp CV, nail interviews and plan your next career move.',
  },
  {
    name: 'Vivek Shastri', email: 'vivek@tutorhub.com',
    headline: 'Vedic Astrology', categories: ['astrology'], experience: 15, rate: 700, city: 'Varanasi', modes: ['online'],
    subjects: [sub('Vedic Astrology', null, null, 'Beginner – Advanced'), sub('Kundli Reading', null, null, 'Beginner')],
    qualification: 'Jyotish Acharya (BHU)', teachingSince: 2009, languages: ['Hindi', 'Sanskrit', 'English'], rating: 4.6, reviewsCount: 29,
    bio: 'Structured courses on Vedic astrology fundamentals, chart reading and planetary periods.',
  },
  {
    name: 'Ishita Banerjee', email: 'ishita@tutorhub.com',
    headline: 'Drawing, Painting', categories: ['art'], experience: 6, rate: 500, city: 'Kolkata', modes: ['online', 'home'],
    subjects: [sub('Drawing', null, null, 'Kids & Adults'), sub('Painting', null, null, 'All levels')],
    qualification: 'BFA (Rabindra Bharati University)', teachingSince: 2018, languages: ['English', 'Bengali', 'Hindi'], rating: 4.7, reviewsCount: 45,
    bio: 'Sketching, watercolour and acrylics for all ages – build a portfolio at your own pace.',
  },
  {
    name: 'Rohan Mehta', email: 'rohan@tutorhub.com', status: 'pending', createdHoursAgo: 5,
    headline: 'Mathematics', categories: ['school'], experience: 3, rate: 450, city: 'Delhi', modes: ['home'],
    subjects: [sub('Mathematics', 8, 12)], qualification: 'B.Sc Mathematics', teachingSince: 2021, languages: ['Hindi', 'English'],
    bio: 'Maths tutor focused on CBSE board preparation.',
  },
  {
    name: 'Vikram Singh', email: 'vikram@tutorhub.com', status: 'pending', createdHoursAgo: 26,
    headline: 'Hindi, Sanskrit', categories: ['languages', 'school'], experience: 2, rate: 300, city: 'Jaipur', modes: ['online', 'home'],
    subjects: [sub('Hindi', 1, 10), sub('Sanskrit', 6, 10)], qualification: 'MA Hindi', teachingSince: 2022, languages: ['Hindi'],
    bio: 'Making Hindi grammar and literature easy for school students.',
  },
];

const STUDENTS = [
  ['Neha Singh', 'neha@tutorhub.com', '+91 9876543210'],
  ['Karan Malhotra', 'karan@tutorhub.com', '+91 9812345678'],
  ['Aisha Khan', 'aisha@tutorhub.com', '+91 9898989898'],
  ['Dev Patel', 'dev@tutorhub.com', '+91 9822001122'],
  ['Pooja Gupta', 'pooja@tutorhub.com', '+91 9811223344'],
];

const REQUIREMENTS = [
  { s: 0, category: 'school', title: 'Class 8 - Mathematics', studentClass: '8', subjects: ['Mathematics'], mode: 'home', location: 'South Delhi', address: 'B-24, Saket, South Delhi, New Delhi', budgetMin: 400, budgetMax: 600, budgetUnit: 'hour', schedule: 'Weekdays, 5–7 pm', level: 'CBSE', learningGoal: 'Improve school test scores', details: 'Looking for a experienced Maths teacher for my son. Need help with regular school syllabus and tests.', hoursAgo: 2, verified: true },
  { s: 1, category: 'school', title: 'Class 11 - Physics', studentClass: '11', subjects: ['Physics'], mode: 'online', location: 'Online', budgetMin: 600, budgetMax: 800, budgetUnit: 'hour', schedule: '3 days/week', level: 'CBSE', learningGoal: 'Strong foundation for JEE', details: 'Need conceptual clarity in mechanics and help with numericals.', hoursAgo: 5 },
  { s: 2, category: 'school', title: 'Class 6 - Science', studentClass: '6', subjects: ['Science'], mode: 'home', location: 'West Delhi', address: 'Janakpuri, West Delhi', budgetMin: 300, budgetMax: 500, budgetUnit: 'hour', schedule: 'Weekends', details: 'Homework help and exam preparation for my daughter.', hoursAgo: 26 },
  { s: 3, category: 'school', title: 'Class 10 - Mathematics', studentClass: '10', subjects: ['Mathematics'], mode: 'online', location: 'Online', budgetMin: 500, budgetMax: 700, budgetUnit: 'hour', schedule: 'Daily, 1 hour', level: 'ICSE', details: 'Board exam preparation with sample papers.', hoursAgo: 50 },
  { s: 4, category: 'programming', title: 'Python + SQL coaching for job switch', studentClass: 'Adult / Professional', subjects: ['Python', 'SQL'], mode: 'online', location: 'Jaipur (online preferred)', learningGoal: 'Build practical Python and SQL skills for interviews', level: 'Beginner to intermediate', schedule: 'Weekday evenings, 2–3 sessions per week', budgetMin: 500, budgetMax: 800, budgetUnit: 'session', details: 'Looking for a structured plan with assignments and mock interviews.', hoursAgo: 3 },
  { s: 0, category: 'exams', title: 'RAS Prelims: Rajasthan GK + test series', studentClass: 'Adult / Professional', subjects: ['RAS', 'Rajasthan GK'], mode: 'online', location: 'Jaipur / Online', schedule: '4 days/week', budgetMin: 3000, budgetMax: 5000, budgetUnit: 'month', learningGoal: 'Clear RAS Prelims this year', details: 'Need weekly tests and doubt sessions.', hoursAgo: 8 },
  { s: 1, category: 'school', title: 'Class 10 Maths & Science, CBSE', studentClass: '10', subjects: ['Mathematics', 'Science'], mode: 'home', location: 'Vaishali Nagar, Jaipur', address: 'Vaishali Nagar, Jaipur', schedule: 'Offline preferred • 3 days/week', budgetMin: 400, budgetMax: 600, budgetUnit: 'hour', verified: true, hoursAgo: 12 },
  { s: 2, category: 'music', title: 'Beginner guitar lessons for adult', studentClass: 'Adult / Professional', subjects: ['Guitar'], mode: 'online', location: 'Online', schedule: 'Weekend evenings', level: 'Beginner', budgetMin: 500, budgetMax: 700, budgetUnit: 'class', hoursAgo: 20 },
  { s: 3, category: 'dance', title: 'Bollywood dance for fitness', studentClass: 'Adult / Professional', subjects: ['Bollywood Dance'], mode: 'online', location: 'Online', schedule: '2 sessions/week', budgetMin: 300, budgetMax: 500, budgetUnit: 'class', hoursAgo: 30 },
  { s: 4, category: 'languages', title: 'Spoken English for interviews', studentClass: 'Adult / Professional', subjects: ['Spoken English'], mode: 'online', location: 'Jaipur / Online', schedule: 'Flexible timings', budgetMin: 400, budgetMax: 700, budgetUnit: 'session', verified: true, hoursAgo: 36 },
  { s: 0, category: 'wellness', title: 'Yoga instructor for beginner routine', studentClass: 'Adult / Professional', subjects: ['Yoga'], mode: 'online', location: 'Online', schedule: 'Morning sessions', level: 'Beginner', budgetMin: 300, budgetMax: 500, budgetUnit: 'class', hoursAgo: 44 },
  { s: 1, category: 'cooking', title: 'Weekend cake-baking basics', studentClass: 'Adult / Professional', subjects: ['Baking'], mode: 'either', location: 'Jaipur', address: 'C-Scheme, Jaipur', schedule: 'Weekend', budgetMin: 800, budgetMax: 1500, budgetUnit: 'class', hoursAgo: 60 },
  { s: 2, category: 'career', title: 'Resume review + mock interview', studentClass: 'Adult / Professional', subjects: ['Resume Review', 'Mock Interviews'], mode: 'online', location: 'Online', schedule: 'One-time consultation', budgetMin: 1000, budgetMax: 2000, budgetUnit: 'consult', verified: true, hoursAgo: 72 },
  { s: 3, category: 'astrology', title: 'Vedic astrology fundamentals', studentClass: 'Adult / Professional', subjects: ['Vedic Astrology'], mode: 'online', location: 'Online', schedule: 'Weekly sessions', budgetMin: 500, budgetMax: 900, budgetUnit: 'class', hoursAgo: 90 },
];

const COMMENTS = [
  'Explains concepts very clearly. My marks improved a lot!',
  'Very patient and punctual. Highly recommended.',
  'Great teaching style, classes are engaging.',
  'Helped me prepare thoroughly. Thank you!',
  'Good teacher, structured lessons and regular practice.',
];

const FIRST = ['Aarav', 'Vihaan', 'Ishaan', 'Saanvi', 'Diya', 'Kabir', 'Myra', 'Anika', 'Reyansh', 'Tara', 'Arnav', 'Kiara', 'Yash', 'Zara', 'Rudra'];
const LAST = ['Sharma', 'Gupta', 'Nair', 'Reddy', 'Jain', 'Bose', 'Chopra', 'Agarwal', 'Pillai', 'Saxena'];

export async function seed({ reset = true } = {}) {
  if (reset) await Promise.all([User, Requirement, Unlock, Review, ProfileView, Payment].map((m) => m.deleteMany({})));
  s = 42;
  const hash = (p) => bcrypt.hashSync(p, 10);
  const pw = { admin: hash('admin123'), teacher: hash('teacher123'), student: hash('student123') };

  // Build docs via the model (defaults/validation) then insert raw so we can backdate createdAt.
  const users = [];
  const add = (data, createdAt) => {
    const doc = new User(data).toObject();
    doc.createdAt = doc.updatedAt = createdAt;
    users.push(doc);
    return doc;
  };

  add({ name: 'Admin', email: 'admin@tutorhub.com', password: pw.admin, role: 'admin' }, ago(200 * DAY));

  const teachers = TEACHERS.map((t, i) => {
    const { name, email, pro, featured, status = 'approved', createdHoursAgo, ...profile } = t;
    return add(
      {
        name, email, password: pw.teacher, role: 'teacher', phone: `+91 99${String(10000000 + i * 1234567).slice(0, 8)}`,
        teacher: { ...profile, status, featured: !!featured, available: true },
        subscription: pro
          ? { plan: 'pro', validUntil: new Date(Date.now() + (12 + i) * DAY), credits: pro.credits, creditsTotal: 10 }
          : { plan: 'free', credits: 0 },
      },
      createdHoursAgo ? ago(createdHoursAgo * HOUR) : ago((170 - i * 9) * DAY)
    );
  });

  const students = STUDENTS.map(([name, email, phone], i) => add({ name, email, phone, password: pw.student, role: 'student' }, ago((3 + i * 20) * HOUR)));

  // Filler accounts so admin growth charts have shape (spread over ~6 months, accelerating).
  for (let i = 0; i < 60; i++) {
    const days = Math.floor(175 * Math.pow(rand(), 0.7));
    add({ name: `${pick(FIRST)} ${pick(LAST)}`, email: `student${i + 1}@example.com`, password: pw.student, role: 'student' }, ago(days * DAY + 10 * HOUR));
  }
  for (let i = 0; i < 24; i++) {
    const days = Math.floor(175 * Math.pow(rand(), 0.8));
    const subj = pick([['Mathematics', 'school'], ['Physics', 'school'], ['English', 'languages'], ['Python', 'programming'], ['Guitar', 'music'], ['Yoga', 'wellness']]);
    add(
      {
        name: `${pick(FIRST)} ${pick(LAST)}`, email: `teacher${i + 1}@example.com`, password: pw.teacher, role: 'teacher',
        teacher: {
          headline: subj[0], categories: [subj[1]], subjects: [subj[1] === 'school' ? sub(subj[0], 6, 12) : sub(subj[0], null, null, 'All levels')],
          experience: 1 + Math.floor(rand() * 12), rate: 300 + Math.floor(rand() * 8) * 50, city: pick(['Delhi', 'Jaipur', 'Mumbai', 'Pune', 'Bengaluru']),
          modes: rand() > 0.5 ? ['online', 'home'] : ['online'], status: 'approved', rating: 3.6 + Math.round(rand() * 13) / 10,
          reviewsCount: 5 + Math.floor(rand() * 60), languages: ['English', 'Hindi'], teachingSince: 2024 - Math.floor(rand() * 10),
          bio: `Experienced ${subj[0]} tutor focused on fundamentals and regular practice.`,
        },
        subscription: { plan: 'free', credits: 0 },
      },
      ago(days * DAY + 6 * HOUR)
    );
  }
  await User.collection.insertMany(users);

  const reqs = REQUIREMENTS.map(({ s: si, hoursAgo, ...r }) => {
    const st = students[si];
    const doc = new Requirement({ ...r, student: st._id, contactName: st.name, contactPhone: st.phone, contactEmail: st.email, consent: true }).toObject();
    doc.createdAt = doc.updatedAt = ago(hoursAgo * HOUR);
    return doc;
  });
  await Requirement.collection.insertMany(reqs);

  // Priya has already unlocked two leads (10 credits - 2 = 8 remaining).
  const priya = teachers[0];
  await Unlock.insertMany([
    { teacher: priya._id, requirement: reqs[2]._id },
    { teacher: priya._id, requirement: reqs[3]._id },
  ]);

  // A few written reviews per featured teacher (aggregate counts are seeded on the profile).
  const reviews = [];
  teachers.slice(0, 12).forEach((t, ti) =>
    students.slice(0, 3).forEach((st, si) =>
      reviews.push({ teacher: t._id, student: st._id, rating: si === 2 && ti % 3 === 0 ? 4 : 5, comment: COMMENTS[(ti + si) % COMMENTS.length], createdAt: ago((5 + ti + si * 7) * DAY) })
    )
  );
  await Review.collection.insertMany(reviews.map((r) => ({ ...r, updatedAt: r.createdAt })));

  // Profile views over 60 days (upward trend) for approved named teachers.
  const views = [];
  teachers.slice(0, 12).forEach((t, ti) => {
    for (let d = 59; d >= 0; d--) {
      const n = Math.max(0, Math.round((ti === 0 ? 1.1 : 0.6) + (60 - d) / 40 + (rand() - 0.5) * 2));
      for (let k = 0; k < n; k++) views.push({ _id: new mongoose.Types.ObjectId(), teacher: t._id, createdAt: ago(d * DAY + rand() * 20 * HOUR) });
    }
  });
  await ProfileView.collection.insertMany(views);

  // Payments: Pro teachers have paid ₹299 monthly for several months.
  const payments = [];
  teachers.forEach((t, ti) => {
    if (TEACHERS[ti].pro) {
      for (let m = 0; m < 6 - (ti % 3); m++) payments.push({ teacher: t._id, plan: 'pro', amount: 299, reference: `SEED-${ti}-${m}`, createdAt: ago((m * 30 + 18 - ti) * DAY) });
    }
  });
  await Payment.collection.insertMany(payments.map((p) => ({ ...p, updatedAt: p.createdAt })));

  return { users: users.length, requirements: reqs.length, reviews: reviews.length, views: views.length, payments: payments.length };
}
