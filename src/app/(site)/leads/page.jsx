import Leads from '@/views/Leads';
import { getCategories, getLeads } from '@/server/data';

export const metadata = {
  title: 'Student Learning Requests – Tuition Leads for Teachers',
  description: 'Browse fresh tuition and class requests from students and parents. Preview the goal, budget, schedule and area before you unlock a contact.',
  alternates: { canonical: '/leads' },
};

export default async function LeadsPage({ searchParams }) {
  const category = (await searchParams).category || 'all';
  const [data, cats] = await Promise.all([
    getLeads({ category, limit: 50 }),
    getCategories(),
  ]);
  return <Leads initialData={data} initialCategory={category} initialCats={cats || []} />;
}
