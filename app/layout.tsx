import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"

import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SA Tender Explorer | South African Government Tenders",
  description:
    "Discover and explore government procurement opportunities from the South African National Treasury eTenders Portal. Search, filter, and browse public tenders across all provinces.",
}

export const viewport: Viewport = {
  themeColor: "#1a8a5c",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
