import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Алматы помнит',
  description: 'Карта памяти города — оставьте свою историю места.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full bg-stone-50 text-stone-900 font-sans">{children}</body>
    </html>
  );
}
