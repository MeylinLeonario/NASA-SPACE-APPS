import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title: 'FLARE · Flame Analysis Research Explorator', description: 'FLARE — Flame Analysis Research Explorator. Explore microgravity combustion research with traceable evidence and page-level citations.'};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
