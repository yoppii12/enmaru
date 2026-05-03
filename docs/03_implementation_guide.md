# えんまーる 実装指示書（Claude Code向け）

> このドキュメントはClaude Codeが「えんまーる」を実装するための技術仕様・実装方針をまとめたものです。

---

## 1. プロジェクト概要

**えんまーる**は、潜在保育士（保育士資格を持つが未就業・休業中の方）と保育園を双方向でつなぐWebマッチングプラットフォームです。

### コアバリュー
- **単発マッチングではなく継続的関係構築**
- **業務完了後のみ使える双方向評価機能**（信頼の可視化・ミスマッチ防止）

### ユーザー区分
1. **潜在保育士**（seeker）：資格保有者、ブランクあり、柔軟な働き方希望
2. **保育園**（nursery）：園長・採用担当、人材不足解消とミスマッチ回避
3. **管理者**（admin）：合同会社KASUMIN、運営・監視

---

## 2. 技術スタック

### 採用構成

| レイヤー | 技術 | 選定理由 |
|---------|------|---------|
| フロントエンド | **Next.js 14** (App Router) | SEO対応（園名・募集情報が検索に載る）、SSR/SSG、ルーティング込み |
| UIライブラリ | **Material UI (MUI v5)** | デザインシステム準拠、コンポーネント充実、わかりやすい |
| 言語 | **TypeScript** | 型安全、Claude Codeとの相性良好 |
| バックエンド | **Next.js API Routes** | 別サーバー不要、シンプルに完結 |
| DB | **Supabase (PostgreSQL)** | ローカル開発環境あり、Prismaと相性良好 |
| ORM | **Prisma** | 型安全なDBアクセス、マイグレーション管理 |
| 認証 | **Supabase Auth** | DB・Storageと同一サービスで完結、シンプル |
| ストレージ | **Supabase Storage** | 園の写真等、Supabase内で完結 |
| 通知 | **LINE Messaging API** | 保育士・保育園ともLINE利用が前提、開封率が高い、登録時に友だち追加必須 |
| デプロイ | **Vercel** | GitHubにpushで自動デプロイ、Next.jsと最高相性 |

### Next.jsを採用する理由（Reactだけでは不十分な点）

えんまーるは一般公開サービスのため、以下の理由からNext.jsが必須です。

- **SEO**：園一覧・園詳細・募集情報がGoogle検索に載る必要がある（React SPAでは困難）
- **ルーティング**：App Routerでファイルベースのルーティングが使える
- **API Routes**：バックエンドを別途立てる必要がなく、1リポジトリで完結

### バックエンドをAPI Routesに統一する理由

えんまーるのAPI要件はシンプルなCRUDが中心のため、Honoなど別サーバーを立てる必要はありません。Next.js API Routesで十分対応できます。

---

## 3. ローカル開発環境

### 必要なもの

```
1. Node.js（v18以上）
2. Docker（Supabaseローカル環境の起動に必要）
3. Supabase CLI
```

### 起動手順

```bash
# Supabaseローカル環境を起動（PostgreSQL・Auth・Storageがすべてローカルで動く）
npx supabase start

# Next.js開発サーバーを起動
npm run dev
```

この2コマンドでクラウドに繋がずにローカル検証が可能です。本番環境との差異もほぼありません。

### 環境変数（.env.local）

```bash
# Supabase（ローカル起動時に表示される値を使用）
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# DB（PrismaがSupabaseのPostgreSQLに接続）
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

### DBマイグレーション

```bash
# スキーマ変更をDBに反映
npx supabase db push

# または Prisma マイグレーション
npx prisma migrate dev
```

---

## 4. 認証設計

### 現フェーズ：Supabase Auth

Supabase AuthはDB・Storageと同一サービスで完結するため、MVPフェーズに最適です。

```
Supabase Auth（認証）
    +
Supabase DB（PostgreSQL + Prisma）
    +
Supabase Storage（写真）
```

### 認証処理の集約（移行を見据えた設計）

**認証処理は必ず `lib/auth.ts` 1ファイルに集約してください。** アプリ全体でこのファイルの関数を呼ぶ設計にすることで、将来の認証サービス差し替えコストを最小化します。

```typescript
// lib/auth.ts ← 認証処理はここだけに集める
export async function getCurrentUser(req) { ... }
export async function requireRole(role: 'seeker' | 'nursery' | 'admin') { ... }
export async function getSession(req) { ... }
```

### 将来フェーズ：Logto OSS への移行

Supabase AuthからLogto OSSへの移行が必要になった場合（認証要件が複雑化・RBACを強化したい等）、以下の作業だけで対応できます。

| 作業 | 要否 | 理由 |
|------|------|------|
| DBスキーマ変更 | ❌ 不要 | Prismaはそのまま使える |
| ビジネスロジック変更 | ❌ 不要 | 認証と無関係 |
| `lib/auth.ts` の書き換え | ✅ 必要 | Logtoのセッション取得に変更 |
| 環境変数の更新 | ✅ 必要 | Logtoの接続情報に変更 |
| ユーザーデータ移行 | ✅ 必要 | Supabase AuthのユーザーをLogtoへ移行 |

**移行コストの目安：1〜2日程度。** `lib/auth.ts` を集約設計にしておくことが前提条件です。

---

## 5. ディレクトリ構成（推奨）

```
enmaru/
├── app/
│   ├── (public)/           # 未ログインでも閲覧可能
│   │   ├── page.tsx         # トップ(P-01)
│   │   ├── about/page.tsx   # えんまーるとは(P-02)
│   │   ├── nurseries/       # 園一覧(P-03)・詳細(P-04)
│   │   ├── register/page.tsx# 新規登録(P-05)
│   │   ├── login/page.tsx   # ログイン(P-06)
│   │   └── contact/page.tsx # お問い合わせ(P-07)
│   ├── (seeker)/           # 潜在保育士向け
│   │   ├── mypage/          # マイページ(U-01)
│   │   ├── profile/         # プロフィール編集(U-02)
│   │   ├── nurseries/       # 園検索(U-03)
│   │   ├── applications/    # 応募管理(U-05・U-06)
│   │   ├── reviews/         # 評価入力(U-07)
│   │   └── settings/        # 設定(U-08)
│   ├── (nursery)/          # 保育園向け
│   │   ├── mypage/          # 園マイページ(C-01)
│   │   ├── profile/         # 園プロフィール編集(C-02)
│   │   ├── jobs/            # 募集情報管理(C-03)
│   │   ├── applications/    # 応募受信・対応(C-05)
│   │   ├── reviews/         # 評価入力(C-07)
│   │   └── settings/        # 設定(C-08)
│   ├── (admin)/            # 管理者向け
│   │   ├── dashboard/       # ダッシュボード(A-01)
│   │   ├── users/           # ユーザー管理(A-02)
│   │   ├── matches/         # マッチング管理(A-03)
│   │   ├── reviews/         # 評価管理(A-04)
│   │   └── reports/         # レポート(A-06)
│   └── api/
│       ├── auth/
│       ├── users/
│       ├── nurseries/
│       ├── jobs/
│       ├── applications/
│       ├── matches/
│       ├── work-reports/
│       └── reviews/
├── components/
│   ├── ui/                  # MUIラップコンポーネント（theme適用済み）
│   ├── common/
│   ├── seeker/
│   ├── nursery/
│   └── admin/
├── lib/
│   ├── auth.ts
│   ├── db.ts               # Prismaクライアント
│   └── utils.ts
├── prisma/
│   └── schema.prisma
└── types/
    └── index.ts
```

---

## 6. データベーススキーマ（Prisma）

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  SEEKER
  NURSERY
  ADMIN
}

enum MatchStatus {
  APPLIED
  SCREENING
  MATCHED
  WORKING
  COMPLETED
  REVIEW_OPEN
  REVIEW_DONE
}

enum ReviewStatus {
  NONE
  PARTIAL
  DONE
}

enum JobStatus {
  OPEN
  CLOSED
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  role         Role
  isActive     Boolean   @default(true)
  agreedAt     DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // Supabase Auth を使うため passwordHash は不要
  // Supabase の auth.users.id と紐付け
  supabaseId   String?   @unique
  // LINE Messaging API のユーザーID（登録時に友だち追加で取得・必須）
  lineUserId   String?   @unique

  seekerProfile  SeekerProfile?
  nurseryProfile NurseryProfile?
}

model SeekerProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  realName      String
  displayName   String
  license       Boolean  @default(false)
  blankYears    String?
  preferredArea String?
  preferredStyle String[] @default([])
  bio           String?
  experience    String?
  skills        String?
  ngConditions  String?
  isPublished   Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  applications Application[]
  matches      Match[]        @relation("SeekerMatches")
  reviewsGiven ReviewSeekerToNursery[]
  reviewsReceived ReviewNurseryToSeeker[]
}

model NurseryProfile {
  id           String   @id @default(cuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id])
  nurseryName  String
  area         String
  address      String?  // 非公開管理
  contactName  String
  phone        String?  // 非公開管理
  concept      String?
  policy       String?
  isPublished  Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  jobPostings JobPosting[]
  matches     Match[]      @relation("NurseryMatches")
  reviewsGiven ReviewNurseryToSeeker[]
  reviewsReceived ReviewSeekerToNursery[]
}

model JobPosting {
  id            String      @id @default(cuid())
  nurseryId     String
  nursery       NurseryProfile @relation(fields: [nurseryId], references: [id])
  title         String
  workContent   String
  workDate      DateTime
  workTimeStart String      // HH:MM
  workTimeEnd   String      // HH:MM
  hourlyWage    Int?
  targetPerson  String?
  remarks       String?
  status        JobStatus   @default(OPEN)
  postedAt      DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  applications Application[]
  matches      Match[]
}

model Application {
  id             String   @id @default(cuid())
  jobId          String
  job            JobPosting @relation(fields: [jobId], references: [id])
  seekerId       String
  seeker         SeekerProfile @relation(fields: [seekerId], references: [id])
  applyMessage   String?
  lineContactOk  Boolean  @default(false)
  appliedAt      DateTime @default(now())

  match Match?
}

model Match {
  id            String      @id @default(cuid())
  applicationId String      @unique
  application   Application @relation(fields: [applicationId], references: [id])
  jobId         String
  job           JobPosting  @relation(fields: [jobId], references: [id])
  nurseryId     String
  nursery       NurseryProfile @relation("NurseryMatches", fields: [nurseryId], references: [id])
  seekerId      String
  seeker        SeekerProfile  @relation("SeekerMatches", fields: [seekerId], references: [id])
  status        MatchStatus    @default(APPLIED)
  lineContacted Boolean        @default(false)
  workDate      DateTime?
  reviewStatus  ReviewStatus   @default(NONE)
  adminMemo     String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  workReports WorkReport[]
  reviewNurseryToSeeker ReviewNurseryToSeeker?
  reviewSeekerToNursery ReviewSeekerToNursery?
}

model WorkReport {
  id           String   @id @default(cuid())
  matchId      String
  match        Match    @relation(fields: [matchId], references: [id])
  reporterType String   // "seeker" or "nursery"
  completed    Boolean
  comment      String?
  reportedAt   DateTime @default(now())
}

model ReviewNurseryToSeeker {
  id            String   @id @default(cuid())
  matchId       String   @unique
  match         Match    @relation(fields: [matchId], references: [id])
  nurseryId     String
  nursery       NurseryProfile @relation(fields: [nurseryId], references: [id])
  seekerId      String
  seeker        SeekerProfile  @relation(fields: [seekerId], references: [id])
  attitude      Int      // 1-5
  communication Int      // 1-5
  skill         Int      // 1-5
  comment       String?
  wouldRehire   Boolean
  isPublished   Boolean  @default(false)
  reviewedAt    DateTime @default(now())
}

model ReviewSeekerToNursery {
  id              String   @id @default(cuid())
  matchId         String   @unique
  match           Match    @relation(fields: [matchId], references: [id])
  seekerId        String
  seeker          SeekerProfile  @relation(fields: [seekerId], references: [id])
  nurseryId       String
  nursery         NurseryProfile @relation(fields: [nurseryId], references: [id])
  explanation     Int      // 1-5 受け入れ説明
  atmosphere      Int      // 1-5 現場の雰囲気
  support         Int      // 1-5 サポート体制
  clarity         Int      // 1-5 業務内容の明確さ
  comment         String?
  wouldWorkAgain  Boolean
  isPublished     Boolean  @default(false)
  reviewedAt      DateTime @default(now())
}
```

---

## 7. 主要APIエンドポイント

### 認証
```
POST /api/auth/register      - 新規登録（role付き）
POST /api/auth/login         - ログイン
POST /api/auth/logout        - ログアウト
GET  /api/auth/me            - 現在ユーザー取得
```

### 潜在保育士プロフィール
```
GET    /api/seeker/profile         - 自分のプロフィール取得
PUT    /api/seeker/profile         - プロフィール更新
PATCH  /api/seeker/profile/publish - 公開設定変更
```

### 保育園プロフィール
```
GET  /api/nurseries              - 保育園一覧（公開）
GET  /api/nurseries/:id          - 保育園詳細（公開）
GET  /api/nursery/profile        - 自園プロフィール取得
PUT  /api/nursery/profile        - 自園プロフィール更新
```

### 募集情報
```
GET    /api/jobs                 - 募集一覧（公開）
GET    /api/jobs/:id             - 募集詳細
POST   /api/nursery/jobs         - 募集作成（保育園のみ）
PUT    /api/nursery/jobs/:id     - 募集編集
PATCH  /api/nursery/jobs/:id/status - 募集状態変更（open/closed）
```

### 応募
```
POST /api/applications           - 応募（保育士のみ）
GET  /api/applications           - 自分の応募一覧（保育士）
GET  /api/nursery/applications   - 受信応募一覧（保育園）
```

### マッチング
```
GET   /api/admin/matches         - マッチング一覧（管理者）
PATCH /api/admin/matches/:id/status - ステータス更新（管理者）
GET   /api/matches/:id           - マッチ詳細（関係者のみ）
```

### 業務完了報告
```
POST /api/work-reports           - 業務完了報告（保育士/保育園）
```

### 評価
```
POST /api/reviews/nursery-to-seeker  - 園→保育士評価（業務完了後のみ）
POST /api/reviews/seeker-to-nursery  - 保育士→園評価（業務完了後のみ）
GET  /api/admin/reviews              - 評価一覧（管理者）
PATCH /api/admin/reviews/:id/publish - 公開設定（管理者）
```

---

## 8. 認証・認可設計

### ロールベースアクセス制御

```typescript
// middleware.ts
const ROLE_ROUTES = {
  seeker: ['/mypage', '/profile', '/applications', '/reviews'],
  nursery: ['/nursery'],
  admin: ['/admin'],
}

// API認可チェック例
async function requireRole(req, allowedRoles: Role[]) {
  const session = await getSession(req)
  if (!session || !allowedRoles.includes(session.user.role)) {
    throw new UnauthorizedError()
  }
  return session.user
}
```

### 評価可能条件チェック
```typescript
// 評価は業務完了後（COMPLETED以降のステータス）かつ
// 評価対象のマッチに関係する当事者のみ
async function canSubmitReview(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return false
  if (match.status !== 'COMPLETED' && match.status !== 'REVIEW_OPEN') return false
  // seekerIdまたはnurseryIdに一致するか確認
  const userProfile = await getUserProfile(userId)
  return userProfile.id === match.seekerId || userProfile.id === match.nurseryId
}
```

---

## 9. フロントエンド実装方針

### UIトーン
- 白70% / グレー27% / 桜ピンク3% の配色比率を厳守（詳細は `05_design_system.md` 参照）
- メインカラー：ホワイト `#FFFFFF`、アクセント：桜ピンク `#F4A7B9`
- フォント：Noto Sans JP（丸ゴシック系・寄り添う安心感）
- MUIテーマは `lib/theme.ts` を必ず適用すること

### 重要なUI要件
1. **トップページ**：保育士向け・保育園向けの二系統CTAを明確に分離
2. **評価入力**：業務完了後のみボタン表示、それ以前はグレーアウト＋説明文
3. **個人情報保護**：本名・住所・電話番号は管理者以外に非表示
4. **スマホ対応**：潜在保育士はスマホ利用が主、保育園はPC主体

### 公開・非公開制御
```typescript
// 潜在保育士情報の公開範囲
type PublicSeekerInfo = {
  displayName: string    // 公開
  preferredArea: string  // 公開
  blankYears: string     // 公開
  skills: string         // 公開
  bio: string            // 公開
  // realName, email, phoneは非公開
}

// 保育園情報の公開範囲
type PublicNurseryInfo = {
  nurseryName: string    // 公開
  area: string           // 公開（市区町村まで）
  concept: string        // 公開
  policy: string         // 公開
  // address（番地）, phone, contactNameは非公開
}
```

---

## 10. 業務フロー実装

### マッチングステータス遷移

```
APPLIED → SCREENING → MATCHED → WORKING → COMPLETED → REVIEW_OPEN → REVIEW_DONE
```

- `APPLIED`：応募フォーム送信で自動生成
- `SCREENING`〜`MATCHED`：管理者が手動更新
- `WORKING`：業務当日に更新
- `COMPLETED`：双方の業務完了報告が揃ったら更新
- `REVIEW_OPEN`：管理者が評価リンクを送付後に更新
- `REVIEW_DONE`：双方の評価が揃ったら更新

### 評価ロジック

```typescript
// 評価提出時のreview_status更新
async function updateReviewStatus(matchId: string) {
  const hasNurseryReview = await prisma.reviewNurseryToSeeker.findUnique({
    where: { matchId }
  })
  const hasSeekerReview = await prisma.reviewSeekerToNursery.findUnique({
    where: { matchId }
  })
  
  let reviewStatus: ReviewStatus
  if (hasNurseryReview && hasSeekerReview) {
    reviewStatus = 'DONE'
  } else if (hasNurseryReview || hasSeekerReview) {
    reviewStatus = 'PARTIAL'
  } else {
    reviewStatus = 'NONE'
  }
  
  await prisma.match.update({
    where: { id: matchId },
    data: { reviewStatus }
  })
}
```

---

## 11. デモ用ダミーデータ

初期シードデータとして以下を投入すること：

### 保育園（2園）
```json
[
  {
    "nurseryName": "ひだまり保育園",
    "area": "長崎市",
    "concept": "子ども一人ひとりに寄り添う保育",
    "policy": "無理のない働き方を相談可能。ブランクのある方も歓迎"
  },
  {
    "nurseryName": "そらのね保育園",
    "area": "長崎市",
    "concept": "自然と遊びを大切にする園",
    "policy": "ブランク歓迎。初回は補助業務から"
  }
]
```

### 潜在保育士（2名）
```json
[
  {
    "displayName": "さくら",
    "preferredArea": "長崎市",
    "blankYears": "3年",
    "preferredStyle": ["午前のみ", "短時間"],
    "bio": "少しずつ現場に戻りたいです"
  },
  {
    "displayName": "みどり",
    "preferredArea": "長崎市",
    "blankYears": "1年",
    "preferredStyle": ["単発", "週1"],
    "bio": "子どもと関わる時間を大切にしたい"
  }
]
```

### 募集（2件）
```json
[
  {
    "nursery": "ひだまり保育園",
    "title": "午前中サポート保育",
    "workContent": "クラス補助・見守り",
    "workDate": "2025-06-15",
    "workTimeStart": "09:00",
    "workTimeEnd": "12:00",
    "targetPerson": "ブランクOK"
  },
  {
    "nursery": "そらのね保育園",
    "title": "行事前サポート",
    "workContent": "製作準備・補助",
    "workDate": "2025-06-20",
    "workTimeStart": "10:00",
    "workTimeEnd": "14:00",
    "targetPerson": "経験者歓迎"
  }
]
```

---

## 12. LINE通知設計

### 基本方針
- ユーザーは登録時に**えんまーる公式LINEを友だち追加することを必須**とする
- 通知はシステムが自動送信（手動運用なし）
- LINE上での返信受け取りも可能（お問い合わせ対応に活用）
- 無料枠：月200通（2023年以降の仕様。MVP初期の小規模運用では十分だが、ユーザーが増えた段階で有料プランへの移行を検討すること）

### 通知タイミング一覧

| タイミング | 宛先 | 内容 |
|----------|------|------|
| 登録完了 | 本人 | ウェルカムメッセージ・使い方案内 |
| 応募発生 | 保育園・管理者 | 応募者情報・確認依頼 |
| マッチング成立 | 双方 | 成立通知・業務日程の確認依頼 |
| 業務完了報告受領 | 管理者 | 双方の報告確認・評価依頼送信の準備 |
| 評価依頼 | 双方 | 評価フォームURLの案内 |
| 評価完了 | 管理者 | クローズ確認 |

### 実装ポイント

```typescript
// lib/line.ts ← LINE通知処理はここに集約
export async function sendLineMessage(lineUserId: string, message: string) {
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text: message }],
    }),
  })
}
```

**User テーブルに `lineUserId` カラムを追加することに注意（DBスキーマ参照）**

---

## 13. 実装優先順位

### フェーズ1（MVP）
WebサイトとしてLINEなしで一通り動作し、通知はLINEで完結する状態を目指す。

1. ユーザー認証（登録・ログイン・ロール管理・LINE友だち追加導線）
2. 保育士プロフィール作成・編集
3. 保育園プロフィール作成・編集
4. 募集情報 CRUD
5. 応募機能
6. **LINE通知**（応募・マッチング・評価依頼の自動送信）
7. マッチング管理（管理者画面）
8. 業務完了報告
9. **相互評価機能**（最重要）
10. 公開ページ（トップ・えんまーるとは・園一覧・園詳細・規約）

### フェーズ2
MVPで動作確認後に追加する。

1. 園検索・フィルタリング強化
2. 潜在保育士一覧（保育園向け）
3. 評価の段階的公開
4. 閲覧履歴・応募履歴
5. 管理者ダッシュボード・レポート
6. 設定画面（通知設定・退会等）
7. お問い合わせフォーム（フェーズ1はLINEで代替）

---

## 14. 注意事項・制約

1. **個人情報保護**：本名・住所・電話番号は管理者のみ閲覧可能
2. **評価の制約**：業務完了（COMPLETED以降）後のみ評価可能
3. **評価の公開**：初期は非公開（管理者のみ閲覧）、管理者が内容確認後に公開
4. **LINE必須**：全ユーザーは登録時にえんまーる公式LINEの友だち追加が必須。`lineUserId` をDBに保存する
5. **スマホ対応**：保育士側はスマホ主体のためレスポンシブ必須
6. **長崎対応**：初期ターゲットは長崎県（エリア選択のデフォルト）
