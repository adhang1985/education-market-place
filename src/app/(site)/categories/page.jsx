import Categories from '@/views/Categories';
import { getCategories } from '@/server/data';

// Reads live data from MongoDB on each request (never at build time).
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Explore Learning Categories',
  description: 'Browse tutors and mentors across school tuition, competitive exams, music, dance, coding, languages, wellness, cooking, art and career guidance.',
  alternates: { canonical: '/categories' },
};

export default async function CategoriesPage() {
  return <Categories initialCats={await getCategories()} />;
}
