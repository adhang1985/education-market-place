import Home from '@/views/Home';
import JsonLd from '@/components/JsonLd';
import { getFeaturedTeachers, getStats } from '@/server/data';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

// Reads live data from MongoDB on each request (never at build time).
export const dynamic = 'force-dynamic';

export const metadata = {
  title: { absolute: `${SITE_NAME} – Find Verified Tutors for Home Tuition & Online Classes` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [featured, stats] = await Promise.all([getFeaturedTeachers(), getStats()]);
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
    },
  ];
  return (
    <>
      <JsonLd data={jsonLd} />
      <Home initialFeatured={featured} initialStats={stats} />
    </>
  );
}
