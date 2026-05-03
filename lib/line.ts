const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push'

export async function sendLineMessage(lineUserId: string | null, message: string): Promise<void> {
  if (!lineUserId) {
    console.warn('[LINE] lineUserId が未設定のためスキップします')
    return
  }
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn('[LINE] LINE_CHANNEL_ACCESS_TOKEN が未設定のためスキップします')
    return
  }

  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: 'text', text: message }],
      }),
    })
    if (!res.ok) {
      console.error(`[LINE] 送信失敗: ${res.status} ${await res.text()}`)
    }
  } catch (err) {
    console.error('[LINE] 送信エラー:', err)
  }
}

export async function notifyApplicationReceived(
  nurseryLineUserId: string | null,
  seekerDisplayName: string,
  jobTitle: string
): Promise<void> {
  await sendLineMessage(
    nurseryLineUserId,
    `【えんまーる】新しい応募が届きました\n\n応募者：${seekerDisplayName}\n募集：${jobTitle}\n\nえんまーるのマイページからご確認ください。`
  )
}

export async function notifyMatchingConfirmed(
  seekerLineUserId: string | null,
  nurseryLineUserId: string | null,
  nurseryName: string,
  jobTitle: string
): Promise<void> {
  const message = `【えんまーる】マッチングが成立しました🌸\n\n${nurseryName}「${jobTitle}」\n\n当日の詳細はサイトよりご確認ください。ご不明点があればえんまーる公式LINEへご連絡ください。`
  await Promise.all([
    sendLineMessage(seekerLineUserId, message),
    sendLineMessage(nurseryLineUserId, message),
  ])
}

export async function notifyReviewRequest(
  lineUserId: string | null,
  appUrl: string,
  matchId: string
): Promise<void> {
  await sendLineMessage(
    lineUserId,
    `【えんまーる】本日はありがとうございました。\n\nよろしければ、簡単な評価へのご協力をお願いします。\n${appUrl}/reviews/${matchId}`
  )
}

export async function notifyWorkCompleted(
  adminLineUserId: string | null,
  matchId: string
): Promise<void> {
  await sendLineMessage(
    adminLineUserId,
    `【えんまーる】業務完了報告が届きました。\n\nマッチングID：${matchId}\n\n管理画面よりご確認ください。`
  )
}
