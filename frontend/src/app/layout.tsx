import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import QueryProvider from '@/components/providers/QueryProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CrimeGPT — AI Police Investigation Platform',
  description: 'From FIR to Arrest – One Intelligent Investigation Platform. Gujarat Police Cyber Crime Branch.',
  keywords: ['police', 'cyber crime', 'AI', 'FIR', 'legal intelligence', 'Gujarat Police'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} bg-bg-base text-text-primary antialiased`}>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#111f33',
                color: '#e8f0fe',
                border: '1px solid rgba(255,255,255,0.07)',
                fontSize: '13px',
              },
              success: { iconTheme: { primary: '#00e676', secondary: '#111f33' } },
              error:   { iconTheme: { primary: '#ff5252', secondary: '#111f33' } },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
