import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import CookieBanner from '@/components/public/CookieBanner'
import WhatsAppChatButton from '@/components/public/WhatsAppChatButton'
import ThemeInitializer from '@/components/public/ThemeInitializer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Area Immobiliare',
  description:
    'Immobili in vendita e in affitto a Bergamo e provincia con Area Immobiliare.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="it"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300">
        <ThemeInitializer />
        {children}
        <WhatsAppChatButton />
        <CookieBanner />
      </body>
    </html>
  )
}