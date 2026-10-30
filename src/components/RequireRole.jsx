'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from './ui';

// Client-side guard: auth lives in localStorage, so this can only be decided in the browser.
// The API enforces roles on every request; this only keeps users out of screens they can't use.
export default function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = user && roles.includes(user.role);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!roles.includes(user.role)) router.replace('/');
  }, [loading, user, roles, router, pathname]);

  return allowed ? children : <div className="page-loading"><Spinner /></div>;
}
