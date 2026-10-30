import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-jakarta', display: 'swap' });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} – Find the Right Teacher for Every Learning Goal`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['home tuition', 'online tutor', 'private teacher', 'JEE coaching', 'NEET coaching', 'music classes', 'coding classes', 'India'],
  openGraph: { type: 'website', siteName: SITE_NAME, locale: 'en_IN', url: '/', title: `${SITE_NAME} – Find the Right Teacher`, description: SITE_DESCRIPTION },
  twitter: { card: 'summary_large_image', title: `${SITE_NAME} – Find the Right Teacher`, description: SITE_DESCRIPTION },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%235b4bf5'/><text x='16' y='22' font-size='18' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'>T</text></svg>",
  },
};

export const viewport = { themeColor: '#5b4bf5' };

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
