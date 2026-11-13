import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title: 'FLAME INTELLIGENCE · Research Observatory', description: 'Source-traceable microgravity combustion research.'};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
