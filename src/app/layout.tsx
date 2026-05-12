import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DanpentekiBoard - 会話フローエディタ',
  description: 'ホワイトボード型会話管理アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="h-screen overflow-hidden">{children}</body>
    </html>
  )
}
