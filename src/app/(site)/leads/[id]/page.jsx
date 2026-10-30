import LeadDetail from '@/views/LeadDetail';
import { getLead } from '@/server/data';
import { budget } from '@/lib/utils';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) return { title: 'Learning request', robots: { index: false } };
  // Leads close and expire quickly, so they're crawlable for discovery but kept out of the index.
  const where = /^online$/i.test(lead.location) ? 'online' : `in ${lead.location}`;
  return {
    title: `${lead.title} – ${lead.location}`,
    description: `${lead.categoryName} request ${where}. ${budget(lead)}. Preview the details and connect with the student on TutorHub.`,
    alternates: { canonical: `/leads/${id}` },
    robots: { index: false, follow: true },
  };
}

export default async function LeadPage({ params }) {
  const { id } = await params;
  return <LeadDetail initial={await getLead(id)} />;
}
