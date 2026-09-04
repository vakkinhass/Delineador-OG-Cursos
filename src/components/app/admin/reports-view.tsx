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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
} from 'lucide-react'
import type { TurmaDTO } from '@/lib/types'

// Interface do relatório consolidado (com recuperação)
interface TurmaReportRow {
  nome: string
  cpf: string
  dataProva: string
  horario: string
  duracao: string
  notaObtida: number
  notaRecuperacao: number | null
  recoveryStatus: string
  mediaFinal: number
  situacao: string
}

interface TurmaReportExam {
  examId: string
  title: string
  turmaName: string
  subjectName: string
  questionCount: number
  totalAlunos: number
  aprovados: number
  reprovados: number
  recuperacaoPendente: number
  statistics: { media: number; maior: number; menor: number }
  rows: TurmaReportRow[]
}

// Interface do relatório antigo (provas individuais)
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
  const [turmaReports, setTurmaReports] = useState<TurmaReportExam[]>([])
  const [reports, setReports] = useState<ExamReport[]>([])
  const [generalStats, setGeneralStats] = useState<any>(null)
  const [notaCorte, setNotaCorte] = useState(60)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [turmasData, turmaReportData, gradesData] = await Promise.all([
        apiFetch<{ turmas: TurmaDTO[] }>('/api/turmas'),
        apiFetch<{ examReports: TurmaReportExam[]; notaCorte: number }>(
          `/api/reports/turma-report${selectedTurma !== 'ALL' ? `?turmaId=${selectedTurma}` : ''}`
        ),
        apiFetch<{ examReports: ExamReport[]; generalStats: any }>(
          `/api/reports/grades${selectedTurma !== 'ALL' ? `?turmaId=${selectedTurma}` : ''}`
        ),
      ])
      setTurmas(turmasData.turmas)
      setTurmaReports(turmaReportData.examReports)
      setNotaCorte(turmaReportData.notaCorte)
      setReports(gradesData.examReports)
      setGeneralStats(gradesData.generalStats)
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

  const turmaName = turmaReports[0]?.turmaName || 'Todas as Turmas'

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>Relatórios</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Desempenho consolidado, recuperações e exportação em PDF
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Nota de corte: {(notaCorte / 10).toFixed(1)}
          </Badge>
          <Select value={selectedTurma} onValueChange={setSelectedTurma}>
            <SelectTrigger className="w-full sm:w-56">
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
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="consolidado" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="consolidado">Relatório Consolidado</TabsTrigger>
            <TabsTrigger value="provas">Por Prova</TabsTrigger>
          </TabsList>

          {/* ===== ABA: RELATÓRIO CONSOLIDADO ===== */}
          <TabsContent value="consolidado" className="space-y-4">
            {/* Botão de exportação PDF */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">
                {turmaReports.length} prova(s) • Notas, recuperações e média final por aluno
              </p>
              <a
                href={`/api/reports/turma-pdf${selectedTurma !== 'ALL' ? `?turmaId=${selectedTurma}` : ''}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button>
                  <Download className="w-4 h-4 mr-1.5" />
                  Exportar Relatório em PDF
                </Button>
              </a>
            </div>

            {turmaReports.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                Nenhum relatório disponível. Aguarde as submissões dos alunos.
              </Card>
            ) : (
              turmaReports.map((exam) => (
                <Card key={exam.examId} className="overflow-hidden">
                  {/* Header da prova */}
                  <div className="p-4 border-b" style={{ background: 'linear-gradient(90deg, var(--primary)15, transparent)' }}>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-base">{exam.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {exam.turmaName} • {exam.subjectName} • {exam.questionCount} questões
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="w-3 h-3" /> {exam.aprovados} Aprov.
                        </Badge>
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="w-3 h-3" /> {exam.reprovados} Reprov.
                        </Badge>
                        {exam.recuperacaoPendente > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <RotateCcw className="w-3 h-3" /> {exam.recuperacaoPendente} Recup.
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* Estatísticas */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="rounded-lg bg-card p-2 border text-center">
                        <p className="text-xs text-muted-foreground">Média</p>
                        <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
                          {exam.statistics.media.toFixed(1)}%
                        </p>
                      </div>
                      <div className="rounded-lg bg-card p-2 border text-center">
                        <p className="text-xs text-muted-foreground">Maior</p>
                        <p className="text-lg font-bold text-green-600">
                          {exam.statistics.maior.toFixed(1)}%
                        </p>
                      </div>
                      <div className="rounded-lg bg-card p-2 border text-center">
                        <p className="text-xs text-muted-foreground">Menor</p>
                        <p className="text-lg font-bold text-red-600">
                          {exam.statistics.menor.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tabela consolidada */}
                  {exam.rows.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Nenhuma submissão registrada.
                    </div>
                  ) : (
                    <div className="overflow-x-auto custom-scroll">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/10 border-b">
                          <tr className="text-left">
                            <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Aluno</th>
                            <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">CPF</th>
                            <th className="px-3 py-2.5 font-medium text-muted-foreground text-center whitespace-nowrap">Data</th>
                            <th className="px-3 py-2.5 font-medium text-muted-foreground text-center whitespace-nowrap">Horário</th>
                            <th className="px-3 py-2.5 font-medium text-muted-foreground text-center whitespace-nowrap">Duração</th>
                            <th className="px-3 py-2.5 font-medium text-muted-foreground text-center whitespace-nowrap">Nota</th>
                            <th className="px-3 py-2.5 font-medium text-muted-foreground text-center whitespace-nowrap">Recup.</th>
                            <th className="px-3 py-2.5 font-medium text-muted-foreground text-center whitespace-nowrap">Média Final</th>
                            <th className="px-3 py-2.5 font-medium text-muted-foreground text-center whitespace-nowrap">Situação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exam.rows.map((row, idx) => (
                            <tr key={idx} className="border-b last:border-0 hover:bg-secondary/5">
                              <td className="px-3 py-2.5 font-medium whitespace-nowrap">{row.nome}</td>
                              <td className="px-3 py-2.5 font-mono text-xs">{row.cpf}</td>
                              <td className="px-3 py-2.5 text-center text-xs whitespace-nowrap">{row.dataProva}</td>
                              <td className="px-3 py-2.5 text-center text-xs whitespace-nowrap">{row.horario}</td>
                              <td className="px-3 py-2.5 text-center text-xs whitespace-nowrap">{row.duracao}</td>
                              <td className="px-3 py-2.5 text-center">
                                <Badge
                                  variant={row.notaObtida >= notaCorte ? 'default' : 'destructive'}
                                  className="font-bold text-xs"
                                >
                                  {row.notaObtida.toFixed(1)}%
                                </Badge>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {row.notaRecuperacao !== null ? (
                                  <Badge
                                    variant={row.notaRecuperacao >= notaCorte ? 'default' : 'destructive'}
                                    className="font-bold text-xs"
                                  >
                                    {row.notaRecuperacao.toFixed(1)}%
                                  </Badge>
                                ) : row.recoveryStatus === 'Pendente' ? (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <Clock className="w-3 h-3" /> Pendente
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span className="font-bold text-sm">
                                  {row.mediaFinal.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {row.situacao === 'Aprovado' ? (
                                  <Badge className="gap-1 text-xs" style={{ backgroundColor: 'var(--primary)' }}>
                                    <CheckCircle className="w-3 h-3" /> Aprovado
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="gap-1 text-xs">
                                    <XCircle className="w-3 h-3" /> Reprovado
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              ))
            )}

            {/* Legenda */}
            <Card className="p-4">
              <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent)' }}>Como funciona a recuperação</h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <Award className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--primary)' }} />
                  <span><strong>Nota de corte:</strong> {(notaCorte / 10).toFixed(1)} (média da escola). Alunos com nota abaixo disso vão para recuperação.</span>
                </p>
                <p className="flex items-start gap-2">
                  <RotateCcw className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--secondary)' }} />
                  <span><strong>Recuperação automática:</strong> O sistema libera a prova de recuperação imediatamente para o aluno reprovado.</span>
                </p>
                <p className="flex items-start gap-2">
                  <TrendingUp className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-600" />
                  <span><strong>Média final:</strong> (nota original + nota recuperação) ÷ 2. Aprovado se média final ≥ {(notaCorte / 10).toFixed(1)}.</span>
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* ===== ABA: POR PROVA (relatório antigo) ===== */}
          <TabsContent value="provas" className="space-y-4">
            {/* Estatísticas gerais */}
            {generalStats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={FileText} label="Provas" value={generalStats.totalExams} color="var(--accent)" />
                <StatCard icon={Users} label="Submissões" value={generalStats.totalSubmissions} color="var(--secondary)" />
                <StatCard icon={Award} label="Nota Média" value={`${generalStats.average.toFixed(1)}%`} color="var(--primary)" />
                <StatCard icon={TrendingUp} label="Maior Nota" value={`${generalStats.highest.toFixed(1)}%`} color="var(--primary)" />
              </div>
            )}

            {reports.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                Nenhum relatório disponível.
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.examId} className="overflow-hidden">
                  <div className="p-5 border-b bg-secondary/5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-base">{report.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {report.turmaName} • {report.subjectName} • {report.questionCount} questões
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <a href={`/api/reports/exam-pdf?id=${report.examId}&withKey=false`} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline">
                            <Download className="w-3.5 h-3.5 mr-1" /> Prova
                          </Button>
                        </a>
                        <a href={`/api/reports/exam-pdf?id=${report.examId}&withKey=true`} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline" style={{ color: 'var(--primary)' }}>
                            <Download className="w-3.5 h-3.5 mr-1" /> Gabarito
                          </Button>
                        </a>
                      </div>
                    </div>
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
                  {report.results.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Nenhuma submissão registrada.
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
                          {report.results.sort((a, b) => b.score - a.score).map((r) => (
                            <tr key={r.userId} className="border-b last:border-0 hover:bg-secondary/5">
                              <td className="px-4 py-2.5">
                                <p className="font-medium">{r.userName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{r.userCpf}</p>
                              </td>
                              <td className="px-4 py-2.5 text-center">{r.correctCount}/{r.totalQuestions}</td>
                              <td className="px-4 py-2.5 text-center">
                                <Badge
                                  variant={r.score >= notaCorte ? 'default' : 'destructive'}
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
              ))
            )}
          </TabsContent>
        </Tabs>
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
