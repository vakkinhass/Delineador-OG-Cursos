'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api/client'
import { Search, Loader2, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import type { SubjectDTO, QuestionDTO } from '@/lib/types'

export function QuestionsViewer() {
  const { toast } = useToast()
  const [subjects, setSubjects] = useState<SubjectDTO[]>([])
  const [questions, setQuestions] = useState<QuestionDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const subjectsData = await apiFetch<{ subjects: (SubjectDTO & { questionCount?: number })[] }>('/api/subjects')
      setSubjects(subjectsData.subjects)

      // Buscar questões de cada disciplina
      const allQuestions: QuestionDTO[] = []
      for (const s of subjectsData.subjects) {
        const qData = await apiFetch<{ questions: any[] }>(`/api/questions/mock?subjectId=${s.id}&count=100`)
        allQuestions.push(...qData.questions.map((q) => ({
          ...q,
          correctAnswer: q.correctAnswer || 'A',
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'EASY',
        })))
      }
      setQuestions(allQuestions)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const filtered = questions.filter((q) => {
    const matchSearch = q.statement.toLowerCase().includes(search.toLowerCase())
    const matchSubject = subjectFilter === 'ALL' || q.subjectId === subjectFilter
    return matchSearch && matchSubject
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>Banco de Questões</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {questions.length} questões cadastradas no sistema
        </p>
      </div>

      {/* Cards de disciplinas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {subjects.map((s) => (
          <Card key={s.id} className="p-4 text-center">
            <BookOpen className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--primary)' }} />
            <p className="text-xs font-medium leading-tight">{s.name}</p>
            <p className="text-lg font-bold mt-1" style={{ color: 'var(--accent)' }}>
              {(s as any).questionCount || 0}
            </p>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar questões..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="pl-9"
          />
        </div>
        <Select value={subjectFilter} onValueChange={(v) => { setSubjectFilter(v); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Disciplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as disciplinas</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de questões */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : paged.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Nenhuma questão encontrada.
        </Card>
      ) : (
        <div className="space-y-3">
          {paged.map((q, i) => (
            <Card key={q.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  #{page * pageSize + i + 1}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {q.subjectName || subjects.find((s) => s.id === q.subjectId)?.name}
                </Badge>
                <Badge className="text-xs ml-auto" style={{ backgroundColor: 'var(--primary)' }}>
                  Resposta: {q.correctAnswer}
                </Badge>
              </div>
              <p className="text-sm font-medium mb-2">{q.statement}</p>
              <div className="grid sm:grid-cols-2 gap-1 text-sm">
                <p className={q.correctAnswer === 'A' ? 'font-bold text-primary' : 'text-muted-foreground'}>A) {q.optionA}</p>
                <p className={q.correctAnswer === 'B' ? 'font-bold text-primary' : 'text-muted-foreground'}>B) {q.optionB}</p>
                <p className={q.correctAnswer === 'C' ? 'font-bold text-primary' : 'text-muted-foreground'}>C) {q.optionC}</p>
                <p className={q.correctAnswer === 'D' ? 'font-bold text-primary' : 'text-muted-foreground'}>D) {q.optionD}</p>
              </div>
              {q.explanation && (
                <p className="text-xs text-muted-foreground italic mt-2 pt-2 border-t">
                  {q.explanation}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="icon"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            size="icon"
            variant="outline"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
