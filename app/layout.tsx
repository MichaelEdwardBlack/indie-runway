import type { Metadata } from 'next';
import { Geist_Mono, Overpass } from 'next/font/google';
import './globals.css';

const overpass = Overpass({ variable: '--font-overpass', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Indie Runway — Studio Financial Planner',
  description:
    'Model your indie studio’s runway, launch, and financial future.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${overpass.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
