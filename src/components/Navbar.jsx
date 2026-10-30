'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavLink from '@/components/NavLink';
import { useRouter } from 'next/navigation';
import { dashboardPath, useAuth } from '@/context/AuthContext';
import Icon from './Icon';
import { Avatar } from './ui';

export function Logo() {
  return (
    <Link href="/" className="logo">
      <span className="logo-mark"><Icon name="grad" size={20} strokeWidth={2} /></span>
      <span className="logo-text">Tutor<b>Hub</b></span>
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled || open ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <Logo />
        <button className="icon-btn nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
          <Icon name={open ? 'x' : 'menu'} size={22} />
        </button>
        <nav className={`nav-links ${open ? 'open' : ''}`} onClick={close}>
          <NavLink to="/search">Find Teachers</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          <NavLink to="/post-requirement">Post Requirement</NavLink>
          <Link href="/#how">How it Works</Link>
          <NavLink to={user?.role === 'teacher' ? '/leads' : '/for-teachers'}>{user?.role === 'teacher' ? 'Browse Leads' : 'For Teachers'}</NavLink>
          <div className="nav-actions">
            {user ? (
              <>
                <Link href={dashboardPath(user)} className="nav-user">
                  <Avatar name={user.name} size={30} />
                  <span>{user.name.split(' ')[0]}</span>
                </Link>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost">Login</Link>
                <Link href="/signup" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
