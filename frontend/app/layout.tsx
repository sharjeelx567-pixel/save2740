import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from "@/components/ui/toaster"
import { SupportChatProvider } from '@/context/support-chat-context'
import { SupportChatButton } from '@/components/support-chat-button'
import { SupportChatWidget } from '@/components/support-chat-widget'
import { AuthProvider } from '@/context/auth-context'
import { ServiceWorkerRegister } from '@/components/service-worker-register'

// Using system fonts as fallback for production builds
const inter = {
  variable: '--font-inter',
}

export const metadata: Metadata = {
  title: 'Save2740 - Smart Savings App',
  description: 'Save2740: Your intelligent savings companion for achieving financial goals',
  generator: 'Save2740',
  icons: {
    icon: [
      {
        url: '/save2740-logo.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/save2740-logo.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/save2740-logo.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

import { QueryProvider } from '@/components/providers/query-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ServiceWorkerRegister />
        <AuthProvider>
          <QueryProvider>
            <SupportChatProvider>
              {children}
              <Toaster />
              <Analytics />

              {/* Support Chat Components */}
              <SupportChatButton />
              <SupportChatWidget />
            </SupportChatProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

