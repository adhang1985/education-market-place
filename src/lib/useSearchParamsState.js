'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

// react-router style [searchParams, setSearchParams] on top of Next's read-only useSearchParams.
// Uses history.pushState (which Next syncs with useSearchParams) so filter changes update the URL
// without re-rendering the server page – the view fetches its own data client-side.
export function useSearchParamsState() {
  const sp = useSearchParams();
  const pathname = usePathname();
  const setSp = useCallback(
    (next) => {
      const qs = new URLSearchParams(next).toString();
      window.history.pushState(null, '', qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname]
  );
  return [sp, setSp];
}
