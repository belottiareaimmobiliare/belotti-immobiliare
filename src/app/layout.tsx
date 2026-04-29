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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://belotti-immobiliare.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Area Immobiliare | Immobili a Bergamo e provincia',
    template: '%s | Area Immobiliare',
  },
  description:
    'Area Immobiliare di Gianfederico Belotti: immobili in vendita e in affitto a Bergamo e provincia, consulenza immobiliare e valutazioni professionali.',
  applicationName: 'Area Immobiliare',
  authors: [
    { name: 'Area Immobiliare' },
    { name: 'Gianfederico Belotti' },
  ],
  creator: 'Area Immobiliare',
  publisher: 'Area Immobiliare',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: '/',
    siteName: 'Area Immobiliare',
    title: 'Area Immobiliare | Immobili a Bergamo e provincia',
    description:
      'Immobili in vendita e in affitto a Bergamo e provincia con Area Immobiliare di Gianfederico Belotti.',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'Area Immobiliare',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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