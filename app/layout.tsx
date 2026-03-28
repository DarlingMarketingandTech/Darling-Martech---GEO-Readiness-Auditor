import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GEO Readiness Auditor — Is Your Site Visible to AI?',
  description:
    'Find out in 60 seconds if your website is visible to AI assistants like ChatGPT, Perplexity, and Claude. Free GEO Readiness Score with prioritized fixes.',
  openGraph: {
    title: 'GEO Readiness Auditor — Is Your Site Visible to AI?',
    description:
      'Free AI visibility audit for your website. Get your GEO Readiness Score in 60 seconds.',
    url: 'https://geo.darlingmartech.com',
    siteName: 'Darling Marketing & Tech',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-gray-900">
        {children}
      </body>
    </html>
  )
}
