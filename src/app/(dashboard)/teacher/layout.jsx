import RequireRole from '@/components/RequireRole';
import TeacherDashboard from '@/views/teacher/TeacherDashboard';

export const metadata = { title: { default: 'Teacher Dashboard', template: '%s – Teacher Dashboard | TutorHub' } };

export default function Layout({ children }) {
  return (
    <RequireRole roles={['teacher']}>
      <TeacherDashboard>{children}</TeacherDashboard>
    </RequireRole>
  );
}
