import RequireRole from '@/components/RequireRole';
import StudentDashboard from '@/views/StudentDashboard';

export const metadata = { title: { default: 'My Account', template: '%s – My Account | TutorHub' } };

export default function Layout({ children }) {
  return (
    <RequireRole roles={['student']}>
      <StudentDashboard>{children}</StudentDashboard>
    </RequireRole>
  );
}
