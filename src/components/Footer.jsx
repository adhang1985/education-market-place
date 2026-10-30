'use client';

import Link from 'next/link';
import { Logo } from './Navbar';
import Icon from './Icon';

const SOCIALS = [['twitter', 'X'], ['instagram', 'Instagram'], ['linkedin', 'LinkedIn'], ['youtube', 'YouTube']];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Logo />
          <p>India’s friendly learning marketplace. Find verified teachers for school, exams, music, coding and everything in between.</p>
          <div className="socials">
            {SOCIALS.map(([icon, label]) => (
              <a key={icon} href="#" aria-label={label} onClick={(e) => e.preventDefault()}><Icon name={icon} size={17} /></a>
            ))}
          </div>
        </div>
        <div className="footer-links">
          <div>
            <h4>Students</h4>
            <Link href="/search">Find Teachers</Link>
            <Link href="/categories">Browse Categories</Link>
            <Link href="/post-requirement">Post a Requirement</Link>
            <Link href="/signup">Create Account</Link>
          </div>
          <div>
            <h4>Teachers</h4>
            <Link href="/signup?role=teacher">Join as Teacher</Link>
            <Link href="/leads">Browse Leads</Link>
            <Link href="/for-teachers">TutorHub Pro</Link>
            <Link href="/login">Teacher Login</Link>
          </div>
          <div>
            <h4>Explore</h4>
            <Link href="/#how">How it Works</Link>
            <Link href="/search?category=school">School Tuition</Link>
            <Link href="/search?category=exams">Competitive Exams</Link>
            <Link href="/search?category=programming">Coding Classes</Link>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} TutorHub. All rights reserved.</span>
        <span><Icon name="shield" size={14} /> Student contact details stay private until consent and unlock.</span>
      </div>
    </footer>
  );
}
