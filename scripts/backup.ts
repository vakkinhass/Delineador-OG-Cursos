/**
 * Script de backup do banco de dados
 * Cria uma cópia do banco SQLite na pasta db/backups
 * Deve ser executado antes de qualquer alteração no schema
 */
import { copyFileSync, mkdirSync, existsSync, statSync } from 'fs'
import { join } from 'path'

const SOURCE = join(process.cwd(), 'db', 'custom.db')
const BACKUP_DIR = join(process.cwd(), 'db', 'backups')

if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true })
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupPath = join(BACKUP_DIR, `custom-backup-${timestamp}.db`)

try {
  copyFileSync(SOURCE, backupPath)
  console.log(`✅ Backup criado: ${backupPath}`)
  console.log(`   Tamanho: ${(statSync(backupPath).size / 1024).toFixed(1)} KB`)
} catch (err) {
  console.error('❌ Erro ao criar backup:', err)
  process.exit(1)
}
