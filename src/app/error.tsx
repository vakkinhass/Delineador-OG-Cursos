'use client'

/**
 * error.tsx - Captura erros de runtime nas rotas.
 * Exibe uma tela amigável em vez da tela branca de erro.
 */
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Route Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--primary)' }}>
          Ops! Algo deu errado
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Ocorreu um erro inesperado. Tente recarregar a página.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => reset()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Tentar Novamente
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            <Home className="w-4 h-4 mr-1.5" />
            Voltar ao Início
          </Button>
        </div>
      </Card>
    </div>
  )
}
