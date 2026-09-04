'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Lock, GraduationCap, ShieldCheck } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import type { SessionUser } from '@/lib/types'

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

interface LoginScreenProps {
  onLogin: (user: SessionUser) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')

      const digits = cpf.replace(/\D/g, '')
      if (digits.length !== 11) {
        setError('Informe os 11 dígitos do CPF.')
        return
      }

      setLoading(true)
      try {
        const data = await apiFetch<{ user: SessionUser }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ cpf }),
        })
        onLogin(data.user)
      } catch (err: any) {
        setError(err.message || 'Erro ao fazer login.')
      } finally {
        setLoading(false)
      }
    },
    [cpf, onLogin]
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Fundo gradiente oceano */}
      <div className="absolute inset-0 ocean-gradient opacity-95" />
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px, 60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo e título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/95 shadow-2xl mb-4 overflow-hidden">
            <img src="/logo-ocean.jpeg" alt="Ocean Green" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Ocean Green Treinamentos
          </h1>
          <p className="text-white/80 text-sm mt-1">
            Plataforma de Simulados e Avaliações
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm">
            <GraduationCap className="w-3.5 h-3.5 text-white" />
            <span className="text-xs text-white font-medium">Delineador Industrial</span>
          </div>
        </div>

        {/* Card de login */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-2xl text-center" style={{ color: 'var(--primary)' }}>
              Acesso ao Sistema
            </CardTitle>
            <CardDescription className="text-center">
              Informe seu CPF para acessar a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-sm font-medium">
                  CPF
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="cpf"
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(maskCpf(e.target.value))}
                    disabled={loading}
                    autoFocus
                    className="pl-10 text-lg tracking-wider font-mono h-12"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-2.5 text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading || cpf.replace(/\D/g, '').length !== 11}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground">
                Acesso restrito a usuários cadastrados.
                <br />
                Sem cadastro? Procure o administrador.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-white/70 text-xs mt-6">
          © {new Date().getFullYear()} Ocean Green Treinamentos. Todos os direitos reservados.
        </p>
      </motion.div>
    </div>
  )
}
