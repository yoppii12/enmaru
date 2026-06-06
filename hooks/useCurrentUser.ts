'use client'

import { useState, useEffect } from 'react'
import type { UserRole } from '@/types'

type CurrentUserInfo = {
  role: UserRole
  email: string | null
} | null

export function useCurrentUser() {
  const [userInfo, setUserInfo] = useState<CurrentUserInfo>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user) {
          setUserInfo({ role: data.user.role, email: data.user.email ?? null })
        }
      })
      .catch(() => {})
  }, [])

  return userInfo
}
