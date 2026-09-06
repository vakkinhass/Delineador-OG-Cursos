// ============================================================
// TIPOS COMPARTILHADOS - Ocean Green Treinamentos
// ============================================================

export type Role = 'ADMIN' | 'STUDENT'
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type ExamStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED'
export type AnswerOption = 'A' | 'B' | 'C' | 'D'

export interface SessionUser {
  id: string
  cpf: string
  name: string
  role: Role
  active: boolean
}

export interface SubjectDTO {
  id: string
  name: string
  description: string | null
}

export interface QuestionDTO {
  id: string
  subjectId: string
  subjectName?: string
  difficulty: Difficulty
  statement: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: AnswerOption
  explanation: string | null
}

export interface TurmaDTO {
  id: string
  name: string
  description: string | null
  active: boolean
  studentCount?: number
}

export interface UserDTO {
  id: string
  cpf: string
  name: string
  role: Role
  active: boolean
  turmas?: { id: string; name: string }[]
}

export interface ExamDTO {
  id: string
  title: string
  description: string | null
  turmaId: string | null
  turmaName?: string | null
  subjectId: string | null
  subjectName?: string | null
  startDateTime: string
  endDateTime: string
  durationMinutes: number
  active: boolean
  questionCount?: number
  assignments?: ExamAssignmentDTO[]
}

export interface ExamAssignmentDTO {
  id: string
  examId: string
  userId: string
  userName: string
  userCpf: string
  startDateTime: string
  endDateTime: string
  durationMinutes: number
}

export interface ExamResultDTO {
  id: string
  examId: string
  examTitle: string
  userId: string
  userName: string
  userCpf: string
  score: number
  correctCount: number
  totalQuestions: number
  timeSpentSeconds: number
  status: ExamStatus
  startedAt: string | null
  submittedAt: string | null
}

export interface AnswersMap {
  [questionId: string]: AnswerOption
}
