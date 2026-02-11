import type { Metadata } from "next"
import "../styles/globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import ProtectedLayout from "@/components/ProtectedLayout"

export const metadata: Metadata = {
  title: "MLH CRM - Bilgi Yönetim Sistemi",
  description: "Modern Bilgi Yönetim Sistemi",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="bg-background min-h-screen">
        <AuthProvider>
          <ProtectedLayout>
            {children}
          </ProtectedLayout>
        </AuthProvider>
      </body>
    </html>
  )
}