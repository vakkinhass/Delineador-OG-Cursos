'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api/client'
import {
  ArrowLeft,
  Clock,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Save,
} from 'lucide-react'
import type { AnswerOption } from '@/lib/types'

interface ExamQuestion {
  id: string
  index: number
  subjectName: string
  statement: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
}

interface ExamRunnerProps {
  examId: string
  onBack: () => void
  onFinish: (examId: string) => void
}

export function ExamRunner({ examId, onBack, onFinish }: ExamRunnerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [examTitle, setExamTitle] = useState('')
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, AnswerOption>>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const answersRef = useRef<Record<string, AnswerOption>>({})
  const submittingRef = useRef(false)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Manter o ref de answers sincronizado
  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  // Iniciar prova
  useEffect(() => {
    const startExam = async () => {
      try {
        const data = await apiFetch<any>(`/api/exams/${examId}/start`, { method: 'POST' })
        if (data.error) {
          setError(data.error)
          setLoading(false)
          return
        }
        setExamTitle(data.questions[0]?.subjectName || 'Prova')
        setQuestions(data.questions)
        setAnswers(data.savedAnswers || {})
        setDeadline(new Date(data.deadline))
        setRemainingSeconds(Math.floor((new Date(data.deadline).getTime() - Date.now()) / 1000))
        setLoading(false)
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }
    startExam()
  }, [examId])

  // Função de submissão (useCallback para poder ser usada no useEffect do timer)
  const doSubmit = useCallback(
    async (autoSubmitted = false) => {
      if (submittingRef.current) return
      submittingRef.current = true
      setSubmitting(true)
      try {
        await apiFetch(`/api/exams/${examId}/submit`, {
          method: 'POST',
          body: JSON.stringify({ answers: answersRef.current, autoSubmitted }),
        })
        toast({
          title: autoSubmitted ? 'Tempo esgotado!' : 'Prova finalizada!',
          description: autoSubmitted
            ? 'Sua prova foi enviada automaticamente.'
            : 'Suas respostas foram registradas com sucesso.',
        })
        onFinish(examId)
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message, variant: 'destructive' })
        submittingRef.current = false
        setSubmitting(false)
      }
    },
    [examId, toast, onFinish]
  )

  // Countdown timer
  useEffect(() => {
    if (!deadline || loading) return
    const interval = setInterval(() => {
      const remaining = Math.floor((deadline.getTime() - Date.now()) / 1000)
      setRemainingSeconds(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        setTimeUp(true)
        if (!submittingRef.current) {
          doSubmit(true)
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [deadline, loading, doSubmit])

  // Auto-save quando answers muda (debounced)
  const handleSave = useCallback(async (answersToSave: Record<string, AnswerOption>) => {
    try {
      await apiFetch(`/api/exams/${examId}/save`, {
        method: 'POST',
        body: JSON.stringify({ answers: answersToSave }),
      })
      setLastSaved(new Date())
    } catch {
      // silent fail on auto-save
    }
  }, [examId])

  useEffect(() => {
    if (loading || Object.keys(answers).length === 0) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      handleSave(answers)
    }, 2000) as any
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [answers, loading, handleSave])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin mb-3 text-primary" />
        <p className="text-muted-foreground">Preparando sua prova...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto py-10">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-orange-500" />
          <h2 className="text-xl font-bold mb-2">Não é possível iniciar</h2>
          <p className="text-muted-foreground mb-5">{error}</p>
          <Button onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
          </Button>
        </Card>
      </div>
    )
  }

  const current = questions[currentIdx]
  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / questions.length) * 100
  const isLowTime = remainingSeconds <= 300 // últimos 5 min

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header fixo com cronômetro */}
      <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-md py-3 border-b">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => {
            if (confirm('Sair da prova? Suas respostas foram salvas automaticamente e você poderá retornar.')) onBack()
          }}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Sair
          </Button>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                <Save className="w-3 h-3" /> {lastSaved.toLocaleTimeString('pt-BR')}
              </span>
            )}
            <Badge
              variant={isLowTime ? 'destructive' : 'secondary'}
              className={`font-mono text-sm ${isLowTime ? 'animate-pulse' : ''}`}
            >
              <Clock className="w-3.5 h-3.5 mr-1" /> {formatTime(remainingSeconds)}
            </Badge>
          </div>
        </div>
        <Progress value={progress} className="mt-2 h-1.5" />
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {answeredCount} de {questions.length} questões respondidas • Salvamento automático ativo
        </p>
      </div>

      {/* Aviso de tempo baixo */}
      {isLowTime && !timeUp && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-3 border-destructive/40 bg-destructive/5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive font-medium">
              Restam menos de 5 minutos! A prova será enviada automaticamente ao esgotar o tempo.
            </p>
          </Card>
        </motion.div>
      )}

      {/* Questão atual */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge style={{ backgroundColor: 'var(--primary)' }} className="font-bold">
            Questão {current.index}
          </Badge>
          <Badge variant="secondary" className="text-xs">{current.subjectName}</Badge>
          <Badge variant="outline" className="text-xs ml-auto">
            {currentIdx + 1} de {questions.length}
          </Badge>
        </div>

        <p className="text-base font-medium mb-6 leading-relaxed">{current.statement}</p>

        <div className="space-y-2.5">
          {(['A', 'B', 'C', 'D'] as AnswerOption[]).map((letter) => {
            const text = (current as any)[`option${letter}`]
            const isSelected = answers[current.id] === letter
            return (
              <button
                key={letter}
                onClick={() => setAnswers({ ...answers, [current.id]: letter })}
                className={`w-full text-left p-3.5 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:bg-secondary/5'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}>
                  {letter}
                </div>
                <span className="text-sm">{text}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Navegação */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx(currentIdx - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>

        {/* Mapa de questões */}
        <div className="hidden sm:flex items-center gap-1 flex-1 justify-center overflow-x-auto custom-scroll max-w-md">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(i)}
              className={`w-8 h-8 rounded text-xs font-medium shrink-0 transition-all ${
                i === currentIdx
                  ? 'bg-primary text-primary-foreground'
                  : answers[q.id]
                  ? 'bg-primary/20 text-primary'
                  : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {currentIdx === questions.length - 1 ? (
          <Button onClick={() => setConfirmFinish(true)} style={{ backgroundColor: 'var(--accent)' }}>
            <Flag className="w-4 h-4 mr-1" /> Finalizar
          </Button>
        ) : (
          <Button onClick={() => setCurrentIdx(currentIdx + 1)}>
            Próxima <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Botão finalizar flutuante quando todas respondidas */}
      {answeredCount === questions.length && currentIdx !== questions.length - 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-4 border-green-500/30 bg-green-50/30 flex items-center justify-between">
            <p className="text-sm font-medium">
              Todas as questões foram respondidas! Deseja finalizar?
            </p>
            <Button onClick={() => setConfirmFinish(true)}>
              <Flag className="w-4 h-4 mr-1" /> Finalizar Prova
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Dialog de confirmação */}
      <AlertDialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar prova?</AlertDialogTitle>
            <AlertDialogDescription>
              Você respondeu {answeredCount} de {questions.length} questões.
              {answeredCount < questions.length && ' Questões não respondidas serão contabilizadas como erradas.'}
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => doSubmit(false)}
              className="bg-primary"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Sim, finalizar prova
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog tempo esgotado */}
      <AlertDialog open={timeUp}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tempo Esgotado!</AlertDialogTitle>
            <AlertDialogDescription>
              O tempo para realização da prova terminou. Suas respostas estão sendo enviadas automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
