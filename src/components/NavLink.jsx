'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Link that gets an `active` class when its route is open (`end` = exact match only).
export default function NavLink({ to, end, className = '', children, ...rest }) {
  const pathname = usePathname();
  const path = to.split('?')[0];
  const active = end ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  return (
    <Link href={to} className={`${className} ${active ? 'active' : ''}`.trim()} aria-current={active ? 'page' : undefined} {...rest}>
      {children}
    </Link>
  );
}
