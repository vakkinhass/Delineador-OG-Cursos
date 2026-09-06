/**
 * Ocean Green Treinamentos - Seed Script
 * Popula o banco com:
 *  - Usuário Administrador (Lucas Skopek - CPF 124.521.557-48)
 *  - 5 Disciplinas
 *  - Turma padrão (Delineador Industrial 2026.2)
 *  - 100 Questões de nível EASY
 */
import { db } from '../src/lib/db'
import { questionsData } from '../src/lib/questions-data'

const SUBJECTS = [
  { name: 'Delineacao Industrial', description: 'Fundamentos da delineação industrial, CAD, normas, desenho técnico e materiais.' },
  { name: 'Seguranca do Trabalho', description: 'Normas Regulamentadoras (NRs) e segurança ocupacional industrial.' },
  { name: 'Matematica Aplicada', description: 'Geometria, trigonometria, conversão de unidades, escalas e tolerâncias.' },
  { name: 'Matematica Basica', description: 'Aritmética, frações, porcentagem, regra de três e estatística básica.' },
  { name: 'Manual do Delineador', description: 'Tubulação, solda, caldeiraria, válvulas, purgadores e permutadores de calor.' },
]

async function main() {
  console.log('🌱 Iniciando seed do Ocean Green Treinamentos...')

  // 1. Criar ou atualizar Admin
  const adminCpf = '124.521.557-48'
  const admin = await db.user.upsert({
    where: { cpf: adminCpf },
    update: { name: 'Lucas Skopek', role: 'ADMIN', active: true },
    create: { cpf: adminCpf, name: 'Lucas Skopek', role: 'ADMIN', active: true },
  })
  console.log(`✅ Admin criado: ${admin.name} (${admin.cpf})`)

  // 2. Criar Disciplinas
  const subjectMap: Record<string, string> = {}
  for (const s of SUBJECTS) {
    const subject = await db.subject.upsert({
      where: { name: s.name },
      update: { description: s.description },
      create: s,
    })
    subjectMap[s.name] = subject.id
    console.log(`✅ Disciplina: ${subject.name}`)
  }

  // 3. Criar Turma padrão
  const turma = await db.turma.upsert({
    where: { name: 'Delineador Industrial 2026.2' },
    update: {},
    create: {
      name: 'Delineador Industrial 2026.2',
      description: 'Turma de Delineador Industrial - Período 2026.2',
      active: true,
    },
  })
  console.log(`✅ Turma: ${turma.name}`)

  // 4. Inserir Questões (evita duplicatas)
  const existingCount = await db.question.count()
  if (existingCount === 0) {
    for (const q of questionsData) {
      const subjectId = subjectMap[q.subjectName]
      if (!subjectId) {
        console.warn(`⚠️  Disciplina não encontrada: ${q.subjectName}`)
        continue
      }
      await db.question.create({
        data: {
          subjectId,
          difficulty: q.difficulty,
          statement: q.statement,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        },
      })
    }
    console.log(`✅ ${questionsData.length} questões inseridas`)
  } else {
    console.log(`⏭️  Questões já existem (${existingCount}). Pulando inserção.`)
  }

  // 5. Criar alguns alunos de exemplo
  const sampleStudents = [
    { cpf: '123.456.789-09', name: 'Aluno Exemplo Silva' },
    { cpf: '987.654.321-00', name: 'Aluna Exemplo Santos' },
  ]
  for (const s of sampleStudents) {
    const student = await db.user.upsert({
      where: { cpf: s.cpf },
      update: {},
      create: { cpf: s.cpf, name: s.name, role: 'STUDENT', active: true },
    })
    // Vincular à turma
    await db.userTurma.upsert({
      where: { userId_turmaId: { userId: student.id, turmaId: turma.id } },
      update: {},
      create: { userId: student.id, turmaId: turma.id },
    })
    console.log(`✅ Aluno: ${student.name} -> ${turma.name}`)
  }

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log(`   Admin: ${admin.cpf}`)
  console.log(`   Disciplinas: ${SUBJECTS.length}`)
  console.log(`   Questões: ${questionsData.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
