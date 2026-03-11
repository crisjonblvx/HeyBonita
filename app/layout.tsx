import type React from "react"
import { Playfair_Display, DM_Sans, Space_Mono } from "next/font/google"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${playfair.variable} ${dmSans.variable} ${spaceMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
