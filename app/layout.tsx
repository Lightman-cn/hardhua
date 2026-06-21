import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '硬话软说 · 职场嘴替 AI',
  description: '心里随便吐槽，对外体面发言。让 AI 帮你把"想说滚"翻译成"我保留意见"。',
  keywords: '职场,嘴替,AI,沟通,高情商,回复,翻译',
  openGraph: {
    title: '硬话软说 · 职场嘴替 AI',
    description: '心里随便吐槽，对外体面发言',
    type: 'website'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
