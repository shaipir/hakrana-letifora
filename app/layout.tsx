import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'הקרנה לתפאורה',
  description: 'AI Projection Mapping Tool',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-canvas text-white antialiased">{children}</body>
    </html>
  );
}
