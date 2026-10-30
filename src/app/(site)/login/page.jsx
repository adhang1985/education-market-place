import { Login } from '@/views/Auth';

export const metadata = { title: 'Log in', robots: { index: false, follow: true } };

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  // Only allow same-site relative redirects after login.
  const safeNext = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : null;
  return <Login next={safeNext} />;
}
