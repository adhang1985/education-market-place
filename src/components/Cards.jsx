'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { Avatar, Badge, FavoriteButton, Rating } from './ui';
import { budget, inr, MODE_SHORT, teacherModes, timeAgo } from '@/lib/utils';

const teacherPlace = (t) => [t.modes.includes('online') && 'Online', t.modes.includes('home') && t.city].filter(Boolean).join(' • ') || t.city;

const COVERS = [
  'linear-gradient(135deg, #6d5bff, #a855f7)',
  'linear-gradient(135deg, #14b8a6, #3b82f6)',
  'linear-gradient(135deg, #ff9a6b, #ff6a88)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #22c55e, #0d9488)',
  'linear-gradient(135deg, #3b82f6, #6d5bff)',
];
const coverFor = (name = '') => COVERS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COVERS.length];

// Compact card – homepage "Featured Teachers".
export function TeacherMiniCard({ t }) {
  return (
    <Link href={`/teachers/${t.id}`} className="card teacher-mini">
      <div className="tm-cover" style={{ background: coverFor(t.name) }}>
        <FavoriteButton teacherId={t.id} />
      </div>
      <div className="tm-body">
        <Avatar name={t.name} src={t.avatar} size={72} />
        <h3>{t.name}{t.verified && <Icon name="shield" size={17} />}</h3>
        <div className="muted small">{t.headline}</div>
        <div className="tm-meta mt-s">
          <Rating value={t.rating} />
          <span><Icon name="clock" size={14} /> {t.experience}+ yrs</span>
          <span><Icon name="pin" size={14} /> {teacherPlace(t)}</span>
        </div>
        <div className="tm-foot">
          <div className="price">{inr(t.rate)}<small>/hr</small></div>
          <span className="view">View profile <Icon name="arrowRight" size={14} /></span>
        </div>
      </div>
    </Link>
  );
}

// Search results row.
export function TeacherRow({ t }) {
  const router = useRouter();
  const classes = t.subjects.find((s) => s.classFrom)?.display;
  return (
    <div className="card teacher-row">
      <Avatar name={t.name} src={t.avatar} size={80} />
      <div className="grow">
        <div className="row-between">
          <div className="row gap-s wrap">
            <Link href={`/teachers/${t.id}`} className="h3-link">{t.name}</Link>
            {t.verified && <Badge tone="green" icon="shield">Verified</Badge>}
            {t.isPro && <Badge tone="violet" icon="crown">Pro</Badge>}
          </div>
          <FavoriteButton teacherId={t.id} />
        </div>
        {t.headline && <div className="muted small">{t.headline}</div>}
        <div className="tm-meta">
          <Rating value={t.rating} count={t.reviewsCount} />
          <span><Icon name="clock" size={14} /> {t.experience} years experience</span>
        </div>
        <div className="tr-subjects">
          {t.subjects.slice(0, 4).map((s) => <span key={s.name}>{s.name}</span>)}
          {classes && <span>{classes}</span>}
        </div>
        <div className="row-between wrap gap-s tr-foot">
          <div>
            <div className="price">{inr(t.rate)}<small>/hr</small></div>
            <div className="muted small"><Icon name="pin" size={13} /> {teacherPlace(t)}</div>
          </div>
          <div className="row gap-s">
            <Link href={`/teachers/${t.id}`} className="btn btn-outline">View Profile</Link>
            <button className="btn btn-primary" onClick={() => router.push(`/post-requirement?teacher=${t.id}&teacherName=${encodeURIComponent(t.name)}&subject=${encodeURIComponent(t.subjects[0]?.name || '')}`)}>
              Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Lead card used on the leads marketplace page.
export function LeadCard({ lead }) {
  return (
    <div className="card lead-card">
      <div className="row-between">
        <span className="chip-soft">{lead.categoryName}</span>
        <div className="row gap-s">
          {lead.isNew && <Badge tone="pink">New</Badge>}
          {lead.verified && <Badge tone="green">Verified</Badge>}
          {lead.unlocked && <Badge tone="violet" icon="unlock">Unlocked</Badge>}
        </div>
      </div>
      <h3>{lead.title}</h3>
      <div className="lead-meta">
        <span><Icon name={lead.mode === 'online' ? 'video' : 'home'} size={14} /> {MODE_SHORT[lead.mode]}</span>
        {lead.schedule && <span><Icon name="calendar" size={14} /> {lead.schedule}</span>}
        {lead.level && <span><Icon name="grad" size={14} /> {lead.level}</span>}
        <span><Icon name="pin" size={14} /> {lead.location}</span>
      </div>
      <div className="row-between wrap gap-s lead-foot">
        <div className="small"><span className="price">{budget(lead)}</span> <span className="muted">• {timeAgo(lead.createdAt)}</span></div>
        <Link href={`/leads/${lead.id}`} className="btn btn-primary btn-sm">{lead.unlocked ? 'View contact' : 'Preview lead'}</Link>
      </div>
    </div>
  );
}

// Row used on teacher dashboard "Recent Leads".
export function LeadRow({ lead }) {
  return (
    <div className="lead-row">
      <div className="lead-row-icon"><Icon name="book" size={20} /></div>
      <div className="grow">
        <div className="row gap-s"><b>{lead.title}</b>{lead.isNew && <Badge tone="pink">New</Badge>}</div>
        <div className="muted small">{lead.location} • {MODE_SHORT[lead.mode]} • Posted {timeAgo(lead.createdAt)}</div>
      </div>
      <Link href={`/leads/${lead.id}`} className="btn btn-primary btn-sm">View</Link>
    </div>
  );
}

export { teacherModes };
