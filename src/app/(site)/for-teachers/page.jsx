import Subscription from '@/views/Subscription';
import { getPlan } from '@/server/data';

export const metadata = {
  title: 'TutorHub Pro for Teachers – Get More Students',
  description: 'Unlock student contact details, get priority visibility in search and grow your tuition business with TutorHub Pro – ₹299 per month.',
  alternates: { canonical: '/for-teachers' },
};

export default async function ForTeachersPage() {
  return <Subscription initialPlan={await getPlan()} />;
}
