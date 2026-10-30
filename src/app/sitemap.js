import { getCategories, getSitemapTeachers } from '@/server/data';
import { SITE_URL } from '@/lib/site';

// Rendered on request (it reads the database), so builds don't need a running MongoDB.
export const dynamic = 'force-dynamic';

// Static pages + one URL per category search + every approved teacher profile.
export default async function sitemap() {
  const now = new Date();
  const staticPages = ['', '/search', '/categories', '/leads', '/for-teachers', '/post-requirement'].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: p === '' ? 'daily' : 'weekly',
    priority: p === '' ? 1 : 0.8,
  }));

  const categoryPages = ((await getCategories()) || [])
    .filter((c) => c.slug !== 'other')
    .map((c) => ({ url: `${SITE_URL}/search?category=${c.slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.7 }));

  const teacherPages = ((await getSitemapTeachers()) || []).map((t) => ({
    url: `${SITE_URL}/teachers/${t._id}`,
    lastModified: t.updatedAt ? new Date(t.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...teacherPages];
}
