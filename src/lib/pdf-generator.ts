import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib'

// ============================================================
// GERADOR DE PDF DE PROVAS - Ocean Green Treinamentos
// ============================================================

const OCEAN_GREEN = rgb(0.039, 0.361, 0.212)   // #0A5C36
const MINT_GREEN = rgb(0.180, 0.545, 0.341)    // #2E8B57
const PETROL_BLUE = rgb(0.106, 0.286, 0.396)    // #1B4965
const DARK_TEXT = rgb(0.15, 0.15, 0.15)
const GRAY = rgb(0.4, 0.4, 0.4)
const LIGHT_GRAY = rgb(0.93, 0.93, 0.93)

interface PdfQuestion {
  index: number
  subjectName: string
  statement: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer?: string
  explanation?: string
}

interface PdfExamData {
  title: string
  turmaName: string | null
  subjectName: string | null
  durationMinutes: number
  startDateTime: string
  endDateTime: string
  totalQuestions: number
  questions: PdfQuestion[]
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const width = font.widthOfTextAtSize(testLine, fontSize)
    if (width <= maxWidth) {
      currentLine = testLine
    } else {
      if (currentLine) lines.push(currentLine)
      // Se a palavra sozinha for maior que a linha, quebra por caractere
      if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
        let chunk = ''
        for (const char of word) {
          const testChunk = chunk + char
          if (font.widthOfTextAtSize(testChunk, fontSize) <= maxWidth) {
            chunk = testChunk
          } else {
            if (chunk) lines.push(chunk)
            chunk = char
          }
        }
        currentLine = chunk
      } else {
        currentLine = word
      }
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

export async function generateExamPdf(
  examData: PdfExamData,
  withAnswerKey: boolean
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  const pageWidth = 595.28 // A4
  const pageHeight = 841.89
  const margin = 50
  const contentWidth = pageWidth - margin * 2

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  const ensureSpace = (needed: number) => {
    if (y - needed < margin + 40) {
      // Rodapé da página atual
      drawFooter(page, pdfDoc.getPageCount())
      page = pdfDoc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
  }

  const drawFooter = (p: PDFPage, pageNum: number) => {
    p.drawText(`Ocean Green Treinamentos - Delineador Industrial`, {
      x: margin,
      y: 25,
      size: 8,
      font: helvetica,
      color: GRAY,
    })
    p.drawText(`Página ${pageNum}`, {
      x: pageWidth - margin - 50,
      y: 25,
      size: 8,
      font: helvetica,
      color: GRAY,
    })
  }

  // ===== CABEÇALHO =====
  // Faixa verde no topo
  page.drawRectangle({
    x: 0,
    y: pageHeight - 80,
    width: pageWidth,
    height: 80,
    color: OCEAN_GREEN,
  })

  page.drawText('OCEAN GREEN TREINAMENTOS', {
    x: margin,
    y: pageHeight - 35,
    size: 18,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })
  page.drawText('Avaliação Oficial - Delineador Industrial', {
    x: margin,
    y: pageHeight - 55,
    size: 10,
    font: helvetica,
    color: rgb(0.85, 0.9, 0.88),
  })

  // Badge de gabarito
  if (withAnswerKey) {
    page.drawRectangle({
      x: pageWidth - margin - 110,
      y: pageHeight - 50,
      width: 110,
      height: 20,
      color: MINT_GREEN,
    })
    page.drawText('COM GABARITO', {
      x: pageWidth - margin - 100,
      y: pageHeight - 36,
      size: 9,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    })
  } else {
    page.drawRectangle({
      x: pageWidth - margin - 110,
      y: pageHeight - 50,
      width: 110,
      height: 20,
      color: PETROL_BLUE,
    })
    page.drawText('PROVA', {
      x: pageWidth - margin - 95,
      y: pageHeight - 36,
      size: 9,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    })
  }

  y = pageHeight - 110

  // ===== INFORMAÇÕES DA PROVA =====
  page.drawText(examData.title, {
    x: margin,
    y,
    size: 14,
    font: helveticaBold,
    color: OCEAN_GREEN,
  })
  y -= 22

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const infoLines = [
    `Turma: ${examData.turmaName || '---'}`,
    `Disciplina: ${examData.subjectName || 'Multi-disciplinar'}`,
    `Total de Questões: ${examData.totalQuestions}`,
    `Duração: ${examData.durationMinutes} minutos`,
    `Início: ${formatDate(examData.startDateTime)}    Término: ${formatDate(examData.endDateTime)}`,
  ]

  for (const line of infoLines) {
    ensureSpace(16)
    page.drawText(line, { x: margin, y, size: 10, font: helvetica, color: DARK_TEXT })
    y -= 16
  }

  y -= 8
  // Linha separadora
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: OCEAN_GREEN,
  })
  y -= 20

  // Nome do aluno (campo em branco)
  if (!withAnswerKey) {
    page.drawText('Nome do Aluno: _________________________________________________', {
      x: margin, y, size: 10, font: helvetica, color: DARK_TEXT,
    })
    y -= 16
    page.drawText('CPF: __________________________    Data: ____/____/________', {
      x: margin, y, size: 10, font: helvetica, color: DARK_TEXT,
    })
    y -= 24
  }

  // ===== QUESTÕES =====
  page.drawText('QUESTÕES', {
    x: margin, y, size: 12, font: helveticaBold, color: OCEAN_GREEN,
  })
  y -= 20

  for (const q of examData.questions) {
    ensureSpace(60)

    // Número da questão
    page.drawRectangle({
      x: margin,
      y: y - 12,
      width: 22,
      height: 16,
      color: OCEAN_GREEN,
    })
    page.drawText(String(q.index), {
      x: margin + 6,
      y: y - 8,
      size: 10,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    })

    // Disciplina (badge pequeno)
    const subjectText = q.subjectName
    const subjectWidth = helvetica.widthOfTextAtSize(subjectText, 8)
    page.drawRectangle({
      x: margin + 30,
      y: y - 10,
      width: subjectWidth + 10,
      height: 12,
      color: LIGHT_GRAY,
    })
    page.drawText(subjectText, {
      x: margin + 35,
      y: y - 7,
      size: 8,
      font: helvetica,
      color: PETROL_BLUE,
    })

    y -= 22

    // Enunciado
    const statementLines = wrapText(q.statement, helvetica, 10, contentWidth)
    for (const line of statementLines) {
      ensureSpace(14)
      page.drawText(line, { x: margin, y, size: 10, font: helvetica, color: DARK_TEXT })
      y -= 14
    }
    y -= 4

    // Opções
    const options = [
      { letter: 'A', text: q.optionA },
      { letter: 'B', text: q.optionB },
      { letter: 'C', text: q.optionC },
      { letter: 'D', text: q.optionD },
    ]

    for (const opt of options) {
      ensureSpace(14)
      const isCorrect = withAnswerKey && opt.letter === q.correctAnswer
      page.drawText(`(${opt.letter})`, {
        x: margin + 8,
        y,
        size: 10,
        font: isCorrect ? helveticaBold : helvetica,
        color: isCorrect ? OCEAN_GREEN : DARK_TEXT,
      })
      const optLines = wrapText(opt.text, helvetica, 10, contentWidth - 30)
      for (let i = 0; i < optLines.length; i++) {
        ensureSpace(14)
        page.drawText(optLines[i], {
          x: margin + 28,
          y,
          size: 10,
          font: isCorrect ? helveticaBold : helvetica,
          color: isCorrect ? OCEAN_GREEN : DARK_TEXT,
        })
        if (i < optLines.length - 1) y -= 14
      }
      y -= 14
    }

    // Gabarito comentado
    if (withAnswerKey && q.correctAnswer && q.explanation) {
      ensureSpace(28)
      y -= 2
      page.drawRectangle({
        x: margin,
        y: y - 10,
        width: contentWidth,
        height: 14,
        color: rgb(0.85, 0.93, 0.88),
      })
      page.drawText(`Gabarito: ${q.correctAnswer}`, {
        x: margin + 4,
        y: y - 7,
        size: 9,
        font: helveticaBold,
        color: OCEAN_GREEN,
      })
      y -= 16
      const explLines = wrapText(q.explanation, helveticaOblique, 9, contentWidth)
      for (const line of explLines) {
        ensureSpace(12)
        page.drawText(line, {
          x: margin + 4,
          y,
          size: 9,
          font: helveticaOblique,
          color: GRAY,
        })
        y -= 12
      }
      y -= 8
    } else {
      y -= 8
    }

    // Separador entre questões
    ensureSpace(6)
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color: LIGHT_GRAY,
    })
    y -= 14
  }

  // Rodapé da última página
  drawFooter(page, pdfDoc.getPageCount())

  return await pdfDoc.save()
}
