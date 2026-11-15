// frontend/app/layout.tsx
import type { Metadata } from 'next';
import { Fira_Code, Fira_Sans, Overpass } from 'next/font/google';
import './globals.css';

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-fira-sans',
});

const overpass = Overpass({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-overpass',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fira-code',
});

export const metadata: Metadata = {
  title: 'FLARE · Microgravity Fire Safety Decision Intelligence',
  description:
    'Explore 30+ years of NASA microgravity combustion research, uncover hidden Earth-test flammability gaps, and predict partial-gravity fire behavior.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${firaSans.variable} ${overpass.variable} ${firaCode.variable} dark`}
    >
      <body className="min-h-screen bg-[#060a14] font-sans text-slate-100 antialiased selection:bg-sky-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}