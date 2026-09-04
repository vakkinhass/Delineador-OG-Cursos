'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import type { SessionUser } from '@/lib/types'
import { LoginScreen } from '@/components/app/login-screen'
import { AdminDashboard } from '@/components/app/admin-dashboard'
import { StudentDashboard } from '@/components/app/student-dashboard'

export default function Home() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const checkSession = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: SessionUser | null }>('/api/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const handleLogout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    setUser(null)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: 'var(--primary)' }} />
          <p className="text-muted-foreground text-sm">Carregando Ocean Green...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} />
  }

  if (user.role === 'ADMIN') {
    return <AdminDashboard user={user} onLogout={handleLogout} />
  }

  return <StudentDashboard user={user} onLogout={handleLogout} />
}
