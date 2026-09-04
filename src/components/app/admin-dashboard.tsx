'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  LayoutDashboard,
  Users,
  School,
  FileText,
  BookOpen,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import type { SessionUser } from '@/lib/types'
import { UsersManager } from './admin/users-manager'
import { TurmasManager } from './admin/turmas-manager'
import { ExamsManager } from './admin/exams-manager'
import { QuestionsViewer } from './admin/questions-viewer'
import { ReportsView } from './admin/reports-view'

type AdminTab = 'overview' | 'users' | 'turmas' | 'exams' | 'questions' | 'reports'

const TABS: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'turmas', label: 'Turmas', icon: School },
  { id: 'exams', label: 'Provas', icon: FileText },
  { id: 'questions', label: 'Banco de Questões', icon: BookOpen },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
]

interface AdminDashboardProps {
  user: SessionUser
  onLogout: () => void
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
                <p className="text-xs text-muted-foreground leading-tight">Painel Administrativo</p>
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
                <p className="text-xs text-muted-foreground leading-tight">Administrador</p>
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
          {(sidebarOpen || typeof window === 'undefined') && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed lg:hidden inset-y-0 left-0 top-16 z-30 w-64 bg-card border-r shadow-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <SidebarContent activeTab={activeTab} onTabChange={(t) => { setActiveTab(t); setSidebarOpen(false) }} />
            </motion.div>
          )}
        </AnimatePresence>

        <aside className="hidden lg:flex w-64 flex-col border-r bg-card/50">
          <SidebarContent activeTab={activeTab} onTabChange={setActiveTab} />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 lg:p-6"
            >
              {activeTab === 'overview' && <OverviewView onNavigate={setActiveTab} />}
              {activeTab === 'users' && <UsersManager />}
              {activeTab === 'turmas' && <TurmasManager />}
              {activeTab === 'exams' && <ExamsManager />}
              {activeTab === 'questions' && <QuestionsViewer />}
              {activeTab === 'reports' && <ReportsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({
  activeTab,
  onTabChange,
}: {
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
}) {
  return (
    <nav className="flex flex-col gap-1 p-3 h-full">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary/20 hover:text-foreground'
            }`}
          >
            <Icon className="w-4.5 h-4.5" />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}

function OverviewView({ onNavigate }: { onNavigate: (tab: AdminTab) => void }) {
  const stats = [
    { label: 'Usuários', icon: Users, tab: 'users' as AdminTab, color: 'var(--primary)' },
    { label: 'Turmas', icon: School, tab: 'turmas' as AdminTab, color: 'var(--secondary)' },
    { label: 'Provas', icon: FileText, tab: 'exams' as AdminTab, color: 'var(--accent)' },
    { label: 'Relatórios', icon: BarChart3, tab: 'reports' as AdminTab, color: 'var(--primary)' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
          Visão Geral
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Bem-vindo ao painel administrativo da Ocean Green Treinamentos
        </p>
      </div>

      <Card className="p-6 ocean-gradient-soft border-primary/20">
        <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--primary)' }}>
          Delineador Industrial - Sistema de Avaliações
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Gerencie usuários, turmas, provas oficiais e simulados livres. Crie provas programadas
          com janelas de tempo rigorosas, agende provas individuais para alunos específicos, e
          gere relatórios consolidados com exportação em PDF.
        </p>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <button
              key={stat.label}
              onClick={() => onNavigate(stat.tab)}
              className="group"
            >
              <Card className="p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 border-border/50">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="w-5.5 h-5.5" style={{ color: stat.color }} />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Clique para gerenciar →</p>
              </Card>
            </button>
          )
        })}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-3" style={{ color: 'var(--accent)' }}>
          Funcionalidades Principais
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            'Login por CPF com acesso restrito',
            'Gestão de turmas independentes',
            'Banco de 100 questões (nível fácil)',
            'Simulados livres sob demanda',
            'Provas oficiais com janela temporal',
            'Agendamento individual de provas',
            'Cronômetro regressivo e auto-save',
            'Relatórios consolidados e PDF',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
              <span className="text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
