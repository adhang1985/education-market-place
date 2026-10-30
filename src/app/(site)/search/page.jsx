import Search from '@/views/Search';
import { getCategories, getSubjects, searchTeachers } from '@/server/data';

const first = (v) => (Array.isArray(v) ? v[0] : v);
// Only these filters make meaningful landing pages; other combinations would be thin duplicates.
const LANDING_KEYS = ['q', 'category', 'location', 'subject'];

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const q = first(sp.q);
  const location = first(sp.location);
  const categories = (await getCategories()) || [];
  const category = categories.find((c) => c.slug === first(sp.category))?.name;
  const topic = q || first(sp.subject) || category;
  const title = topic ? `${topic} Teachers${location ? ` in ${location}` : ''}` : location ? `Teachers in ${location}` : 'Find Teachers & Tutors';

  const landing = new URLSearchParams();
  LANDING_KEYS.forEach((k) => first(sp[k]) && landing.set(k, first(sp[k])));
  const indexable = Object.keys(sp).every((k) => LANDING_KEYS.includes(k));
  const qs = landing.toString();

  return {
    title,
    description: `Compare verified ${topic ? `${topic} ` : ''}teachers${location ? ` in ${location}` : ''} on TutorHub by ratings, fees, experience and teaching mode – online or home tuition.`,
    alternates: { canonical: `/search${qs ? `?${qs}` : ''}` },
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, first(v)]));
  const [data, subjects, categories] = await Promise.all([
    searchTeachers(params),
    getSubjects(),
    getCategories(),
  ]);
  return <Search initialData={data} initialSubjects={subjects || []} initialCategories={categories || []} />;
}
