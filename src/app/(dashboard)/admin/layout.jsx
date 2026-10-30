import RequireRole from '@/components/RequireRole';
import AdminDashboard from '@/views/admin/AdminDashboard';

export const metadata = { title: { default: 'Admin', template: '%s – Admin | TutorHub' } };

export default function Layout({ children }) {
  return (
    <RequireRole roles={['admin']}>
      <AdminDashboard>{children}</AdminDashboard>
    </RequireRole>
  );
}
