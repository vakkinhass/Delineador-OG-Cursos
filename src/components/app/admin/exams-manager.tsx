'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api/client'
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Loader2,
  UserCheck,
  Download,
  Eye,
  X,
} from 'lucide-react'
import type { ExamDTO, TurmaDTO, SubjectDTO, UserDTO, ExamAssignmentDTO } from '@/lib/types'

// Helper para formatar datetime-local
function toLocalInput(date: Date): string {
  if (!date || isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function getExamStatus(exam: ExamDTO): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  try {
    const now = new Date()
    const start = new Date(exam.startDateTime)
    const end = new Date(exam.endDateTime)
    if (!exam.active) return { label: 'Inativa', variant: 'destructive' }
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return { label: '—', variant: 'outline' }
    if (now < start) return { label: 'Agendada', variant: 'secondary' }
    if (now > end) return { label: 'Encerrada', variant: 'outline' }
    return { label: 'Disponível', variant: 'default' }
  } catch {
    return { label: '—', variant: 'outline' }
  }
}

export function ExamsManager() {
  const { toast } = useToast()
  const [exams, setExams] = useState<ExamDTO[]>([])
  const [turmas, setTurmas] = useState<TurmaDTO[]>([])
  const [subjects, setSubjects] = useState<SubjectDTO[]>([])
  const [users, setUsers] = useState<UserDTO[]>([])
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    turmaId: '',
    subjectIds: [] as string[],
    difficulty: 'EASY',
    questionCount: 10,
    startDateTime: '',
    endDateTime: '',
    durationMinutes: 60,
  })

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignExam, setAssignExam] = useState<ExamDTO | null>(null)
  const [assignForm, setAssignForm] = useState({
    userId: '',
    startDateTime: '',
    endDateTime: '',
    durationMinutes: 0,
  })
  const [assignments, setAssignments] = useState<ExamAssignmentDTO[]>([])

  // View exam dialog
  const [viewExam, setViewExam] = useState<ExamDTO | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [examsData, turmasData, subjectsData, usersData] = await Promise.all([
        apiFetch<{ exams: ExamDTO[] }>('/api/exams'),
        apiFetch<{ turmas: TurmaDTO[] }>('/api/turmas'),
        apiFetch<{ subjects: SubjectDTO[] }>('/api/subjects'),
        apiFetch<{ users: UserDTO[] }>('/api/users'),
      ])
      setExams(examsData.exams)
      setTurmas(turmasData.turmas)
      setSubjects(subjectsData.subjects)
      setUsers(usersData.users.filter((u) => u.role === 'STUDENT'))
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    const now = new Date()
    const start = new Date(now.getTime() + 60 * 60 * 1000) // +1h
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000) // +2h
    setForm({
      title: '',
      description: '',
      turmaId: turmas[0]?.id || '',
      subjectIds: [],
      difficulty: 'EASY',
      questionCount: 10,
      startDateTime: toLocalInput(start),
      endDateTime: toLocalInput(end),
      durationMinutes: 60,
    })
    setCreateOpen(true)
  }

  const handleCreate = async () => {
    if (!form.title.trim() || !form.startDateTime || !form.endDateTime) {
      toast({ title: 'Atenção', description: 'Preencha título e datas.', variant: 'destructive' })
      return
    }
    const startDate = new Date(form.startDateTime)
    const endDate = new Date(form.endDateTime)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast({ title: 'Atenção', description: 'Datas inválidas.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      await apiFetch('/api/exams', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
        }),
      })
      toast({ title: 'Sucesso', description: 'Prova criada com sucesso.' })
      setCreateOpen(false)
      load()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta prova?')) return
    try {
      await apiFetch(`/api/exams/${id}`, { method: 'DELETE' })
      toast({ title: 'Sucesso', description: 'Prova removida.' })
      load()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const openAssign = async (exam: ExamDTO) => {
    setAssignExam(exam)
    setAssignForm({
      userId: '',
      startDateTime: toLocalInput(new Date(exam.startDateTime)),
      endDateTime: toLocalInput(new Date(exam.endDateTime)),
      durationMinutes: exam.durationMinutes,
    })
    setAssignOpen(true)
    // Carregar agendamentos existentes
    try {
      const data = await apiFetch<{ exam: any }>(`/api/exams/${exam.id}`)
      setAssignments(data.exam.assignments || [])
    } catch {
      setAssignments([])
    }
  }

  const handleAssign = async () => {
    if (!assignExam || !assignForm.userId || !assignForm.startDateTime || !assignForm.endDateTime) {
      toast({ title: 'Atenção', description: 'Selecione o aluno e defina as datas.', variant: 'destructive' })
      return
    }
    const startDate = new Date(assignForm.startDateTime)
    const endDate = new Date(assignForm.endDateTime)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast({ title: 'Atenção', description: 'Datas inválidas.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      await apiFetch(`/api/exams/${assignExam.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          userId: assignForm.userId,
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          durationMinutes: assignForm.durationMinutes,
        }),
      })
      toast({ title: 'Sucesso', description: 'Prova agendada para o aluno.' })
      // Recarregar agendamentos
      const data = await apiFetch<{ exam: any }>(`/api/exams/${assignExam.id}`)
      setAssignments(data.exam.assignments || [])
      setAssignForm({ ...assignForm, userId: '' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveAssign = async (userId: string) => {
    if (!assignExam) return
    try {
      await apiFetch(`/api/exams/${assignExam.id}/assign?userId=${userId}`, { method: 'DELETE' })
      toast({ title: 'Sucesso', description: 'Agendamento removido.' })
      const data = await apiFetch<{ exam: any }>(`/api/exams/${assignExam.id}`)
      setAssignments(data.exam.assignments || [])
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>Provas Oficiais</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Crie provas programadas e agende para turmas ou alunos específicos
          </p>
        </div>
        <Button onClick={openCreate} className="self-start">
          <Plus className="w-4 h-4 mr-1.5" />
          Nova Prova
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : exams.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          Nenhuma prova criada.
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {exams.map((exam) => {
            const status = getExamStatus(exam)
            return (
              <Card key={exam.id} className="p-5 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{exam.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {exam.turmaName || 'Sem turma'} • {exam.subjectName || 'Multi'} • {exam.questionCount} questões
                    </p>
                  </div>
                  <Badge variant={status.variant} className="text-xs shrink-0">
                    {status.label}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Início: {formatDate(exam.startDateTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Término: {formatDate(exam.endDateTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Duração: {exam.durationMinutes} min</span>
                  </div>
                  {exam.assignmentCount ? (
                    <div className="flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span className="font-medium">{exam.assignmentCount} agendamento(s) individual(is)</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => setViewExam(exam)}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> Visualizar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openAssign(exam)}>
                    <UserCheck className="w-3.5 h-3.5 mr-1" /> Agendar Aluno
                  </Button>
                  <a
                    href={`/api/reports/exam-pdf?id=${exam.id}&withKey=false`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" variant="ghost">
                      <Download className="w-3.5 h-3.5 mr-1" /> PDF
                    </Button>
                  </a>
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(exam.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog Criar Prova */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto custom-scroll">
          <DialogHeader>
            <DialogTitle>Nova Prova Oficial</DialogTitle>
            <DialogDescription>
              Defina a janela de tempo (início e fim) e a duração. A prova só ficará disponível neste período.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título da Prova</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Prova Oficial - Módulo 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Turma</Label>
                <Select value={form.turmaId} onValueChange={(v) => setForm({ ...form, turmaId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar turma" /></SelectTrigger>
                  <SelectContent>
                    {turmas.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dificuldade</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Fácil</SelectItem>
                    <SelectItem value="MEDIUM">Médio</SelectItem>
                    <SelectItem value="HARD">Difícil</SelectItem>
                    <SelectItem value="ANY">Todas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Disciplinas (selecione para sortear questões)</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-lg p-3 max-h-32 overflow-y-auto custom-scroll">
                {subjects.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={form.subjectIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, subjectIds: [...form.subjectIds, s.id] })
                        } else {
                          setForm({ ...form, subjectIds: form.subjectIds.filter((id) => id !== s.id) })
                        }
                      }}
                      className="rounded border-input"
                    />
                    <span className="truncate">{s.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Deixe vazio para usar todas as disciplinas
              </p>
            </div>

            <div className="space-y-2">
              <Label>Número de Questões</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.questionCount}
                onChange={(e) => setForm({ ...form, questionCount: parseInt(e.target.value) || 10 })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data/Hora de Início</Label>
                <Input
                  type="datetime-local"
                  value={form.startDateTime}
                  onChange={(e) => setForm({ ...form, startDateTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data/Hora de Término</Label>
                <Input
                  type="datetime-local"
                  value={form.endDateTime}
                  onChange={(e) => setForm({ ...form, endDateTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duração da Prova (minutos)</Label>
              <Input
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 60 })}
              />
              <p className="text-xs text-muted-foreground">
                Tempo máximo que o aluno tem para realizar a prova após iniciá-la
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Criar Prova
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Agendar para Aluno Específico */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto custom-scroll">
          <DialogHeader>
            <DialogTitle>Agendar Prova para Aluno Específico</DialogTitle>
            <DialogDescription>
              {assignExam?.title}
              <br />
              Defina data/hora de início e término personalizadas para este aluno. A prova será liberada apenas no horário definido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Aluno</Label>
              <Select value={assignForm.userId} onValueChange={(v) => setAssignForm({ ...assignForm, userId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar aluno" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {u.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Início (liberação)</Label>
                <Input
                  type="datetime-local"
                  value={assignForm.startDateTime}
                  onChange={(e) => setAssignForm({ ...assignForm, startDateTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Término (fechamento)</Label>
                <Input
                  type="datetime-local"
                  value={assignForm.endDateTime}
                  onChange={(e) => setAssignForm({ ...assignForm, endDateTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duração (minutos)</Label>
              <Input
                type="number"
                min={1}
                value={assignForm.durationMinutes}
                onChange={(e) => setAssignForm({ ...assignForm, durationMinutes: parseInt(e.target.value) || 60 })}
              />
              <p className="text-xs text-muted-foreground">
                Tempo que o aluno tem para realizar a prova após iniciar
              </p>
            </div>

            <Button onClick={handleAssign} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <UserCheck className="w-4 h-4 mr-1.5" />}
              Agendar para o Aluno
            </Button>

            {/* Lista de agendamentos existentes */}
            {assignments.length > 0 && (
              <div className="space-y-2">
                <Label>Agendamentos individuais ativos</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scroll">
                  {assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{a.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(a.startDateTime)} → {formatDate(a.endDateTime)}
                        </p>
                        <p className="text-xs text-muted-foreground">Duração: {a.durationMinutes} min</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => handleRemoveAssign(a.userId)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizar Prova */}
      {viewExam && (
        <ExamViewDialog examId={viewExam.id} onClose={() => setViewExam(null)} />
      )}
    </div>
  )
}

function ExamViewDialog({ examId, onClose }: { examId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<{ exam: any; questions: any[] }>(`/api/exams/${examId}`)
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [examId])

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scroll">
        <DialogHeader>
          <DialogTitle>{data?.exam?.title || 'Carregando...'}</DialogTitle>
          <DialogDescription>
            {data?.exam?.turmaName} • {data?.exam?.totalQuestions} questões
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto custom-scroll">
            {data?.questions?.map((q: any) => (
              <Card key={q.id} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Q{q.index}</Badge>
                  <Badge variant="secondary" className="text-xs">{q.subjectName}</Badge>
                  <Badge className="ml-auto" style={{ backgroundColor: 'var(--primary)' }}>
                    Gabarito: {q.correctAnswer}
                  </Badge>
                </div>
                <p className="text-sm font-medium mb-2">{q.statement}</p>
                <div className="space-y-1 text-sm">
                  <p className={q.correctAnswer === 'A' ? 'font-bold text-primary' : ''}>A) {q.optionA}</p>
                  <p className={q.correctAnswer === 'B' ? 'font-bold text-primary' : ''}>B) {q.optionB}</p>
                  <p className={q.correctAnswer === 'C' ? 'font-bold text-primary' : ''}>C) {q.optionC}</p>
                  <p className={q.correctAnswer === 'D' ? 'font-bold text-primary' : ''}>D) {q.optionD}</p>
                </div>
                {q.explanation && (
                  <p className="text-xs text-muted-foreground italic mt-2 border-t pt-2">
                    {q.explanation}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
