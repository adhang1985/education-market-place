import { Signup } from '@/views/Auth';

export const metadata = {
  title: 'Create your free account',
  description: 'Join TutorHub as a student to find verified teachers, or as a teacher to receive new tuition leads.',
  alternates: { canonical: '/signup' },
};

export default async function SignupPage({ searchParams }) {
  const { role } = await searchParams;
  return <Signup initialRole={role === 'teacher' ? 'teacher' : 'student'} />;
}
