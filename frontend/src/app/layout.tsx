import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import QueryProvider from '@/components/providers/QueryProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

export const metadata: Metadata = {
  title: 'CrimeGPT-X — AI Police Investigation Platform',
  description: 'From FIR to Arrest – One Intelligent Investigation Platform. Gujarat Police Cyber Crime Branch.',
  keywords: ['police', 'cyber crime', 'AI', 'FIR', 'legal intelligence', 'Gujarat Police'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-bg-base text-text-primary antialiased`}>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#161d2c',
                color: '#f3f4f6',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '13px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#161d2c' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#161d2c' } },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
