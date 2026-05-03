# えんまーる デザインシステム

> UIフレームワーク：Material UI (MUI v5) 準拠  
> 基本思想：柔らかさ・信頼性・寄り添い

---

## 1. カラーシステム

### 1.1 カラーパレット

| 役割 | 名前 | HEX | 用途 |
|------|------|-----|------|
| **メインカラー** | ホワイト | `#FFFFFF` | 背景・余白・カード |
| **サブ① ** | パールグレー | `#F9F9F9` | セクション背景切替・入力フィールド背景 |
| **サブ②** | ダークグレー | `#333333` | 本文・見出し・ラベル |
| **サブ③** | スモークグレー | `#666666` | 補助テキスト・プレースホルダー |
| **サブ④** | ライトグレー | `#AAAAAA` | 注釈・ディバイダー・無効状態 |
| **アクセント** | 桜ピンク | `#F4A7B9` | ボタン・見出しライン・リンク・強調 |

### 1.2 配色比率

```
白 (White / Pearl Gray)  70%  ████████████████████████████
グレー (Dark / Smoke / Light)  27%  ██████████
ピンク (Sakura Pink)  3%  █
```

**ピンクは3%以内に厳守。** 使いすぎると安っぽくなるため、ボタン・アクセントライン・アイコンの一点に絞る。

### 1.3 MUI テーマ定義（実装用）

```typescript
// theme.ts
import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: {
      main: '#F4A7B9',      // 桜ピンク（アクセント）
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#666666',      // スモークグレー
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF',   // ホワイト
      paper: '#F9F9F9',     // パールグレー
    },
    text: {
      primary: '#333333',   // ダークグレー
      secondary: '#666666', // スモークグレー
      disabled: '#AAAAAA',  // ライトグレー
    },
    divider: '#AAAAAA',     // ライトグレー
    error: {
      main: '#E57373',      // MUIデフォルト赤（変更不要）
    },
  },
})
```

### 1.4 カラー使用ルール

| コンテキスト | 使用カラー | 注意 |
|------------|-----------|------|
| ページ背景 | `#FFFFFF` | |
| セクション背景（奇数番目） | `#FFFFFF` | ページ上から1・3・5番目のセクション |
| セクション背景（偶数番目） | `#F9F9F9` | ページ上から2・4・6番目のセクション（1つおきに切替） |
| 見出し（H1〜H3） | `#333333` | |
| 本文 | `#333333` | |
| 補助説明・キャプション | `#666666` | |
| 注釈・プレースホルダー | `#AAAAAA` | |
| プライマリボタン（塗り） | `#F4A7B9` | ピンク使用の主な場所 |
| 見出しアクセントライン | `#F4A7B9` | H2の左ボーダーなど |
| リンクテキスト | `#F4A7B9` | アンダーラインあり |
| アイコン（アクション） | `#F4A7B9` | 1画面1〜2箇所まで |
| 無効・非活性 | `#AAAAAA` | |
| ディバイダー | `#AAAAAA` | |

---

## 2. タイポグラフィ

### 2.1 フォントファミリー

```typescript
// theme.ts に追加
typography: {
  fontFamily: [
    'Noto Sans JP',  // 日本語：丸ゴシック寄りで温かみあり
    'sans-serif',
  ].join(','),
}
```

**Google Fonts 読み込み（Next.js）：**
```typescript
// app/layout.tsx
import { Noto_Sans_JP } from 'next/font/google'

const notoSansJP = Noto_Sans_JP({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})
```

### 2.2 タイプスケール（MUIオーバーライド）

```typescript
// theme.ts に追加
typography: {
  fontFamily: "'Noto Sans JP', sans-serif",

  h1: {
    fontSize: '2rem',       // 32px
    fontWeight: 700,
    color: '#333333',
    lineHeight: 1.4,
  },
  h2: {
    fontSize: '1.5rem',     // 24px
    fontWeight: 700,
    color: '#333333',
    lineHeight: 1.4,
  },
  h3: {
    fontSize: '1.25rem',    // 20px
    fontWeight: 700,
    color: '#333333',
    lineHeight: 1.5,
  },
  h4: {
    fontSize: '1.125rem',   // 18px
    fontWeight: 500,
    color: '#333333',
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '1rem',       // 16px
    fontWeight: 400,
    color: '#333333',
    lineHeight: 1.8,        // 読みやすさ重視
  },
  body2: {
    fontSize: '0.875rem',   // 14px
    fontWeight: 400,
    color: '#666666',
    lineHeight: 1.7,
  },
  caption: {
    fontSize: '0.75rem',    // 12px
    fontWeight: 400,
    color: '#AAAAAA',
    lineHeight: 1.6,
  },
  button: {
    fontSize: '0.875rem',   // 14px
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
},
```

### 2.3 見出しスタイルルール

- **H2** にはピンクの左ボーダーラインをアクセントとして使用
- 見出し上下の余白は `24px / 16px`（上 / 下）

```tsx
// 例：セクション見出し
<Typography
  variant="h2"
  sx={{
    borderLeft: '4px solid #F4A7B9',
    paddingLeft: '12px',
    marginBottom: '16px',
  }}
>
  保育園を探す
</Typography>
```

---

## 3. スペーシング・レイアウト

### 3.1 スペーシング基準（MUI spacing = 8px）

| 用途 | 値 | px |
|------|----|----|
| コンポーネント内パディング（小） | `spacing(2)` | 16px |
| コンポーネント内パディング（標準） | `spacing(3)` | 24px |
| セクション間余白 | `spacing(8)` | 64px |
| カード間余白 | `spacing(3)` | 24px |
| フォームフィールド間 | `spacing(2.5)` | 20px |
| ボタン内パディング | `spacing(1.5) spacing(3)` | 12px 24px |

### 3.2 レスポンシブブレークポイント（MUIデフォルト準拠）

| ブレークポイント | 幅 | 対象 |
|---------------|-----|------|
| xs | 0px〜 | スマホ縦（保育士メイン） |
| sm | 600px〜 | スマホ横・タブレット |
| md | 900px〜 | タブレット横 |
| lg | 1200px〜 | PC（保育園メイン） |
| xl | 1536px〜 | 大型ディスプレイ |

### 3.3 コンテンツ幅

| レイアウト | maxWidth |
|----------|---------|
| ページ全体コンテナ | `1200px` |
| テキスト主体コンテンツ | `800px` |
| フォーム | `560px` |

```tsx
// 標準コンテナ
<Container maxWidth="lg">  {/* 1200px */}
```

---

## 4. コンポーネントスタイル

### 4.1 ボタン

**プライマリボタン（アクション）**
```tsx
<Button
  variant="contained"
  sx={{
    backgroundColor: '#F4A7B9',
    color: '#FFFFFF',
    borderRadius: '24px',      // 丸みを持たせて柔らかく
    padding: '10px 28px',
    fontWeight: 500,
    boxShadow: 'none',          // MUIデフォルトの影は除去
    '&:hover': {
      backgroundColor: '#e8929a',  // 少し濃く
      boxShadow: 'none',
    },
  }}
>
  登録する
</Button>
```

**セカンダリボタン（アウトライン）**
```tsx
<Button
  variant="outlined"
  sx={{
    color: '#F4A7B9',
    borderColor: '#F4A7B9',
    borderRadius: '24px',
    padding: '10px 28px',
    '&:hover': {
      backgroundColor: '#FFF0F3',
      borderColor: '#F4A7B9',
    },
  }}
>
  詳細を見る
</Button>
```

**テキストボタン**
```tsx
<Button
  variant="text"
  sx={{
    color: '#F4A7B9',
    '&:hover': {
      backgroundColor: '#FFF0F3',
    },
  }}
>
  もっと見る
</Button>
```

**無効（disabled）状態**
```tsx
// disabled属性を使えばMUIが自動でグレーアウト
<Button disabled>評価する（業務完了後に有効）</Button>
```

### 4.2 カード

```tsx
<Card
  sx={{
    backgroundColor: '#FFFFFF',
    border: '1px solid #AAAAAA',
    borderRadius: '12px',
    boxShadow: 'none',           // フラットデザイン
    '&:hover': {
      borderColor: '#F4A7B9',
      boxShadow: '0 2px 8px rgba(244, 167, 185, 0.2)',
    },
    transition: 'all 0.2s ease',
  }}
>
```

### 4.3 入力フィールド（テキストフィールド）

```tsx
// MUIオーバーライド（theme.ts）
components: {
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      fullWidth: true,
    },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#F9F9F9',
          borderRadius: '8px',
          '& fieldset': {
            borderColor: '#AAAAAA',
          },
          '&:hover fieldset': {
            borderColor: '#666666',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#F4A7B9',  // フォーカス時にピンク
          },
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: '#F4A7B9',          // ラベルもフォーカス時ピンク
        },
      },
    },
  },
},
```

### 4.4 評価スター（Rating）

```tsx
<Rating
  sx={{
    '& .MuiRating-iconFilled': {
      color: '#F4A7B9',  // 塗りのスターはピンク
    },
    '& .MuiRating-iconEmpty': {
      color: '#AAAAAA',  // 空のスターはライトグレー
    },
  }}
/>
```

### 4.5 ステータスチップ（マッチングステータス）

```tsx
const statusConfig = {
  applied:     { label: '応募中',       bg: '#F9F9F9', color: '#666666' },
  screening:   { label: '確認中',       bg: '#FFF8E1', color: '#F9A825' },
  matched:     { label: 'マッチング成立', bg: '#E8F5E9', color: '#2E7D32' },
  working:     { label: '業務実施中',    bg: '#E3F2FD', color: '#1565C0' },
  completed:   { label: '業務完了',      bg: '#F3E5F5', color: '#6A1B9A' },
  review_open: { label: '評価受付中',    bg: '#FFF0F3', color: '#F4A7B9' },
  review_done: { label: '評価完了',      bg: '#F9F9F9', color: '#AAAAAA' },
}

<Chip
  label={statusConfig[status].label}
  sx={{
    backgroundColor: statusConfig[status].bg,
    color: statusConfig[status].color,
    fontWeight: 500,
    borderRadius: '4px',
  }}
/>
```

### 4.6 ナビゲーション（AppBar）

```tsx
<AppBar
  position="sticky"
  sx={{
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 0 #AAAAAA',  // 細い下ボーダーのみ
    color: '#333333',
  }}
>
```

---

## 5. アイコン

- **ライブラリ：** MUI Icons（`@mui/icons-material`）
- **色：** 基本は `#666666`、アクションアイコンのみ `#F4A7B9`
- **サイズ：** 標準 `24px`、小 `20px`、大 `32px`

```tsx
// 使用例
import FavoriteIcon from '@mui/icons-material/Favorite'
import SearchIcon from '@mui/icons-material/Search'

// アクションアイコン（ピンク）
<FavoriteIcon sx={{ color: '#F4A7B9', fontSize: 24 }} />

// 一般アイコン（グレー）
<SearchIcon sx={{ color: '#666666', fontSize: 24 }} />
```

---

## 6. 画像・写真ガイドライン

| 項目 | ルール |
|------|--------|
| 雰囲気 | 自然光・明るめ・温かみのある色調 |
| 被写体 | 子どもや保育士の自然な表情（演出感なし） |
| アスペクト比 | カードサムネイル：16:9、プロフィール：1:1 |
| 代替（画像なし時） | パールグレー背景 + アイコンのプレースホルダー |

---

## 7. アニメーション・インタラクション

- **基本原則：** 必要最小限。動きは「安心感」のため、派手なアニメーションは使わない
- **遷移時間：** `200ms`（MUIデフォルト）
- **イージング：** `ease-in-out`

```typescript
// theme.ts に追加
transitions: {
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
  },
},
```

---

## 8. フォームデザインルール

1. **ラベルは常に表示**（フォーカス時に消えるfloating labelは補助的に）
2. **エラーメッセージ**はフィールドの下にインライン表示（赤 `#E57373`）
3. **必須項目**は「＊」マークをラベルに付与（色：`#F4A7B9`）
4. **送信ボタン**はフォーム下部中央。プライマリボタンスタイル
5. **完了メッセージ**はページ上部 `Snackbar` または専用完了画面

---

## 9. アクセシビリティ

| 項目 | 対応 |
|------|------|
| コントラスト比 | テキスト（#333333 on #FFFFFF）：**12.6:1** ✅（WCAG AA 4.5:1以上） |
| フォーカスインジケーター | MUIデフォルトのアウトライン（ピンクに変更） |
| タッチターゲット | 最小 `44×44px`（スマホ操作考慮） |
| alt属性 | 画像には必ずaltテキストを付与 |

---

## 10. ブランドトーン（言葉・文体）

| 原則 | 内容 |
|------|------|
| 柔らかく・寄り添う | 断定的な言い方を避ける。「〜できます」より「〜できたら嬉しいです」 |
| 誠実・正直 | できないことは正直に伝える |
| 急がせない | 「今すぐ」「限定」などの焦りを煽るコピーは使わない |
| 丁寧体 | です・ます調。砕けすぎず、固すぎず |

**コピー例：**

| シーン | NG | OK |
|--------|----|----|
| 登録CTA | 「今すぐ登録！」 | 「まずは登録してみる」 |
| 応募ボタン | 「採用チャンス！応募する」 | 「この募集に応募する」 |
| 評価（disabled） | 「評価不可」 | 「業務完了後に評価できます」 |
| エラー | 「入力エラー」 | 「入力内容を確認してください」 |

---

## 11. 完成テーマファイル（まとめ）

```typescript
// lib/theme.ts
import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: {
      main: '#F4A7B9',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#666666',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F9F9F9',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
      disabled: '#AAAAAA',
    },
    divider: '#AAAAAA',
  },
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
    h1: { fontSize: '2rem',     fontWeight: 700, color: '#333333', lineHeight: 1.4 },
    h2: { fontSize: '1.5rem',   fontWeight: 700, color: '#333333', lineHeight: 1.4 },
    h3: { fontSize: '1.25rem',  fontWeight: 700, color: '#333333', lineHeight: 1.5 },
    h4: { fontSize: '1.125rem', fontWeight: 500, color: '#333333', lineHeight: 1.5 },
    body1: { fontSize: '1rem',      fontWeight: 400, color: '#333333', lineHeight: 1.8 },
    body2: { fontSize: '0.875rem',  fontWeight: 400, color: '#666666', lineHeight: 1.7 },
    caption: { fontSize: '0.75rem', fontWeight: 400, color: '#AAAAAA', lineHeight: 1.6 },
    button: { fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 8,  // MUI全体のデフォルト角丸
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        containedPrimary: {
          borderRadius: '24px',
          padding: '10px 28px',
          '&:hover': { backgroundColor: '#e8929a' },
        },
        outlinedPrimary: {
          borderRadius: '24px',
          padding: '10px 28px',
          '&:hover': { backgroundColor: '#FFF0F3' },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#F9F9F9',
            '& fieldset': { borderColor: '#AAAAAA' },
            '&:hover fieldset': { borderColor: '#666666' },
            '&.Mui-focused fieldset': { borderColor: '#F4A7B9' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#F4A7B9' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #AAAAAA',
          borderRadius: '12px',
          boxShadow: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 0 #AAAAAA',
          color: '#333333',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#AAAAAA' },
      },
    },
  },
})
```
