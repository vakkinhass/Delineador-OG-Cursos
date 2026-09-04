'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api/client'
import {
  ArrowLeft,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react'
import type { AnswerOption } from '@/lib/types'

interface ExamResultViewProps {
  examId: string
  onBack: () => void
}

export function ExamResultView({ examId, onBack }: ExamResultViewProps) {
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<any>(`/api/exams/${examId}/result`)
      .then((d) => setData(d))
      .catch((err) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [examId, toast])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin mb-3 text-primary" />
        <p className="text-muted-foreground">Carregando resultado...</p>
      </div>
    )
  }

  if (!data) return null

  const { result, questions } = data
  const NOTA_CORTE = 60
  const passed = result.score >= NOTA_CORTE
  const formatTime = (s: number) => `${Math.floor(s / 60)}min ${s % 60}s`

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>Resultado da Prova</h2>
          <p className="text-sm text-muted-foreground">{result.examTitle}</p>
        </div>
      </div>

      {/* Card de resultado */}
      <Card className="p-6 text-center">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${
          passed ? 'bg-green-100' : 'bg-orange-100'
        }`}>
          <Award className={`w-10 h-10 ${passed ? 'text-green-600' : 'text-orange-600'}`} />
        </div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: passed ? 'var(--primary)' : 'var(--accent)' }}>
          {passed ? 'Aprovado!' : 'Você está de recuperação'}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {result.status === 'AUTO_SUBMITTED' ? 'Enviada automaticamente (tempo esgotado)' : 'Prova finalizada'}
          {!passed && ' • Nota abaixo de 6,0'}
        </p>
        {!passed && (
          <div className="rounded-lg border p-3 mb-4" style={{ backgroundColor: 'var(--accent)10', borderColor: 'var(--accent)40' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              📝 Prova de recuperação liberada!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              A recuperação já está disponível na sua página inicial. Você tem 7 dias para realizá-la.
            </p>
          </div>
        )}

        <div className="text-5xl font-bold mb-2" style={{ color: passed ? 'var(--primary)' : 'var(--accent)' }}>
          {result.score.toFixed(1)}%
        </div>
        <p className="text-sm text-muted-foreground">
          {result.correctCount} de {result.totalQuestions} questões corretas
        </p>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="rounded-lg bg-secondary/10 p-3">
            <CheckCircle className="w-4 h-4 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-600">{result.correctCount}</p>
            <p className="text-xs text-muted-foreground">Acertos</p>
          </div>
          <div className="rounded-lg bg-secondary/10 p-3">
            <XCircle className="w-4 h-4 text-red-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-red-600">{result.totalQuestions - result.correctCount}</p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </div>
          <div className="rounded-lg bg-secondary/10 p-3">
            <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{formatTime(result.timeSpentSeconds)}</p>
            <p className="text-xs text-muted-foreground">Tempo</p>
          </div>
        </div>

        {result.submittedAt && (
          <p className="text-xs text-muted-foreground mt-4">
            Submetida em: {new Date(result.submittedAt).toLocaleString('pt-BR')}
          </p>
        )}
      </Card>

      {/* Gabarito comentado */}
      <div>
        <h3 className="font-semibold mb-3" style={{ color: 'var(--primary)' }}>Gabarito Comentado</h3>
        <div className="space-y-3">
          {questions.map((q: any) => (
            <Card key={q.id} className={`p-4 ${q.isCorrect ? 'border-green-500/30' : 'border-red-500/30'}`}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className="text-xs">Q{q.index}</Badge>
                <Badge variant="secondary" className="text-xs">{q.subjectName}</Badge>
                {q.isCorrect ? (
                  <Badge className="bg-green-600 text-xs ml-auto">
                    <CheckCircle className="w-3 h-3 mr-1" /> Correto
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs ml-auto">
                    <XCircle className="w-3 h-3 mr-1" /> Incorreto
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium mb-2">{q.statement}</p>
              <div className="space-y-1 text-sm">
                {(['A', 'B', 'C', 'D'] as AnswerOption[]).map((letter) => {
                  const text = (q as any)[`option${letter}`]
                  const isCorrect = q.correctAnswer === letter
                  const isUser = q.userAnswer === letter
                  return (
                    <div
                      key={letter}
                      className={`flex items-center gap-2 p-1.5 rounded ${
                        isCorrect ? 'bg-green-50 font-semibold text-green-700'
                        : isUser ? 'bg-red-50 text-red-700'
                        : 'text-muted-foreground'
                      }`}
                    >
                      <span className="font-bold">{letter})</span>
                      <span className="flex-1">{text}</span>
                      {isCorrect && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                      {isUser && !isCorrect && <XCircle className="w-3.5 h-3.5 shrink-0" />}
                    </div>
                  )
                })}
              </div>
              {!q.userAnswer && (
                <p className="text-xs text-orange-600 mt-2 italic">Não respondida</p>
              )}
              {q.explanation && (
                <div className="mt-2 pt-2 border-t text-xs text-muted-foreground italic">
                  <strong>Comentário:</strong> {q.explanation}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      <Button onClick={onBack} className="w-full">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar ao Início
      </Button>
    </div>
  )
}
