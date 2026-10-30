'use client';

import NavLink from '@/components/NavLink';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Icon from './Icon';
import { Avatar } from './ui';

// items: [{ to, label, icon, badge, end }]
export default function DashboardLayout({ items, subtitle, children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  return (
    <div className="dash">
      <aside className="dash-side">
        <div className="dash-user">
          <Avatar name={user.name} size={44} />
          <div>
            <b>{user.name}</b>
            <div className="muted small">{subtitle}</div>
          </div>
        </div>
        <nav>
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className="dash-link">
              <Icon name={it.icon} size={19} />
              <span className="grow">{it.label}</span>
              {it.badge ? <span className="count-badge">{it.badge}</span> : null}
            </NavLink>
          ))}
        </nav>
        <button
          className="dash-link logout"
          onClick={() => {
            logout();
            router.push('/');
          }}
        >
          <Icon name="logout" size={19} /> <span>Logout</span>
        </button>
      </aside>
      <section className="dash-main">{children}</section>
    </div>
  );
}
