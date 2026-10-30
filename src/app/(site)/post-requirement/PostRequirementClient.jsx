'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui';

// The form restores a draft from sessionStorage when it first renders, so it only renders in the browser.
const PostRequirement = dynamic(() => import('@/views/PostRequirement'), { ssr: false, loading: () => <div className="container page"><Spinner /></div> });

export default function PostRequirementClient() {
  return <PostRequirement />;
}
