'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import {
  BarChart3,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Award,
} from 'lucide-react'
import type { TurmaDTO } from '@/lib/types'

interface ExamReport {
  examId: string
  title: string
  turmaName: string
  subjectName: string
  startDateTime: string
  questionCount: number
  totalStudents: number
  submittedCount: number
  statistics: { average: number; highest: number; lowest: number }
  results: {
    userId: string
    userName: string
    userCpf: string
    score: number
    correctCount: number
    totalQuestions: number
    timeSpentSeconds: number
    status: string
    submittedAt: string | null
  }[]
}

export function ReportsView() {
  const { toast } = useToast()
  const [turmas, setTurmas] = useState<TurmaDTO[]>([])
  const [selectedTurma, setSelectedTurma] = useState('ALL')
  const [reports, setReports] = useState<ExamReport[]>([])
  const [generalStats, setGeneralStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [turmasData, reportsData] = await Promise.all([
        apiFetch<{ turmas: TurmaDTO[] }>('/api/turmas'),
        apiFetch<{ examReports: ExamReport[]; generalStats: any }>(
          `/api/reports/grades${selectedTurma !== 'ALL' ? `?turmaId=${selectedTurma}` : ''}`
        ),
      ])
      setTurmas(turmasData.turmas)
      setReports(reportsData.examReports)
      setGeneralStats(reportsData.generalStats)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast, selectedTurma])

  useEffect(() => {
    load()
  }, [load])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}min ${s}s`
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>Relatórios</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Desempenho consolidado por turma e exportação de provas em PDF
          </p>
        </div>
        <Select value={selectedTurma} onValueChange={setSelectedTurma}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filtrar por turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as turmas</SelectItem>
            {turmas.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Estatísticas gerais */}
      {generalStats && !loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Provas"
            value={generalStats.totalExams}
            color="var(--accent)"
          />
          <StatCard
            icon={Users}
            label="Submissões"
            value={generalStats.totalSubmissions}
            color="var(--secondary)"
          />
          <StatCard
            icon={Award}
            label="Nota Média"
            value={`${generalStats.average.toFixed(1)}%`}
            color="var(--primary)"
          />
          <StatCard
            icon={TrendingUp}
            label="Maior Nota"
            value={`${generalStats.highest.toFixed(1)}%`}
            color="var(--primary)"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          Nenhum relatório disponível. Crie provas e aguarde as submissões.
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.examId} className="overflow-hidden">
              {/* Header do relatório */}
              <div className="p-5 border-b bg-secondary/5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-base">{report.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {report.turmaName} • {report.subjectName} • {report.questionCount} questões
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <a
                      href={`/api/reports/exam-pdf?id=${report.examId}&withKey=false`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="sm" variant="outline">
                        <Download className="w-3.5 h-3.5 mr-1" /> Prova
                      </Button>
                    </a>
                    <a
                      href={`/api/reports/exam-pdf?id=${report.examId}&withKey=true`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="sm" variant="outline" style={{ color: 'var(--primary)' }}>
                        <Download className="w-3.5 h-3.5 mr-1" /> Gabarito
                      </Button>
                    </a>
                  </div>
                </div>

                {/* Estatísticas da prova */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="rounded-lg bg-card p-3 border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Award className="w-3 h-3" /> Média
                    </div>
                    <p className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
                      {report.statistics.average.toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-card p-3 border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <TrendingUp className="w-3 h-3" /> Maior
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      {report.statistics.highest.toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-card p-3 border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <TrendingDown className="w-3 h-3" /> Menor
                    </div>
                    <p className="text-xl font-bold text-red-600">
                      {report.statistics.lowest.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabela de resultados */}
              {report.results.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhuma submissão registrada para esta prova.
                </div>
              ) : (
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/5 border-b">
                      <tr className="text-left">
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Aluno</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground text-center">Acertos</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground text-center">Nota</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground text-center hidden sm:table-cell">Tempo</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.results
                        .sort((a, b) => b.score - a.score)
                        .map((r) => (
                          <tr key={r.userId} className="border-b last:border-0 hover:bg-secondary/5">
                            <td className="px-4 py-2.5">
                              <p className="font-medium">{r.userName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{r.userCpf}</p>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {r.correctCount}/{r.totalQuestions}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <Badge
                                variant={r.score >= 70 ? 'default' : r.score >= 50 ? 'secondary' : 'destructive'}
                                className="font-bold"
                              >
                                {r.score.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5 text-center text-xs text-muted-foreground hidden sm:table-cell">
                              {formatTime(r.timeSpentSeconds)}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <Badge variant="outline" className="text-xs">
                                {r.status === 'AUTO_SUBMITTED' ? 'Auto' : 'Finalizada'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users
  label: string
  value: string | number
  color: string
}) {
  return (
    <Card className="p-4">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  )
}
