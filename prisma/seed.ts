import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const db = new PrismaClient()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function createAuthUser(email: string, password: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`Failed to create auth user ${email}: ${error.message}`)
  return data.user
}

async function main() {
  console.log('🌱 Seeding...')

  // 保育園ユーザー
  const hidamariAuth = await createAuthUser('hidamari@example.com', 'password123')
  const soranoneAuth = await createAuthUser('soranone@example.com', 'password123')

  // 保育士ユーザー
  const sakuraAuth = await createAuthUser('sakura@example.com', 'password123')
  const midoriAuth = await createAuthUser('midori@example.com', 'password123')

  // 管理者ユーザー
  const adminAuth = await createAuthUser('admin@example.com', 'password123')

  // 保育園ユーザーDB登録
  const hidamariUser = await db.user.create({
    data: {
      email: 'hidamari@example.com',
      role: 'NURSERY',
      supabaseId: hidamariAuth.id,
      agreedAt: new Date(),
    },
  })
  const soranoneUser = await db.user.create({
    data: {
      email: 'soranone@example.com',
      role: 'NURSERY',
      supabaseId: soranoneAuth.id,
      agreedAt: new Date(),
    },
  })

  // 保育士ユーザーDB登録
  const sakuraUser = await db.user.create({
    data: {
      email: 'sakura@example.com',
      role: 'SEEKER',
      supabaseId: sakuraAuth.id,
      agreedAt: new Date(),
    },
  })
  const midoriUser = await db.user.create({
    data: {
      email: 'midori@example.com',
      role: 'SEEKER',
      supabaseId: midoriAuth.id,
      agreedAt: new Date(),
    },
  })

  // 管理者ユーザーDB登録
  await db.user.create({
    data: {
      email: 'admin@example.com',
      role: 'ADMIN',
      supabaseId: adminAuth.id,
      agreedAt: new Date(),
    },
  })

  // 保育園プロフィール
  const hidamariProfile = await db.nurseryProfile.create({
    data: {
      userId: hidamariUser.id,
      nurseryName: 'ひだまり保育園',
      area: '長崎市',
      address: '長崎市中心部',
      contactName: '田中 花子',
      phone: '095-000-0001',
      concept: '子どもたちが自分らしく育つ、あたたかい保育環境を大切にしています。一人ひとりの個性を尊重し、遊びを通じた学びを実践しています。',
      policy: '安心・安全な保育を第一に、保護者との連携を大切にしています。',
      isPublished: true,
    },
  })

  const soranoneProfile = await db.nurseryProfile.create({
    data: {
      userId: soranoneUser.id,
      nurseryName: 'そらのね保育園',
      area: '長崎市',
      address: '長崎市東部',
      contactName: '山田 一郎',
      phone: '095-000-0002',
      concept: '自然との触れ合いを大切にした保育を行っています。広い園庭で体を使った遊びを中心に、創造性豊かな子どもを育てます。',
      policy: '職員が連携しアットホームな雰囲気で、家庭的な保育を心がけています。',
      isPublished: true,
    },
  })

  // 保育士プロフィール
  const sakuraProfile = await db.seekerProfile.create({
    data: {
      userId: sakuraUser.id,
      realName: '佐藤 さくら',
      displayName: 'さくら',
      license: true,
      blankYears: '2年',
      preferredArea: '長崎市',
      preferredStyle: ['午前のみ', '短時間'],
      bio: '保育士歴5年、産休後に復帰を目指しています。乳児・幼児ともに経験があります。',
      experience: '認可保育所で0〜5歳児クラスを担当。行事の企画・運営も経験。',
      skills: '製作活動、リトミック、乳児保育',
      isPublished: true,
    },
  })

  const midoriProfile = await db.seekerProfile.create({
    data: {
      userId: midoriUser.id,
      realName: '鈴木 みどり',
      displayName: 'みどり',
      license: true,
      blankYears: '1年',
      preferredArea: '長崎市',
      preferredStyle: ['単発', '週1'],
      bio: '週1〜2日で働ける場所を探しています。幼稚園教諭の免許も持っています。',
      experience: '小規模保育所で2〜3歳児クラス担当。音楽活動が得意。',
      skills: 'ピアノ、外遊び、工作',
      isPublished: true,
    },
  })

  // 募集情報
  const job1 = await db.jobPosting.create({
    data: {
      nurseryId: hidamariProfile.id,
      title: '午前中サポート保育スタッフ募集',
      workContent: '0〜2歳児クラスの保育補助。着替え・食事・午睡のサポートをお願いします。',
      workDate: new Date('2025-07-10'),
      workTimeStart: '09:00',
      workTimeEnd: '13:00',
      hourlyWage: 1200,
      targetPerson: '保育士資格をお持ちの方',
      remarks: '駐車場あり。制服の貸出あり。',
      status: 'OPEN',
    },
  })

  await db.jobPosting.create({
    data: {
      nurseryId: soranoneProfile.id,
      title: '行事前サポートスタッフ（夏祭り準備）',
      workContent: '夏祭りの準備・当日サポート。飾り付け・出店補助など。',
      workDate: new Date('2025-07-20'),
      workTimeStart: '10:00',
      workTimeEnd: '15:00',
      targetPerson: '資格不問・保育補助経験者歓迎',
      status: 'OPEN',
    },
  })

  // 応募サンプル
  const application = await db.application.create({
    data: {
      jobId: job1.id,
      seekerId: sakuraProfile.id,
      applyMessage: 'ぜひよろしくお願いします。乳児保育の経験があります。',
      lineContactOk: true,
    },
  })

  // マッチングサンプル
  await db.match.create({
    data: {
      applicationId: application.id,
      jobId: job1.id,
      nurseryId: hidamariProfile.id,
      seekerId: sakuraProfile.id,
      status: 'APPLIED',
    },
  })

  console.log('✅ Seeding complete!')
  console.log('')
  console.log('テストアカウント:')
  console.log('  保育士:  sakura@example.com / password123')
  console.log('  保育士:  midori@example.com / password123')
  console.log('  保育園:  hidamari@example.com / password123')
  console.log('  保育園:  soranone@example.com / password123')
  console.log('  管理者:  admin@example.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
