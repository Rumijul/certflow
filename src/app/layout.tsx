import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CertFlow — Certificate Generator & Dispatcher',
  description: 'Automated certificate creation, batch processing, and delivery system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
