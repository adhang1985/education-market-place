import 'server-only';
import { cache } from 'react';
import { connectDB } from './db.js';
import * as catalog from './services/catalog.js';
import * as teachers from './services/teachers.js';
import * as leads from './services/leads.js';
import * as subscription from './services/subscription.js';
import { User } from './models/index.js';

// Data for Server Components, read straight from the services (no HTTP round-trip to our own API).
// Results are converted to plain JSON (ObjectIds -> strings, Dates -> ISO strings), exactly what the
// browser gets from /api, so they can be passed to Client Components. Anonymous: personalised data
// (favourites, unlock state) is loaded in the browser. Returns null if the database is unavailable,
// and the page falls back to fetching on the client.
const load = (fn) =>
  cache(async (...args) => {
    try {
      await connectDB();
      const data = await fn(...args);
      return JSON.parse(JSON.stringify(data));
    } catch (e) {
      if (e.status !== 404) console.error('Server data load failed:', e.message);
      return null;
    }
  });

export const getCategories = load(() => catalog.categories());
export const getStats = load(() => catalog.stats());
export const getFeaturedTeachers = load(() => teachers.featured());
export const getSubjects = load(() => teachers.subjects());
export const searchTeachers = load((query) => teachers.search({ query }));
// track: false – server renders must not count as profile views; the browser records the view.
export const getTeacher = load((id) => teachers.profile({ user: null, params: { id }, track: false }));
export const getLeads = load((query) => leads.list({ user: null, query }));
export const getLead = load((id) => leads.detail({ user: null, params: { id } }));
// The plan is a constant – no database needed, so /for-teachers can stay a static page.
export const getPlan = () => subscription.plan();
export const getSitemapTeachers = load(() => User.find({ role: 'teacher', 'teacher.status': 'approved' }).select('_id updatedAt').lean());
