import type { Metadata } from 'next';
import './globals.css';
import NavigationWrapper from '@/components/NavigationWrapper';

export const metadata: Metadata = {
  title: 'MY FINANCE | Personal Finance Cloud',
  description: 'ระบบจัดการรายรับ รายจ่าย และกระแสเงินสดส่วนบุคคลบน Supabase Cloud',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MY FINANCE',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="dark">
      <body className="bg-[#0d0e12] text-gray-100 min-h-screen flex flex-col md:flex-row">
        <NavigationWrapper>{children}</NavigationWrapper>
      </body>
    </html>
  );
}