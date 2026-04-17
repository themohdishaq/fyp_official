import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'leaflet/dist/leaflet.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Drone Crop Disease Detection Platform',
  description: 'Smart spraying control and analysis platform using deep learning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-green-600 text-white p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">🚁 Drone Crop Disease Detection</h1>
            <div className="flex gap-4">
              <a href="/" className="hover:underline">Dashboard</a>
              <a href="/upload" className="hover:underline">Upload</a>
              <a href="/report" className="hover:underline">Reports</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
