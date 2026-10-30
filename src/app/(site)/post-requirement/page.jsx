import PostRequirementClient from './PostRequirementClient';

export const metadata = {
  title: 'Post a Learning Requirement – Get Matched with Teachers',
  description: 'Tell us what you want to learn and get contacted by verified teachers near you or online. Free for students and parents.',
  alternates: { canonical: '/post-requirement' },
};

export default function PostRequirementPage() {
  return <PostRequirementClient />;
}
