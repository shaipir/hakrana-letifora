import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ArtRevive — Revive Your Art',
  description: 'Transform still images into projection-ready digital visual art. Restyle and Neon Contour modes for artists and visual creators.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="bg-ar-bg text-ar-text antialiased min-h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
