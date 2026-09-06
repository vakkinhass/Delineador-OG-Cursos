'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

/**
 * Error Boundary - Captura erros de runtime no cliente e exibe
 * uma tela amigável em vez da tela branca de erro padrão do Next.js.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log do erro para debug (não quebra a aplicação)
    console.error('ErrorBoundary capturou:', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
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
              Ocorreu um erro inesperado na aplicação. Tente recarregar a página.
              Se o problema persistir, contate o administrador.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReload} variant="outline">
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Recarregar
              </Button>
              <Button onClick={this.handleGoHome}>
                Voltar ao Início
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap break-words bg-red-50 p-3 rounded">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
