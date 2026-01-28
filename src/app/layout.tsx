import type { Metadata } from "next"
import "../styles/globals.css"

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
      <body className="h-screen overflow-hidden bg-background">
        <main className="h-full w-full flex flex-col">
          {children}
        </main>
      </body>
    </html>
  )
}