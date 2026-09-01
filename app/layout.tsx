import type { Metadata } from 'next';
import { DM_Mono, Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'] });
const dmMono = DM_Mono({ variable: '--font-dm-mono', subsets: ['latin'], weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'Indie Runway — Studio Financial Planner',
  description: 'Model your indie studio’s runway, launch, and financial future.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${manrope.variable} ${dmMono.variable}`}>{children}</body></html>;
}
