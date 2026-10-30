// Private dashboards: no footer, never indexed.
export const metadata = { robots: { index: false, follow: false } };

export default function DashboardGroupLayout({ children }) {
  return children;
}
