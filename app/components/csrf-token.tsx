'use client'

import { useEffect, useState } from 'react'
import { getCsrfToken } from 'next-auth/react'

export function CsrfTokenInput() {
  const [csrfToken, setCsrfToken] = useState<string>('')

  useEffect(() => {
    async function fetchCsrfToken() {
      const token = await getCsrfToken()
      if (token) setCsrfToken(token)
    }
    fetchCsrfToken()
  }, [])

  if (!csrfToken) return null

  return <input type="hidden" name="csrfToken" value={csrfToken} />
}