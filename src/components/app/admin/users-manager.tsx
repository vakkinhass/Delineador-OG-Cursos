'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
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
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api/client'
import { UserPlus, Pencil, Trash2, Search, Loader2, Shield, GraduationCap, Upload, Download, FileText } from 'lucide-react'
import type { UserDTO, TurmaDTO } from '@/lib/types'

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function UsersManager() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserDTO[]>([])
  const [turmas, setTurmas] = useState<TurmaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    cpf: '',
    role: 'STUDENT' as 'STUDENT' | 'ADMIN',
    active: true,
    turmaIds: [] as string[],
  })

  // Bulk import
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkTurmaId, setBulkTurmaId] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersData, turmasData] = await Promise.all([
        apiFetch<{ users: UserDTO[] }>('/api/users'),
        apiFetch<{ turmas: TurmaDTO[] }>('/api/turmas'),
      ])
      setUsers(usersData.users)
      setTurmas(turmasData.turmas)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openCreate = () => {
    setEditingUser(null)
    setForm({ name: '', cpf: '', role: 'STUDENT', active: true, turmaIds: [] })
    setDialogOpen(true)
  }

  const openEdit = (user: UserDTO) => {
    setEditingUser(user)
    setForm({
      name: user.name,
      cpf: user.cpf,
      role: user.role as 'STUDENT' | 'ADMIN',
      active: user.active,
      turmaIds: user.turmas?.map((t) => t.id) || [],
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || form.cpf.replace(/\D/g, '').length !== 11) {
      toast({ title: 'Atenção', description: 'Preencha nome e CPF (11 dígitos).', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, cpf: form.cpf }
      if (editingUser) {
        await apiFetch(`/api/users/${editingUser.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        toast({ title: 'Sucesso', description: 'Usuário atualizado.' })
      } else {
        await apiFetch('/api/users', { method: 'POST', body: JSON.stringify(payload) })
        toast({ title: 'Sucesso', description: 'Usuário cadastrado.' })
      }
      setDialogOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este usuário?')) return
    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE' })
      toast({ title: 'Sucesso', description: 'Usuário removido.' })
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  // Parser de texto: aceita formatos "Nome - CPF", "Nome,CPF", "CPF Nome", um por linha
  const parseBulkText = (text: string): { name: string; cpf: string }[] => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    const students: { name: string; cpf: string }[] = []
    for (const line of lines) {
      // Tenta padrões: "Nome - 000.000.000-00", "Nome,000.000.000-00", "Nome;000.000.000-00"
      // ou "000.000.000-00 Nome" ou "Nome 000.000.000-00"
      const cpfMatch = line.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/)
      if (!cpfMatch) continue
      const cpf = cpfMatch[0]
      let name = line.replace(cpf, '').replace(/^[-,;\s]+|[-,;\s]+$/g, '').trim()
      // Se o CPF vinha antes, o nome é o resto
      if (!name) continue
      students.push({ name, cpf })
    }
    return students
  }

  const handleBulkImport = async () => {
    const students = parseBulkText(bulkText)
    if (students.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Nenhum aluno válido encontrado. Use o formato: Nome - 000.000.000-00 (um por linha).',
        variant: 'destructive',
      })
      return
    }
    setBulkLoading(true)
    try {
      const data = await apiFetch<{ created: number; skipped: number; errors?: string[] }>(
        '/api/users/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({ students, turmaId: bulkTurmaId || undefined }),
        }
      )
      toast({
        title: 'Importação concluída!',
        description: `${data.created} aluno(s) cadastrado(s), ${data.skipped} já existente(s).${data.errors ? ` ${data.errors.length} erro(s).` : ''}`,
      })
      if (data.errors && data.errors.length > 0) {
        console.log('Import errors:', data.errors)
      }
      setBulkOpen(false)
      setBulkText('')
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setBulkLoading(false)
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.cpf.includes(search)
  )

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>Usuários</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre e gerencie alunos e administradores
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setBulkOpen(true)} variant="outline">
            <Upload className="w-4 h-4 mr-1.5" />
            Importar Lista
          </Button>
          <a href="/api/backup/export" target="_blank" rel="noreferrer">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-1.5" />
              Backup
            </Button>
          </a>
          <Button onClick={openCreate}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Novo Usuário
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-sm">
              <thead className="bg-secondary/10 border-b">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">CPF</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Perfil</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Turmas</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-secondary/5">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{user.cpf}</td>
                    <td className="px-4 py-3">
                      {user.role === 'ADMIN' ? (
                        <Badge className="bg-accent text-accent-foreground gap-1">
                          <Shield className="w-3 h-3" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <GraduationCap className="w-3 h-3" /> Aluno
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {user.turmas?.length ? (
                          user.turmas.map((t) => (
                            <Badge key={t.id} variant="outline" className="text-xs">
                              {t.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={user.active ? 'default' : 'destructive'} className="text-xs">
                        {user.active ? 'Ativo' : 'Bloqueado'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(user)} className="h-8 w-8">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(user.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Atualize os dados do usuário.' : 'Cadastre um novo usuário no sistema.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: maskCpf(e.target.value) })}
                placeholder="000.000.000-00"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as 'STUDENT' | 'ADMIN' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Aluno</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === 'STUDENT' && (
              <div className="space-y-2">
                <Label>Turmas</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scroll border rounded-lg p-3">
                  {turmas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma turma cadastrada.</p>
                  ) : (
                    turmas.map((turma) => (
                      <label key={turma.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.turmaIds.includes(turma.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, turmaIds: [...form.turmaIds, turma.id] })
                            } else {
                              setForm({ ...form, turmaIds: form.turmaIds.filter((id) => id !== turma.id) })
                            }
                          }}
                          className="rounded border-input"
                        />
                        <span className="text-sm">{turma.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="cursor-pointer">Acesso ativo</Label>
                <p className="text-xs text-muted-foreground">Usuários bloqueados não podem acessar</p>
              </div>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {editingUser ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Importação em Massa */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar Lista de Alunos</DialogTitle>
            <DialogDescription>
              Cole a lista de alunos abaixo (um por linha). Formato: Nome - CPF
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Turma (opcional)</Label>
              <Select value={bulkTurmaId} onValueChange={setBulkTurmaId}>
                <SelectTrigger><SelectValue placeholder="Vincular a uma turma" /></SelectTrigger>
                <SelectContent>
                  {turmas.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lista de Alunos</Label>
              <textarea
                className="w-full min-h-[200px] p-3 text-sm rounded-md border border-input bg-background font-mono"
                placeholder={`Exemplo:\nJoão Silva - 123.456.789-00\nMaria Santos - 987.654.321-00\nPedro Oliveira - 111.222.333-44`}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: "Nome - CPF", "Nome, CPF", "Nome CPF" (um por linha)
              </p>
            </div>
            {bulkText.trim() && (
              <div className="rounded-lg bg-secondary/10 p-3 text-sm">
                <strong>{parseBulkText(bulkText).length}</strong> aluno(s) detectado(s)
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancelar</Button>
            <Button onClick={handleBulkImport} disabled={bulkLoading || !bulkText.trim()}>
              {bulkLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
              Importar {parseBulkText(bulkText).length > 0 && `(${parseBulkText(bulkText).length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
