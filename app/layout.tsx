import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CampusOS — Intelligent University Operating System',
  description: 'Centralizes campus schedules, events, and announcements with real-time updates and an AI assistant to help students access and manage campus info effortlessly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', background: '#070912', color: '#e8edf5' }}>
        {children}
      </body>
    </html>
  );
}
