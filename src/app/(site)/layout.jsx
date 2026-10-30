import Footer from '@/components/Footer';

// Public marketing pages get the footer; dashboards (the (dashboard) group) don't.
export default function SiteLayout({ children }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
