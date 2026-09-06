'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api/client'
import { School, Plus, Pencil, Trash2, Users, FileText, Loader2 } from 'lucide-react'
import type { TurmaDTO } from '@/lib/types'

export function TurmasManager() {
  const { toast } = useToast()
  const [turmas, setTurmas] = useState<TurmaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TurmaDTO | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', active: true })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ turmas: TurmaDTO[] }>('/api/turmas')
      setTurmas(data.turmas)
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
    setEditing(null)
    setForm({ name: '', description: '', active: true })
    setDialogOpen(true)
  }

  const openEdit = (turma: TurmaDTO) => {
    setEditing(turma)
    setForm({ name: turma.name, description: turma.description || '', active: turma.active })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Atenção', description: 'Nome da turma é obrigatório.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/api/turmas/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) })
        toast({ title: 'Sucesso', description: 'Turma atualizada.' })
      } else {
        await apiFetch('/api/turmas', { method: 'POST', body: JSON.stringify(form) })
        toast({ title: 'Sucesso', description: 'Turma criada.' })
      }
      setDialogOpen(false)
      load()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta turma?')) return
    try {
      await apiFetch(`/api/turmas/${id}`, { method: 'DELETE' })
      toast({ title: 'Sucesso', description: 'Turma removida.' })
      load()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>Turmas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie turmas independentes para isolar conteúdos e alunos
          </p>
        </div>
        <Button onClick={openCreate} className="self-start">
          <Plus className="w-4 h-4 mr-1.5" />
          Nova Turma
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : turmas.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <School className="w-10 h-10 mx-auto mb-3 opacity-40" />
          Nenhuma turma cadastrada.
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmas.map((turma) => (
            <Card key={turma.id} className="p-5 hover:shadow-lg transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--secondary)' + '20' }}>
                  <School className="w-5 h-5" style={{ color: 'var(--secondary)' }} />
                </div>
                <Badge variant={turma.active ? 'default' : 'destructive'} className="text-xs">
                  {turma.active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              <h3 className="font-semibold text-base mb-1">{turma.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">
                {turma.description || 'Sem descrição'}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {turma.studentCount || 0} alunos
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {turma.examCount || 0} provas
                </span>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(turma)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(turma.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Atualize os dados da turma.' : 'Crie uma nova turma independente.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da Turma</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Delineador Industrial 2026.2"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição opcional da turma"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="cursor-pointer">Turma ativa</Label>
                <p className="text-xs text-muted-foreground">Turmas inativas não aparecem para seleção</p>
              </div>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
