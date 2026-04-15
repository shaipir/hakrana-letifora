import type { Metadata } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ArtRevive — Projection Art Studio',
  description: 'Transform images into cinematic projection art. World Transform, Glow Sculpture, and House Projection modes for visual artists.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${spaceGrotesk.variable} ${spaceMono.variable} bg-ar-bg text-ar-text antialiased min-h-screen overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
