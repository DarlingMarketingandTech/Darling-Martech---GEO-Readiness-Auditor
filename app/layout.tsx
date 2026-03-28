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
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ background: '#0A0A0A', color: '#ededed' }}>
        {children}
      </body>
    </html>
  )
}
