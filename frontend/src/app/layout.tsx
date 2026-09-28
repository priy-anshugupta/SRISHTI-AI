import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SRISHTI·AI | Drilling Intelligence Platform',
  description: 'Smart India Hackathon 2026 - Drilling Intelligence Platform for Oil India Limited (eRTMAC)',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} min-h-full antialiased scroll-smooth`}>
      <body className="min-h-full font-sans selection:bg-brand selection:text-ink">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
