import './globals.css'

export const metadata = {
  title: 'Daymark | A little more on track',
  description: 'A thoughtful space to plan your day and keep moving.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}