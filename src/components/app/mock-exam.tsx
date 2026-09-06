'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api/client'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Award,
  ChevronLeft,
  ChevronRight,
  Flag,
} from 'lucide-react'
import type { SubjectDTO, AnswerOption } from '@/lib/types'

type Phase = 'config' | 'exam' | 'result'

interface MockQuestion {
  id: string
  index: number
  subjectName: string
  statement: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
}

interface GradedQuestion extends MockQuestion {
  correctAnswer: AnswerOption
  userAnswer: AnswerOption | null
  isCorrect: boolean
  explanation: string
}

export function MockExam({ onBack }: { onBack: () => void }) {
  const { toast } = useToast()
  const [phase, setPhase] = useState<Phase>('config')
  const [subjects, setSubjects] = useState<SubjectDTO[]>([])
  const [loading, setLoading] = useState(false)

  // Config
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(10)

  // Exam
  const [questions, setQuestions] = useState<MockQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, AnswerOption>>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  // Result
  const [graded, setGraded] = useState<GradedQuestion[]>([])
  const [resultStats, setResultStats] = useState<any>(null)

  useEffect(() => {
    apiFetch<{ subjects: SubjectDTO[] }>('/api/subjects').then((d) => setSubjects(d.subjects))
  }, [])

  // Timer
  useEffect(() => {
    if (phase === 'exam' && startTime) {
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [phase, startTime])

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleStart = async () => {
    if (selectedSubjects.length === 0) {
      toast({ title: 'Atenção', description: 'Selecione ao menos uma disciplina.', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const data = await apiFetch<{ questions: MockQuestion[] }>('/api/mock-exam/generate', {
        method: 'POST',
        body: JSON.stringify({
          subjectIds: selectedSubjects,
          difficulty: 'EASY',
          count: questionCount,
        }),
      })
      setQuestions(data.questions)
      setAnswers({})
      setCurrentIdx(0)
      setStartTime(Date.now())
      setElapsed(0)
      setPhase('exam')
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<any>('/api/mock-exam/grade', {
        method: 'POST',
        body: JSON.stringify({ answers, timeSpentSeconds: elapsed }),
      })
      setGraded(data.results)
      setResultStats(data)
      setPhase('result')
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = () => {
    setPhase('config')
    setQuestions([])
    setAnswers({})
    setGraded([])
    setResultStats(null)
  }

  // ===== FASE: CONFIG =====
  if (phase === 'config') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>Simulado Livre</h2>
            <p className="text-sm text-muted-foreground">Configure seu simulado de treino</p>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">1. Selecione as disciplinas</Label>
            <div className="grid sm:grid-cols-2 gap-2">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleSubject(s.id)}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${
                    selectedSubjects.includes(s.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{s.name}</span>
                    {selectedSubjects.includes(s.id) && (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(s as any).questionCount || 0} questões disponíveis
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">2. Número de questões</Label>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15, 20, 30].map((n) => (
                <Button
                  key={n}
                  variant={questionCount === n ? 'default' : 'outline'}
                  onClick={() => setQuestionCount(n)}
                >
                  {n} questões
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-secondary/10 p-4 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 inline mr-1.5" />
            O cronômetro é opcional neste modo. Você terá feedback imediato ao final com gabarito comentado.
          </div>

          <Button onClick={handleStart} disabled={loading || selectedSubjects.length === 0} className="w-full" size="lg">
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <BookOpen className="w-5 h-5 mr-2" />}
            Gerar e Iniciar Simulado
          </Button>
        </Card>
      </div>
    )
  }

  // ===== FASE: EXAM =====
  if (phase === 'exam') {
    const current = questions[currentIdx]
    const answeredCount = Object.keys(answers).length
    const progress = (answeredCount / questions.length) * 100
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header fixo */}
        <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-md py-3 border-b">
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={() => {
              if (confirm('Sair do simulado? Suas respostas serão perdidas.')) onBack()
            }}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Sair
            </Button>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-mono">
                <Clock className="w-3 h-3 mr-1" /> {formatTime(elapsed)}
              </Badge>
              <Badge variant="outline">{answeredCount}/{questions.length} respondidas</Badge>
            </div>
          </div>
          <Progress value={progress} className="mt-2 h-1.5" />
        </div>

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
          <div className="hidden sm:flex items-center gap-1 flex-1 justify-center overflow-x-auto custom-scroll">
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
            <Button onClick={handleFinish} disabled={loading} style={{ backgroundColor: 'var(--accent)' }}>
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Flag className="w-4 h-4 mr-1" />}
              Finalizar
            </Button>
          ) : (
            <Button onClick={() => setCurrentIdx(currentIdx + 1)}>
              Próxima <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {answeredCount === questions.length && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-4 border-green-500/30 bg-green-50/30 flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Todas as questões foram respondidas!
              </p>
              <Button onClick={handleFinish} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Flag className="w-4 h-4 mr-1" />}
                Ver Resultado
              </Button>
            </Card>
          </motion.div>
        )}
      </div>
    )
  }

  // ===== FASE: RESULT =====
  if (phase === 'result' && resultStats) {
    const score = resultStats.score
    const passed = score >= 70
    const formatTime = (s: number) => `${Math.floor(s / 60)}min ${s % 60}s`

    return (
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Card de resultado */}
        <Card className="p-6 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${
            passed ? 'bg-green-100' : 'bg-orange-100'
          }`}>
            <Award className={`w-10 h-10 ${passed ? 'text-green-600' : 'text-orange-600'}`} />
          </div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: passed ? 'var(--primary)' : 'var(--accent)' }}>
            {passed ? 'Parabéns!' : 'Continue praticando!'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Simulado Livre Concluído</p>

          <div className="text-5xl font-bold mb-2" style={{ color: passed ? 'var(--primary)' : 'var(--accent)' }}>
            {score.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground">
            {resultStats.correctCount} de {resultStats.totalQuestions} questões corretas
          </p>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="rounded-lg bg-secondary/10 p-3">
              <CheckCircle className="w-4 h-4 text-green-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-600">{resultStats.correctCount}</p>
              <p className="text-xs text-muted-foreground">Acertos</p>
            </div>
            <div className="rounded-lg bg-secondary/10 p-3">
              <XCircle className="w-4 h-4 text-red-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-red-600">{resultStats.wrongCount}</p>
              <p className="text-xs text-muted-foreground">Erros</p>
            </div>
            <div className="rounded-lg bg-secondary/10 p-3">
              <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold">{formatTime(resultStats.timeSpentSeconds)}</p>
              <p className="text-xs text-muted-foreground">Tempo</p>
            </div>
          </div>

          <div className="flex gap-2 mt-6 justify-center">
            <Button onClick={handleRestart} variant="outline">
              <RefreshCw className="w-4 h-4 mr-1.5" /> Novo Simulado
            </Button>
            <Button onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar ao Início
            </Button>
          </div>
        </Card>

        {/* Desempenho por disciplina */}
        {resultStats.bySubject && Object.keys(resultStats.bySubject).length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Desempenho por Disciplina</h3>
            <div className="space-y-2">
              {Object.entries(resultStats.bySubject).map(([subject, stats]: [string, any]) => (
                <div key={subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{subject}</span>
                    <span className="text-muted-foreground">{stats.correct}/{stats.total}</span>
                  </div>
                  <Progress value={(stats.correct / stats.total) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Gabarito comentado */}
        <div>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--primary)' }}>Gabarito Comentado</h3>
          <div className="space-y-3">
            {graded.map((q) => (
              <Card key={q.id} className={`p-4 ${q.isCorrect ? 'border-green-500/30' : 'border-red-500/30'}`}>
                <div className="flex items-center gap-2 mb-2">
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
                        <span>{text}</span>
                        {isCorrect && <CheckCircle className="w-3.5 h-3.5 ml-auto" />}
                        {isUser && !isCorrect && <XCircle className="w-3.5 h-3.5 ml-auto" />}
                      </div>
                    )
                  })}
                </div>
                {q.explanation && (
                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground italic">
                    <strong>Comentário:</strong> {q.explanation}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}
