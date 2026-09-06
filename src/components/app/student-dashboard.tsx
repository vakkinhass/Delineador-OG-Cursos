'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  BookOpen,
  FileText,
  Award,
  LogOut,
  Menu,
  X,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import type { SessionUser, ExamDTO } from '@/lib/types'
import { apiFetch } from '@/lib/api/client'
import { MockExam } from './mock-exam'
import { ExamRunner } from './exam-runner'
import { ExamResultView } from './exam-result-view'

type StudentView =
  | { type: 'home' }
  | { type: 'mock' }
  | { type: 'exam'; examId: string }
  | { type: 'result'; examId: string }

interface StudentDashboardProps {
  user: SessionUser
  onLogout: () => void
}

export function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [view, setView] = useState<StudentView>({ type: 'home' })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [exams, setExams] = useState<ExamDTO[]>([])

  const loadExams = useCallback(async () => {
    try {
      const data = await apiFetch<{ exams: any[] }>('/api/exams')
      setExams(data.exams)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadExams()
  }, [loadExams])

  const navItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'mock', label: 'Simulado Livre', icon: BookOpen },
  ]

  const now = new Date()
  const availableExams = exams.filter((e) => {
    const start = new Date(e.startDateTime)
    const end = new Date(e.endDateTime)
    return now >= start && now <= end && !e.result
  })
  const upcomingExams = exams.filter((e) => new Date(e.startDateTime) > now)
  const completedExams = exams.filter((e) => e.result)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg overflow-hidden shadow-sm ring-1 ring-black/5">
                <img src="/logo-ocean.jpeg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold leading-tight" style={{ color: 'var(--primary)' }}>
                  Ocean Green Treinamentos
                </h1>
                <p className="text-xs text-muted-foreground leading-tight">Área do Aluno</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/15">
              <div className="w-8 h-8 rounded-full ocean-gradient flex items-center justify-center text-white text-sm font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight">{user.name}</p>
                <p className="text-xs text-muted-foreground leading-tight font-mono">{user.cpf}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed lg:hidden inset-y-0 left-0 top-16 z-30 w-64 bg-card border-r shadow-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <SidebarContent view={view} setView={setView} navItems={navItems} />
            </motion.div>
          )}
        </AnimatePresence>

        <aside className="hidden lg:flex w-64 flex-col border-r bg-card/50">
          <SidebarContent view={view} setView={setView} navItems={navItems} />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={view.type + (view.type === 'exam' ? view.examId : view.type === 'result' ? view.examId : '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 lg:p-6"
            >
              {view.type === 'home' && (
                <HomeView
                  user={user}
                  availableExams={availableExams}
                  upcomingExams={upcomingExams}
                  completedExams={completedExams}
                  onNavigate={setView}
                />
              )}
              {view.type === 'mock' && <MockExam onBack={() => setView({ type: 'home' })} />}
              {view.type === 'exam' && (
                <ExamRunner
                  examId={view.examId}
                  onBack={() => { setView({ type: 'home' }); loadExams() }}
                  onFinish={(examId) => setView({ type: 'result', examId })}
                />
              )}
              {view.type === 'result' && (
                <ExamResultView
                  examId={view.examId}
                  onBack={() => { setView({ type: 'home' }); loadExams() }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({
  view,
  setView,
  navItems,
}: {
  view: StudentView
  setView: (v: StudentView) => void
  navItems: { id: string; label: string; icon: typeof Home }[]
}) {
  return (
    <nav className="flex flex-col gap-1 p-3 h-full">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = view.type === item.id
        return (
          <button
            key={item.id}
            onClick={() => setView({ type: item.id as any })}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary/20 hover:text-foreground'
            }`}
          >
            <Icon className="w-4.5 h-4.5" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

function HomeView({
  user,
  availableExams,
  upcomingExams,
  completedExams,
  onNavigate,
}: {
  user: SessionUser
  availableExams: any[]
  upcomingExams: any[]
  completedExams: any[]
  onNavigate: (v: StudentView) => void
}) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Saudação */}
      <Card className="p-6 ocean-gradient text-white border-0">
        <h2 className="text-2xl font-bold mb-1">Olá, {user.name.split(' ')[0]}! 👋</h2>
        <p className="text-white/85 text-sm">
          Bem-vindo à plataforma de simulados da Ocean Green Treinamentos.
          <br />
          Treine com simulados livres ou realize suas provas oficiais.
        </p>
      </Card>

      {/* Ações rápidas */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button onClick={() => onNavigate({ type: 'mock' })}>
          <Card className="p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 text-left h-full">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--primary)15' }}>
              <BookOpen className="w-5.5 h-5.5" style={{ color: 'var(--primary)' }} />
            </div>
            <h3 className="font-semibold mb-1">Simulado Livre</h3>
            <p className="text-sm text-muted-foreground">
              Gere um simulado personalizado para treinar. Escolha disciplinas e quantidade de questões.
            </p>
          </Card>
        </button>
        <Card className="p-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--accent)15' }}>
            <Award className="w-5.5 h-5.5" style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="font-semibold mb-1">Seu Desempenho</h3>
          <p className="text-sm text-muted-foreground">
            {completedExams.length} prova(s) realizada(s).{' '}
            {completedExams.length > 0 &&
              `Média: ${(
                completedExams.reduce((acc, e) => acc + (e.result?.score || 0), 0) /
                completedExams.length
              ).toFixed(1)}%`}
          </p>
        </Card>
      </div>

      {/* Provas disponíveis */}
      {availableExams.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
            <CheckCircle className="w-5 h-5" />
            Provas Disponíveis Agora
          </h3>
          <div className="space-y-3">
            {availableExams.map((exam) => (
              <Card key={exam.id} className={`p-4 ${exam.isRecovery ? 'border-orange-500/40 bg-orange-50/30' : 'border-green-500/30 bg-green-50/30'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{exam.title}</h4>
                      {exam.isRecovery && (
                        <Badge variant="secondary" className="text-xs gap-1" style={{ backgroundColor: 'var(--accent)20', color: 'var(--accent)' }}>
                          <RotateCcw className="w-3 h-3" /> Recuperação
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {exam.turmaName} • {exam.subjectName || 'Multi'} • {exam.questionCount} questões • {exam.durationMinutes} min
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" /> Encerra: {formatDate(exam.endDateTime)}
                      </span>
                    </div>
                  </div>
                  <Button onClick={() => onNavigate({ type: 'exam', examId: exam.id })}>
                    Iniciar Prova
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Provas agendadas */}
      {upcomingExams.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
            <Calendar className="w-5 h-5" />
            Próximas Provas
          </h3>
          <div className="space-y-2">
            {upcomingExams.map((exam) => (
              <Card key={exam.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-sm">{exam.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {exam.subjectName || 'Multi'} • {exam.questionCount} questões
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                      {formatDate(exam.startDateTime)}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1">Agendada</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Provas realizadas */}
      {completedExams.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
            <FileText className="w-5 h-5" />
            Provas Realizadas
          </h3>
          <div className="space-y-2">
            {completedExams.map((exam) => (
              <Card key={exam.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-sm">{exam.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {exam.subjectName || 'Multi'} • {exam.questionCount} questões
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={exam.result?.score >= 70 ? 'default' : exam.result?.score >= 50 ? 'secondary' : 'destructive'}
                      className="font-bold"
                    >
                      {exam.result?.score?.toFixed(1)}%
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate({ type: 'result', examId: exam.id })}
                    >
                      Ver Gabarito
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {availableExams.length === 0 && upcomingExams.length === 0 && completedExams.length === 0 && (
        <Card className="p-8 text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Você não tem provas oficiais no momento.
            <br />
            Que tal treinar com um simulado livre?
          </p>
          <Button className="mt-4" onClick={() => onNavigate({ type: 'mock' })}>
            <BookOpen className="w-4 h-4 mr-1.5" />
            Iniciar Simulado Livre
          </Button>
        </Card>
      )}
    </div>
  )
}
