/**
 * Ocean Green Treinamentos - Banco de Questões Seed
 * ---------------------------------------------------
 * Arquivo: questions-data.ts
 * Descrição: 100 questões de múltipla escolha (dificuldade EASY)
 *            para a plataforma de simulados do Delineador Industrial.
 *
 * Distribuição:
 *  - 20 questões por disciplina (5 disciplinas)
 *  - Disciplinas: Delineacao Industrial, Seguranca do Trabalho,
 *    Matematica Aplicada, Matematica Basica, Manual do Delineador
 *  - Gabarito balanceado: 25 A, 25 B, 25 C, 25 D
 *  - Idioma: Português (Brasil)
 *
 * Observação: Padrão de gabarito por disciplina segue o ciclo
 * A,B,C,D,A,B,C,D... (5 de cada letra por disciplina), garantindo
 * que nunca haja 2 questões consecutivas com a mesma resposta.
 */

export interface SeedQuestion {
  subjectName: string
  difficulty: string
  statement: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation: string
}

export const questionsData: SeedQuestion[] = [
  // ============================================================
  // DISCIPLINA 1: Delineacao Industrial (Questões 1-20)
  // Gabarito: A, B, C, D, A, B, C, D, A, B, C, D, A, B, C, D, A, B, C, D
  // ============================================================
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "Qual software é amplamente utilizado para desenho técnico 2D e 3D na delineação industrial?",
    optionA: "AutoCAD",
    optionB: "Microsoft Word",
    optionC: "Adobe Photoshop",
    optionD: "Google Sheets",
    correctAnswer: "A",
    explanation: "O AutoCAD é um software CAD amplamente utilizado na delineação industrial para criação de desenhos técnicos 2D e 3D."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "Qual norma brasileira estabelece as regras gerais para a execução de desenhos técnicos?",
    optionA: "ISO 9001",
    optionB: "ABNT/NBR 10068",
    optionC: "ANSI Y14.5",
    optionD: "DIN 6771",
    correctAnswer: "B",
    explanation: "A ABNT/NBR 10068 estabelece as regras gerais para a execução de desenhos técnicos no Brasil."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "Qual é a finalidade principal da delineação industrial?",
    optionA: "Criar obras de arte",
    optionB: "Fazer apresentações comerciais",
    optionC: "Representar graficamente peças e componentes para fabricação",
    optionD: "Editar vídeos institucionais",
    correctAnswer: "C",
    explanation: "A delineação industrial representa graficamente peças e componentes para possibilitar sua fabricação correta."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "Qual método de projeção é adotado como padrão no Brasil pela ABNT?",
    optionA: "Projeção cilíndrica",
    optionB: "Projeção estereográfica",
    optionC: "Terceiro diedro",
    optionD: "Primeiro diedro",
    correctAnswer: "D",
    explanation: "No Brasil, a ABNT adota o método de projeção no primeiro diedro (primeiro diedro) para desenho técnico."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "O que é uma vista ortográfica?",
    optionA: "Projeção de um objeto em um plano perpendicular ao observador",
    optionB: "Vista em perspectiva isométrica",
    optionC: "Vista com efeito de profundidade",
    optionD: "Vista colorida do objeto",
    correctAnswer: "A",
    explanation: "A vista ortográfica é a projeção do objeto em um plano perpendicular ao observador, sem efeito de profundidade."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "Qual das seguintes normas é internacional e trata dos princípios gerais de apresentação em desenho técnico?",
    optionA: "NR-10",
    optionB: "ISO 128",
    optionC: "NBR 5410",
    optionD: "ASTM A36",
    correctAnswer: "B",
    explanation: "A ISO 128 é uma norma internacional que trata dos princípios gerais de apresentação em desenho técnico."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "O que representa a linha contínua larga em desenho técnico?",
    optionA: "Linhas de cota",
    optionB: "Linhas de centro",
    optionC: "Arestas e contornos visíveis",
    optionD: "Linhas invisíveis",
    correctAnswer: "C",
    explanation: "A linha contínua larga representa arestas e contornos visíveis do objeto no desenho técnico."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "Como é chamado o conjunto de vistas que mostra frente, topo e lateral de uma peça?",
    optionA: "Vista explodida",
    optionB: "Perspectiva",
    optionC: "Isometria",
    optionD: "Vistas em três projeções ortogonais",
    correctAnswer: "D",
    explanation: "As vistas ortográficas (frente, topo e lateral) compõem a representação em três projeções ortogonais."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "O que é uma tolerância dimensional?",
    optionA: "Variação máxima permitida em uma medida",
    optionB: "Tipo de material",
    optionC: "Acabamento superficial",
    optionD: "Tipo de corte",
    correctAnswer: "A",
    explanation: "Tolerância dimensional é a variação máxima permitida em uma medida para garantir a funcionalidade da peça."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "Qual software é voltado para modelagem 3D paramétrica no projeto mecânico?",
    optionA: "MS Paint",
    optionB: "SolidWorks",
    optionC: "Excel",
    optionD: "AutoCAD Web",
    correctAnswer: "B",
    explanation: "O SolidWorks é um software de modelagem 3D paramétrica amplamente utilizado no projeto mecânico."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "O que é um corte em desenho técnico?",
    optionA: "Eliminar uma peça",
    optionB: "Aumentar a escala",
    optionC: "Representar detalhes internos imaginando a peça seccionada",
    optionD: "Diminuir a tolerância",
    correctAnswer: "C",
    explanation: "O corte é uma representação que mostra detalhes internos imaginando a peça seccionada por um plano."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "O que significa a escala 1:2 em desenho técnico?",
    optionA: "Tamanho real",
    optionB: "Ampliação de 2x",
    optionC: "Escala dobro do tamanho",
    optionD: "Redução pela metade do tamanho real",
    correctAnswer: "D",
    explanation: "A escala 1:2 indica que o desenho tem metade do tamanho real do objeto."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "Qual é a função do delineador industrial?",
    optionA: "Interpretar projetos e criar desenhos técnicos para fabricação",
    optionB: "Operar máquinas CNC",
    optionC: "Vender produtos",
    optionD: "Fazer manutenção elétrica",
    correctAnswer: "A",
    explanation: "O delineador industrial interpreta projetos e cria desenhos técnicos que orientam a fabricação das peças."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "Qual é a unidade de medida padrão em desenho técnico mecânico no Brasil?",
    optionA: "Polegada",
    optionB: "Milímetro",
    optionC: "Centímetro",
    optionD: "Metro",
    correctAnswer: "B",
    explanation: "O milímetro é a unidade padrão em desenho técnico mecânico conforme as normas ABNT."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "O que indica a hachura em um corte?",
    optionA: "Zona de tolerância",
    optionB: "Dimensão",
    optionC: "A área seccionada da peça",
    optionD: "Linha de centro",
    correctAnswer: "C",
    explanation: "A hachura indica a área da peça que foi seccionada pelo plano de corte."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "O que é a cotagem?",
    optionA: "Tipo de projeção",
    optionB: "Lista de materiais",
    optionC: "Tipo de vista",
    optionD: "Indicação das medidas no desenho",
    correctAnswer: "D",
    explanation: "A cotagem é a indicação das medidas no desenho técnico, essencial para a fabricação da peça."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "Qual tipo de linha é utilizado para representar contornos não visíveis?",
    optionA: "Linha tracejada estreita",
    optionB: "Linha contínua larga",
    optionC: "Linha contínua estreita",
    optionD: "Linha traço-ponto",
    correctAnswer: "A",
    explanation: "A linha tracejada estreita representa arestas e contornos não visíveis ao observador."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "Qual o nome da folha padrão de desenho com dimensões 297 x 210 mm?",
    optionA: "A0",
    optionB: "A4",
    optionC: "A3",
    optionD: "A2",
    correctAnswer: "B",
    explanation: "A folha A4 tem dimensões 297 x 210 mm e é um formato padrão para desenho técnico."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "O que é um desenho em perspectiva isométrica?",
    optionA: "Desenho sem profundidade",
    optionB: "Desenho em 2D apenas",
    optionC: "Representação 3D com os eixos a 120° entre si",
    optionD: "Desenho em corte",
    correctAnswer: "C",
    explanation: "A perspectiva isométrica é uma representação 3D onde os eixos formam 120° entre si."
  },
  {
    subjectName: "Delineacao Industrial",
    difficulty: "EASY",
    statement: "Qual software, desenvolvido pela Autodesk, é usado para modelagem 3D mecânica?",
    optionA: "CorelDraw",
    optionB: "Photoshop",
    optionC: "SolidWorks",
    optionD: "Inventor",
    correctAnswer: "D",
    explanation: "O Inventor é um software de modelagem 3D mecânica desenvolvido pela Autodesk."
  },

  // ============================================================
  // DISCIPLINA 2: Seguranca do Trabalho (Questões 21-40)
  // Gabarito: A, B, C, D, A, B, C, D, A, B, C, D, A, B, C, D, A, B, C, D
  // ============================================================
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "O que significa a sigla EPI?",
    optionA: "Equipamento de Proteção Individual",
    optionB: "Equipamento de Proteção Industrial",
    optionC: "Equipamento Padronizado Interno",
    optionD: "Equipamento de Prevenção Integrada",
    correctAnswer: "A",
    explanation: "EPI significa Equipamento de Proteção Individual, usado para proteger o trabalhador contra riscos."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "Qual NR trata de Equipamentos de Proteção Individual?",
    optionA: "NR-10",
    optionB: "NR-06",
    optionC: "NR-12",
    optionD: "NR-15",
    correctAnswer: "B",
    explanation: "A NR-06 estabelece as diretrizes para EPI no ambiente de trabalho."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "Qual NR dispõe sobre Segurança em Instalações e Serviços em Eletricidade?",
    optionA: "NR-01",
    optionB: "NR-06",
    optionC: "NR-10",
    optionD: "NR-33",
    correctAnswer: "C",
    explanation: "A NR-10 trata da segurança em instalações e serviços em eletricidade."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "A NR-12 trata da segurança em qual tipo de equipamento?",
    optionA: "Elétrico",
    optionB: "Equipamento de proteção",
    optionC: "Espaço confinado",
    optionD: "Máquinas e equipamentos",
    correctAnswer: "D",
    explanation: "A NR-12 dispõe sobre segurança no trabalho com máquinas e equipamentos."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "O que significa a sigla SESMT?",
    optionA: "Serviço Especializado em Engenharia de Segurança e em Medicina do Trabalho",
    optionB: "Sistema de Emergência para Segurança no Movimento de Trabalho",
    optionC: "Setor de Estudos e Sindicato dos Trabalhadores Metalúrgicos",
    optionD: "Serviço de Engenharia de Segurança e Mecânica do Trabalho",
    correctAnswer: "A",
    explanation: "SESMT é o Serviço Especializado em Engenharia de Segurança e em Medicina do Trabalho."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "Qual NR trata de trabalho em altura?",
    optionA: "NR-10",
    optionB: "NR-35",
    optionC: "NR-12",
    optionD: "NR-06",
    correctAnswer: "B",
    explanation: "A NR-35 estabelece os requisitos para trabalho em altura acima de 2 metros."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "O que significa a sigla PGR?",
    optionA: "Programa Geral de Rotinas",
    optionB: "Plano de Gestão de Riscos",
    optionC: "Programa de Gerenciamento de Riscos",
    optionD: "Programa de Garantia de Rendimento",
    correctAnswer: "C",
    explanation: "PGR é o Programa de Gerenciamento de Riscos, exigido pela NR-01."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "Qual NR trata de espaços confinados?",
    optionA: "NR-06",
    optionB: "NR-12",
    optionC: "NR-18",
    optionD: "NR-33",
    correctAnswer: "D",
    explanation: "A NR-33 estabelece os requisitos de segurança em espaços confinados."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "Qual NR trata de ergonomia no trabalho?",
    optionA: "NR-17",
    optionB: "NR-15",
    optionC: "NR-10",
    optionD: "NR-35",
    correctAnswer: "A",
    explanation: "A NR-17 estabelece diretrizes de ergonomia para adaptar o trabalho ao trabalhador."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "Qual é a finalidade do PCMSO?",
    optionA: "Controle de pragas",
    optionB: "Monitorar a saúde do trabalhador",
    optionC: "Treinar operadores",
    optionD: "Comprar EPIs",
    correctAnswer: "B",
    explanation: "O PCMSO (Programa de Controle Médico de Saúde Ocupacional) monitora a saúde do trabalhador."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "Qual NR dispõe sobre atividades e operações insalubres?",
    optionA: "NR-16",
    optionB: "NR-12",
    optionC: "NR-15",
    optionD: "NR-06",
    correctAnswer: "C",
    explanation: "A NR-15 trata das atividades e operações insalubres."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "Qual NR dispõe sobre trabalho em construção civil?",
    optionA: "NR-10",
    optionB: "NR-33",
    optionC: "NR-35",
    optionD: "NR-18",
    correctAnswer: "D",
    explanation: "A NR-18 estabelece diretrizes de segurança no trabalho em construção civil."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "O que é o DDS?",
    optionA: "Diálogo Diário de Segurança",
    optionB: "Departamento de Segurança",
    optionC: "Defesa e Segurança Diária",
    optionD: "Diretoria de Segurança do Trabalho",
    correctAnswer: "A",
    explanation: "O DDS é o Diálogo Diário de Segurança, uma reunião rápida para alinhar práticas de segurança."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "Qual EPI protege os pés contra queda de objetos?",
    optionA: "Óculos de proteção",
    optionB: "Calçado de segurança (bota)",
    optionC: "Capacete",
    optionD: "Luva",
    correctAnswer: "B",
    explanation: "O calçado de segurança (bota com bico reforçado) protege os pés contra queda de objetos."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "A NR-01 estabelece o quê?",
    optionA: "EPIs obrigatórios",
    optionB: "Segurança elétrica",
    optionC: "Disposições gerais e gerenciamento de riscos",
    optionD: "Trabalho em altura",
    correctAnswer: "C",
    explanation: "A NR-01 estabelece as disposições gerais e o gerenciamento de riscos ocupacionais (GRO/PGR)."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "Qual NR trata de atividades e operações perigosas (periculosidade)?",
    optionA: "NR-15",
    optionB: "NR-12",
    optionC: "NR-10",
    optionD: "NR-16",
    correctAnswer: "D",
    explanation: "A NR-16 trata das atividades e operações perigosas (periculosidade)."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "Qual destes é um EPI para proteção respiratória?",
    optionA: "Respirador (máscara)",
    optionB: "Capacete",
    optionC: "Óculos",
    optionD: "Luva",
    correctAnswer: "A",
    explanation: "O respirador (máscara) é um EPI de proteção respiratória contra agentes químicos e poeiras."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "O que deve ser feito em caso de acidente de trabalho?",
    optionA: "Continuar trabalhando",
    optionB: "Comunicar imediatamente o superior e registrar a ocorrência",
    optionC: "Esperar o final do expediente",
    optionD: "Sair sem avisar",
    correctAnswer: "B",
    explanation: "Em caso de acidente, deve-se comunicar imediatamente o superior e registrar a ocorrência."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "Qual é o objetivo principal do uso de EPI?",
    optionA: "Estética",
    optionB: "Identificação do trabalhador",
    optionC: "Proteger a integridade física do trabalhador",
    optionD: "Reduzir custos",
    correctAnswer: "C",
    explanation: "O EPI tem como objetivo proteger a integridade física do trabalhador contra riscos ocupacionais."
  },
  {
    subjectName: "Seguranca do Trabalho",
    difficulty: "EASY",
    statement: "O que é um mapa de risco?",
    optionA: "Mapa geográfico da empresa",
    optionB: "Lista de fornecedores",
    optionC: "Lista de EPIs",
    optionD: "Representação gráfica dos riscos ambientais no ambiente de trabalho",
    correctAnswer: "D",
    explanation: "O mapa de risco é uma representação gráfica dos riscos ambientais em cada setor do trabalho."
  },

  // ============================================================
  // DISCIPLINA 3: Matematica Aplicada (Questões 41-60)
  // Gabarito: A, B, C, D, A, B, C, D, A, B, C, D, A, B, C, D, A, B, C, D
  // ============================================================
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Qual é a fórmula da área de um quadrado de lado L?",
    optionA: "L²",
    optionB: "4L",
    optionC: "2L",
    optionD: "L/2",
    correctAnswer: "A",
    explanation: "A área de um quadrado é calculada elevando o lado ao quadrado (L²)."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Qual é o volume de um cubo de aresta a?",
    optionA: "a²",
    optionB: "a³",
    optionC: "6a²",
    optionD: "a/3",
    correctAnswer: "B",
    explanation: "O volume de um cubo é calculado elevando a aresta ao cubo (a³)."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "No Teorema de Pitágoras, qual é a relação entre os lados de um triângulo retângulo?",
    optionA: "a + b = c",
    optionB: "a × b = c",
    optionC: "a² + b² = c²",
    optionD: "a² - b² = c²",
    correctAnswer: "C",
    explanation: "O Teorema de Pitágoras estabelece que a² + b² = c², onde c é a hipotenusa."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Qual o valor aproximado de π (pi)?",
    optionA: "2,14",
    optionB: "4,16",
    optionC: "2,71",
    optionD: "3,14",
    correctAnswer: "D",
    explanation: "O valor de π é aproximadamente 3,14159, usualmente arredondado para 3,14."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Qual é a fórmula da área de um círculo de raio r?",
    optionA: "π × r²",
    optionB: "2 × π × r",
    optionC: "π × r",
    optionD: "r²",
    correctAnswer: "A",
    explanation: "A área do círculo é calculada por π multiplicado pelo raio ao quadrado."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Qual é o volume de um cilindro de raio r e altura h?",
    optionA: "π × r × h",
    optionB: "π × r² × h",
    optionC: "2 × π × r × h",
    optionD: "π × r² / h",
    correctAnswer: "B",
    explanation: "O volume do cilindro é π × r² × h, multiplicando a área da base pela altura."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Quanto vale o seno de 30°?",
    optionA: "1",
    optionB: "√3/2",
    optionC: "1/2",
    optionD: "√2/2",
    correctAnswer: "C",
    explanation: "O seno de 30° é igual a 1/2, um dos ângulos notáveis da trigonometria."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Quantos milímetros equivalem a uma polegada?",
    optionA: "2,54",
    optionB: "10",
    optionC: "12,7",
    optionD: "25,4",
    correctAnswer: "D",
    explanation: "Uma polegada equivale a 25,4 milímetros, conversão essencial em desenho técnico."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Qual é o valor da tangente de 45°?",
    optionA: "1",
    optionB: "0",
    optionC: "√3",
    optionD: "1/2",
    correctAnswer: "A",
    explanation: "A tangente de 45° é igual a 1, pois seno e cosseno são iguais a √2/2."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Qual é a fórmula do volume de uma esfera de raio r?",
    optionA: "π × r²",
    optionB: "(4/3) × π × r³",
    optionC: "4 × π × r²",
    optionD: "(4/3) × π × r",
    correctAnswer: "B",
    explanation: "O volume de uma esfera é (4/3) × π × r³."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Em uma escala 1:50, um comprimento de 2 cm no desenho representa quantos cm reais?",
    optionA: "2 cm",
    optionB: "25 cm",
    optionC: "100 cm",
    optionD: "200 cm",
    correctAnswer: "C",
    explanation: "Na escala 1:50, 2 cm × 50 = 100 cm reais."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Qual é o perímetro de um retângulo de lados 4 cm e 6 cm?",
    optionA: "10 cm",
    optionB: "24 cm",
    optionC: "12 cm",
    optionD: "20 cm",
    correctAnswer: "D",
    explanation: "O perímetro é 2 × (4 + 6) = 2 × 10 = 20 cm."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "O que é um ajuste com folga entre eixo e furo?",
    optionA: "Quando o eixo é menor que o furo",
    optionB: "Quando o eixo é maior que o furo",
    optionC: "Quando ambos têm a mesma medida",
    optionD: "Quando não há tolerância",
    correctAnswer: "A",
    explanation: "Um ajuste com folga ocorre quando o eixo é menor que o furo, permitindo movimento."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Qual é o volume de um cone de raio r e altura h?",
    optionA: "π × r² × h",
    optionB: "(1/3) × π × r² × h",
    optionC: "(1/2) × π × r² × h",
    optionD: "2 × π × r × h",
    correctAnswer: "B",
    explanation: "O volume do cone é (1/3) × π × r² × h, um terço do cilindro."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Qual é a área lateral de um cubo de aresta a?",
    optionA: "a²",
    optionB: "a³",
    optionC: "4 × a²",
    optionD: "6 × a²",
    correctAnswer: "C",
    explanation: "A área lateral do cubo são 4 faces laterais, cada uma com área a², totalizando 4 × a²."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Em projeção do primeiro diedro, onde é posicionada a vista superior em relação à vista frontal?",
    optionA: "À direita",
    optionB: "À esquerda",
    optionC: "Acima da vista frontal",
    optionD: "Abaixo da vista frontal",
    correctAnswer: "D",
    explanation: "Na projeção do primeiro diedro, a vista superior fica abaixo da vista frontal."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Em projeção do terceiro diedro, onde é posicionada a vista superior em relação à vista frontal?",
    optionA: "Acima da vista frontal",
    optionB: "Abaixo da vista frontal",
    optionC: "À direita",
    optionD: "À esquerda",
    correctAnswer: "A",
    explanation: "Na projeção do terceiro diedro, a vista superior fica acima da vista frontal."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Quanto vale o cosseno de 0°?",
    optionA: "0",
    optionB: "1",
    optionC: "1/2",
    optionD: "√2/2",
    correctAnswer: "B",
    explanation: "O cosseno de 0° é igual a 1."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Converta 50 mm para polegadas (use 1\" = 25,4 mm).",
    optionA: "2,54\"",
    optionB: "25,4\"",
    optionC: "1,968\"",
    optionD: "0,5\"",
    correctAnswer: "C",
    explanation: "50 ÷ 25,4 ≈ 1,968 polegadas."
  },
  {
    subjectName: "Matematica Aplicada",
    difficulty: "EASY",
    statement: "Qual é a área da superfície de uma esfera de raio r?",
    optionA: "π × r²",
    optionB: "(4/3) × π × r³",
    optionC: "2 × π × r",
    optionD: "4 × π × r²",
    correctAnswer: "D",
    explanation: "A área da superfície de uma esfera é 4 × π × r²."
  },

  // ============================================================
  // DISCIPLINA 4: Matematica Basica (Questões 61-80)
  // Gabarito: A, B, C, D, A, B, C, D, A, B, C, D, A, B, C, D, A, B, C, D
  // ============================================================
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Quanto é 12 + 7 × 2?",
    optionA: "26",
    optionB: "38",
    optionC: "22",
    optionD: "19",
    correctAnswer: "A",
    explanation: "Pela ordem das operações, primeiro 7 × 2 = 14, depois 12 + 14 = 26."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Qual é o resultado de 25% de 80?",
    optionA: "25",
    optionB: "20",
    optionC: "40",
    optionD: "10",
    correctAnswer: "B",
    explanation: "25% de 80 = 0,25 × 80 = 20."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Qual é o resultado da fração 1/2 + 1/4?",
    optionA: "2/6",
    optionB: "1/8",
    optionC: "3/4",
    optionD: "1/6",
    correctAnswer: "C",
    explanation: "1/2 + 1/4 = 2/4 + 1/4 = 3/4, usando denominador comum."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Qual é o MDC (Máximo Divisor Comum) de 12 e 18?",
    optionA: "2",
    optionB: "4",
    optionC: "12",
    optionD: "6",
    correctAnswer: "D",
    explanation: "O MDC de 12 e 18 é 6, o maior divisor comum entre eles."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Qual é o MMC (Mínimo Múltiplo Comum) de 4 e 6?",
    optionA: "12",
    optionB: "24",
    optionC: "6",
    optionD: "2",
    correctAnswer: "A",
    explanation: "O MMC de 4 e 6 é 12, o menor múltiplo comum entre eles."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Quanto é 7 × 8?",
    optionA: "54",
    optionB: "56",
    optionC: "64",
    optionD: "48",
    correctAnswer: "B",
    explanation: "7 × 8 = 56, resultado da tabuada do 7."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Qual é a média aritmética de 4, 6 e 8?",
    optionA: "4",
    optionB: "5",
    optionC: "6",
    optionD: "8",
    correctAnswer: "C",
    explanation: "A média é (4 + 6 + 8) ÷ 3 = 18 ÷ 3 = 6."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Qual é a fração equivalente a 1/2 com denominador 8?",
    optionA: "1/8",
    optionB: "2/8",
    optionC: "8/2",
    optionD: "4/8",
    correctAnswer: "D",
    explanation: "1/2 = 4/8, multiplicando numerador e denominador por 4."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Qual é a moda da sequência: 2, 3, 3, 4, 5?",
    optionA: "3",
    optionB: "4",
    optionC: "5",
    optionD: "2",
    correctAnswer: "A",
    explanation: "A moda é 3, pois é o valor que mais aparece na sequência."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Quanto é 0,5 + 0,25?",
    optionA: "0,30",
    optionB: "0,75",
    optionC: "0,7",
    optionD: "0,5",
    correctAnswer: "B",
    explanation: "0,5 + 0,25 = 0,75."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Qual é o resultado de 144 ÷ 12?",
    optionA: "10",
    optionB: "24",
    optionC: "12",
    optionD: "14",
    correctAnswer: "C",
    explanation: "144 ÷ 12 = 12."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Qual é a mediana da sequência: 5, 7, 9, 11?",
    optionA: "5",
    optionB: "7",
    optionC: "11",
    optionD: "8",
    correctAnswer: "D",
    explanation: "Para um número par de valores, a mediana é a média dos dois centrais: (7 + 9) ÷ 2 = 8."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Qual é a fração simplificada de 6/9?",
    optionA: "2/3",
    optionB: "3/2",
    optionC: "1/3",
    optionD: "6/3",
    correctAnswer: "A",
    explanation: "6/9 simplificada por 3 resulta em 2/3."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Em uma regra de três, se 3 peças custam R$ 30, quanto custam 5 peças?",
    optionA: "R$ 30",
    optionB: "R$ 50",
    optionC: "R$ 15",
    optionD: "R$ 60",
    correctAnswer: "B",
    explanation: "Cada peça custa R$ 10, então 5 peças custam 5 × 10 = R$ 50."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Quanto é 1/2 de 100?",
    optionA: "25",
    optionB: "75",
    optionC: "50",
    optionD: "100",
    correctAnswer: "C",
    explanation: "1/2 de 100 = 100 ÷ 2 = 50."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Qual é o resultado de 2³?",
    optionA: "6",
    optionB: "5",
    optionC: "16",
    optionD: "8",
    correctAnswer: "D",
    explanation: "2³ = 2 × 2 × 2 = 8."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Qual é o resultado de 15 - 4 × 2?",
    optionA: "7",
    optionB: "22",
    optionC: "11",
    optionD: "30",
    correctAnswer: "A",
    explanation: "Pela ordem das operações, 4 × 2 = 8, depois 15 - 8 = 7."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Quanto é 0,1 × 100?",
    optionA: "1",
    optionB: "10",
    optionC: "100",
    optionD: "0,1",
    correctAnswer: "B",
    explanation: "0,1 × 100 = 10."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Qual é o resultado da fração 5/10 simplificada?",
    optionA: "1/10",
    optionB: "5/5",
    optionC: "1/2",
    optionD: "2/1",
    correctAnswer: "C",
    explanation: "5/10 simplificada por 5 resulta em 1/2."
  },
  {
    subjectName: "Matematica Basica",
    difficulty: "EASY",
    statement: "Qual é o número decimal equivalente a 3/4?",
    optionA: "0,25",
    optionB: "0,5",
    optionC: "0,34",
    optionD: "0,75",
    correctAnswer: "D",
    explanation: "3 ÷ 4 = 0,75, que é o equivalente decimal de 3/4."
  },

  // ============================================================
  // DISCIPLINA 5: Manual do Delineador (Questões 81-100)
  // Gabarito: A, B, C, D, A, B, C, D, A, B, C, D, A, B, C, D, A, B, C, D
  // ============================================================
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Qual válvula é utilizada para bloqueio total do fluxo, sem regulação?",
    optionA: "Válvula gaveta",
    optionB: "Válvula globo",
    optionC: "Válvula borboleta",
    optionD: "Válvula agulha",
    correctAnswer: "A",
    explanation: "A válvula gaveta é utilizada para bloqueio total do fluxo, não sendo recomendada para regulação."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Qual válvula é mais indicada para regulação de vazão?",
    optionA: "Válvula gaveta",
    optionB: "Válvula globo",
    optionC: "Válvula de retenção",
    optionD: "Válvula esfera",
    correctAnswer: "B",
    explanation: "A válvula globo é indicada para regulação de vazão devido ao seu projeto."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Qual é a função da válvula de retenção (check)?",
    optionA: "Regular pressão",
    optionB: "Bloquear fluxo manualmente",
    optionC: "Impedir o retorno do fluxo",
    optionD: "Misturar fluidos",
    correctAnswer: "C",
    explanation: "A válvula de retenção (check) impede o retorno do fluxo no sistema."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Quantos milímetros equivalem a 2 polegadas?",
    optionA: "25,4 mm",
    optionB: "12,7 mm",
    optionC: "2,54 mm",
    optionD: "50,8 mm",
    correctAnswer: "D",
    explanation: "2 × 25,4 = 50,8 mm, já que uma polegada equivale a 25,4 mm."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Qual o tipo de válvula de fechamento rápido usada em gasodutos?",
    optionA: "Válvula esfera",
    optionB: "Válvula gaveta",
    optionC: "Válvula globo",
    optionD: "Válvula diafragma",
    correctAnswer: "A",
    explanation: "A válvula esfera é de fechamento rápido, sendo amplamente usada em gasodutos."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Qual a função do purgador (steam trap) em sistemas de vapor?",
    optionA: "Aumentar a pressão",
    optionB: "Remover condensado sem perder vapor",
    optionC: "Resfriar o vapor",
    optionD: "Aquecer o vapor",
    correctAnswer: "B",
    explanation: "O purgador remove o condensado do sistema sem perder o vapor, mantendo a eficiência térmica."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Qual o tipo de purgador mais comum para sistemas de vapor?",
    optionA: "Purgador de óleo",
    optionB: "Purgador de água fria",
    optionC: "Purgador termodinâmico",
    optionD: "Purgador pneumático",
    correctAnswer: "C",
    explanation: "O purgador termodinâmico é um dos tipos mais comuns utilizados em sistemas de vapor."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "O que é um trocador de calor?",
    optionA: "Equipamento que gera calor",
    optionB: "Equipamento que estoca vapor",
    optionC: "Equipamento que resfria ambientes",
    optionD: "Equipamento que transfere calor entre dois fluidos",
    correctAnswer: "D",
    explanation: "O trocador de calor transfere calor entre dois fluidos sem que eles se misturem."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "O que significa a sigla TEMA em trocadores de calor?",
    optionA: "Tubular Exchanger Manufacturers Association",
    optionB: "Tecnologia de Engenharia de Máquinas e Aquecimento",
    optionC: "Termo de Engenharia Mecânica Aplicada",
    optionD: "Técnicos Especializados em Manutenção Aquecida",
    correctAnswer: "A",
    explanation: "TEMA é a Tubular Exchanger Manufacturers Association, que padroniza trocadores de calor."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Em soldagem, qual posição é a 1G?",
    optionA: "Vertical",
    optionB: "Plana",
    optionC: "Sobre-cabeça",
    optionD: "Horizontal",
    correctAnswer: "B",
    explanation: "A posição 1G refere-se à soldagem em posição plana."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Em soldagem, qual é a posição 2G?",
    optionA: "Plana",
    optionB: "Sobre-cabeça",
    optionC: "Horizontal",
    optionD: "Vertical descendente",
    correctAnswer: "C",
    explanation: "A posição 2G refere-se à soldagem em posição horizontal."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Qual destas é uma posição de soldagem para tubulação?",
    optionA: "Posição vertical ascendente",
    optionB: "Posição horizontal",
    optionC: "Posição plana",
    optionD: "Todas as anteriores são posições de soldagem",
    correctAnswer: "D",
    explanation: "As posições de soldagem em tubulação incluem plana, horizontal, vertical e sobre-cabeça."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Em qual posição de soldagem o tubo é girado sob eixo horizontal e a solda é feita no topo?",
    optionA: "1G",
    optionB: "2G",
    optionC: "5G",
    optionD: "6G",
    correctAnswer: "A",
    explanation: "Na posição 1G, o tubo é girado sob eixo horizontal e a solda é feita no topo em posição plana."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Qual destas válvulas permite apenas o fluxo em uma direção?",
    optionA: "Gaveta",
    optionB: "Retenção",
    optionC: "Globo",
    optionD: "Borboleta",
    correctAnswer: "B",
    explanation: "A válvula de retenção permite o fluxo em apenas uma direção, impedindo o retorno."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "O que é um cabo de aço especificado como 6x19?",
    optionA: "6 cabos com 19 metros",
    optionB: "19 cabos com 6 pernas",
    optionC: "6 pernas com 19 arames cada",
    optionD: "6 metros com 19 cabos",
    correctAnswer: "C",
    explanation: "A especificação 6x19 indica 6 pernas, cada uma com 19 arames."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Para que serve a isolação térmica em tubulações?",
    optionA: "Aumentar a temperatura",
    optionB: "Diminuir a pressão",
    optionC: "Aumentar o fluxo",
    optionD: "Reduzir perdas de calor e proteger trabalhadores",
    correctAnswer: "D",
    explanation: "A isolação térmica reduz as perdas de calor e protege os trabalhadores contra queimaduras."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "O que é um shackle?",
    optionA: "Um tipo de elo de ligação usado em elevação de carga",
    optionB: "Um tipo de válvula",
    optionC: "Um purgador",
    optionD: "Um trocador de calor",
    correctAnswer: "A",
    explanation: "O shackle é um elo de ligação em forma de U usado em operações de elevação de carga."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Qual a função do orifício de vent em um purgador de vapor?",
    optionA: "Aumentar a pressão",
    optionB: "Eliminar gases não condensáveis",
    optionC: "Resfriar o vapor",
    optionD: "Aquecer o condensado",
    correctAnswer: "B",
    explanation: "O orifício de vent elimina os gases não condensáveis do sistema de vapor."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Qual destes é um tipo de trocador de calor?",
    optionA: "Válvula gaveta",
    optionB: "Purgador",
    optionC: "Trocador casco e tubo",
    optionD: "Filtro Y",
    correctAnswer: "C",
    explanation: "O trocador casco e tubo (shell and tube) é um dos tipos mais comuns de trocadores de calor."
  },
  {
    subjectName: "Manual do Delineador",
    difficulty: "EASY",
    statement: "Qual é a espessura nominal aproximada de parede de um tubo de 1\" Schedule 40?",
    optionA: "1,0 mm",
    optionB: "2,0 mm",
    optionC: "1,5 mm",
    optionD: "3,3 mm",
    correctAnswer: "D",
    explanation: "Um tubo de 1\" Schedule 40 possui espessura de parede de aproximadamente 3,3 mm."
  }
]
