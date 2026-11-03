import { Outfit } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import AuthProvider from "./auth/AuthProvider";


const outfit = Outfit({
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <NextIntlClientProvider>
          <ThemeProvider>
            <AuthProvider>
            <SidebarProvider>{children}</SidebarProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
