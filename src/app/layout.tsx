import type { Metadata, Viewport } from 'next';
import '@/app/globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/components/ui/ThemeProvider';

export const metadata: Metadata = {
  title: 'DailyFlow — VibeCode Productivity OS & 21-Day Consistency Platform',
  description: 'Master your daily workflow with 21-day habits, random mission selection, deadline alarms, and streak tracking in a cyber-minimal glassmorphism interface.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DailyFlow',
  },
};

export const viewport: Viewport = {
  themeColor: '#07080f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
