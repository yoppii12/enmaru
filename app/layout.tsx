import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import ThemeRegistry from '@/components/ui/ThemeRegistry'

const notoSansJP = Noto_Sans_JP({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'えんまーる | 保育士と保育園をつなぐマッチングサービス',
    template: '%s | えんまーる',
  },
  description: '潜在保育士と保育園を双方向でつなぐWebマッチングプラットフォーム。業務完了後の相互評価で信頼を積み重ねます。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={notoSansJP.className}>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  )
}
