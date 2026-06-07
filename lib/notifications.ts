import { db } from '@/lib/db'

export const NOTIFICATION_TYPES = {
  MATCH_CONFIRMED:       'MATCH_CONFIRMED',
  DOCUMENT_APPROVED:     'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED:     'DOCUMENT_REJECTED',
  WORK_REPORT_SUBMITTED: 'WORK_REPORT_SUBMITTED',
  REVIEW_REQUESTED:      'REVIEW_REQUESTED',
} as const

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES]

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  linkUrl?: string
) {
  try {
    await db.notification.create({
      data: { userId, type, title, body, linkUrl: linkUrl ?? null },
    })
  } catch {
    // 通知作成失敗はメイン処理に影響させない
    console.error('Failed to create notification:', { userId, type })
  }
}
