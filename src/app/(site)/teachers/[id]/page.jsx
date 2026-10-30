import TeacherProfile from '@/views/TeacherProfile';
import JsonLd from '@/components/JsonLd';
import { getTeacher } from '@/server/data';
import { SITE_URL } from '@/lib/site';

const subjectsOf = (t) => t.subjects.map((s) => s.name).slice(0, 3).join(', ');

export async function generateMetadata({ params }) {
  const { id } = await params;
  const t = await getTeacher(id);
  // Pending/rejected or missing profiles aren't public: the client view handles owners/admins.
  if (!t) return { title: 'Teacher profile', robots: { index: false } };

  const title = `${t.name} – ${subjectsOf(t) || t.headline} Tutor in ${t.city}`;
  const description =
    `${t.name} teaches ${subjectsOf(t) || t.headline} in ${t.city}${t.modes.includes('online') ? ' and online' : ''}. ` +
    `${t.experience}+ years experience, rated ${t.rating}/5 by ${t.reviewsCount} students. ₹${t.rate}/hour.`;
  return {
    title,
    description,
    alternates: { canonical: `/teachers/${id}` },
    openGraph: { type: 'profile', title, description, url: `/teachers/${id}`, images: t.avatar ? [{ url: t.avatar }] : undefined },
    twitter: { card: t.avatar ? 'summary_large_image' : 'summary', title, description },
  };
}

export default async function TeacherPage({ params }) {
  const { id } = await params;
  const t = await getTeacher(id);
  const url = `${SITE_URL}/teachers/${id}`;
  const jsonLd = t && [
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': url,
      name: t.name,
      url,
      image: t.avatar || undefined,
      jobTitle: t.headline || 'Teacher',
      description: t.bio || undefined,
      knowsAbout: t.subjects.map((s) => s.name),
      knowsLanguage: t.languages.length ? t.languages : undefined,
      hasCredential: t.qualification ? { '@type': 'EducationalOccupationalCredential', name: t.qualification } : undefined,
      address: { '@type': 'PostalAddress', addressLocality: t.city, addressCountry: 'IN' },
      makesOffer: {
        '@type': 'Offer',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: t.rate, priceCurrency: 'INR', unitText: 'hour' },
        itemOffered: {
          '@type': 'Service',
          name: `${subjectsOf(t) || t.headline} tuition`,
          provider: { '@id': url },
          areaServed: t.modes.includes('home') ? t.city : undefined,
          ...(t.reviewsCount > 0 && { aggregateRating: { '@type': 'AggregateRating', ratingValue: t.rating, reviewCount: t.reviewsCount, bestRating: 5 } }),
        },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Teachers', item: `${SITE_URL}/search` },
        { '@type': 'ListItem', position: 3, name: t.name, item: url },
      ],
    },
  ];
  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <TeacherProfile initial={t} />
    </>
  );
}
