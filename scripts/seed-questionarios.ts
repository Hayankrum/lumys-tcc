import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

interface OpcaoSeed {
  texto: string
  correta?: boolean
}

interface PerguntaSeed {
  texto: string
  tipo: 'texto_curto' | 'texto_longo' | 'escolha_unica' | 'multipla_escolha' | 'escala'
  obrigatoria: boolean
  ordem: number
  opcoes?: OpcaoSeed[]
  configEscala?: { min: number; max: number; passo: number }
  condicoes?: { perguntaOrigemId: number; tipoCondicao: string; valor: string }[]
}

interface QuestaoSeed {
  titulo: string
  descricao: string
  status: 'rascunho' | 'publicado' | 'encerrado'
  anonimo: boolean
  resultadosVisiveis: boolean
  corTema: string
  usuariosEsperados?: number | null
  encerraEm?: Date | null
  criadoEm: Date
  perguntas: PerguntaSeed[]
}

interface RespostaSeed {
  ordemPergunta: number
  valorNumerico?: number
  texto?: string
  opcaoOrdinais?: number[]
}

async function main() {
  const senha = await bcrypt.hash('senha123', 10)

  const admin = await prisma.usuario.findUnique({ where: { id: 1 } })
  if (!admin) {
    console.error('Usuário admin (id 1) não encontrado. Execute o seed após criar a conta principal.')
    process.exit(1)
  }

  const nomesRespondentes = [
    'Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Farias', 'Eduarda Rocha',
    'Felipe Nogueira', 'Gabriela Torres', 'Hugo Pinto', 'Isabela Ramos', 'João Pereira',
    'Larissa Castro', 'Marcos Vieira', 'Natalia Duarte', 'Otavio Reis', 'Paula Cardoso',
    'Rafael Monteiro', 'Sabrina Alves', 'Thiago Barros', 'Victoria Nunes', 'William Costa',
  ]

  const usuariosExistentes = new Set((await prisma.usuario.findMany({ select: { email: true } })).map((u) => u.email))
  const responderReal = async (nome: string, idx: number) => {
    const email = `seed.aluno${idx}@email.com`
    if (usuariosExistentes.has(email)) return prisma.usuario.findUnique({ where: { email } })
    const u = await prisma.usuario.create({
      data: { nome, email, senha, tipoUsuario: 'discente', aceitouTermos: true },
    })
    usuariosExistentes.add(email)
    return u
  }

  const agora = new Date()
  const daqui = (dias: number) => new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000)

  const seeds: QuestaoSeed[] = [
    {
      titulo: 'Pesquisa de Satisfação Geral da Turma',
      descricao: 'Queremos saber como você avalia as aulas, o curso e a infraestrutura do nosso colégio técnico. Sua opinião é anônima e muito importante para melhorarmos.',
      status: 'publicado',
      anonimo: true,
      resultadosVisiveis: true,
      corTema: '#6366f1',
      usuariosEsperados: 25,
      encerraEm: daqui(30),
      criadoEm: daqui(-20),
      perguntas: [
        { texto: 'Como você avalia a qualidade das aulas?', tipo: 'escolha_unica', obrigatoria: true, ordem: 1, opcoes: [
          { texto: 'Muito boas' }, { texto: 'Boas' }, { texto: 'Regulares' }, { texto: 'Ruins' }, { texto: 'Muito ruins' },
        ] },
        { texto: 'De 1 a 5, quanto você recomendaria este curso a outros alunos?', tipo: 'escala', obrigatoria: true, ordem: 2, configEscala: { min: 1, max: 5, passo: 1 } },
        { texto: 'Você pretende usar o conhecimento do curso em projetos futuros?', tipo: 'escolha_unica', obrigatoria: false, ordem: 3, opcoes: [
          { texto: 'Sim, com certeza' }, { texto: 'Talvez' }, { texto: 'Não' },
        ] },
        { texto: 'Qual disciplina você gostaria que fosse oferecida no próximo semestre?', tipo: 'texto_curto', obrigatoria: false, ordem: 4 },
      ],
    },
    {
      titulo: 'Quiz de Lógica de Programação',
      descricao: 'Quiz rápido para revisar conceitos de lógica e JavaScript. Marque a alternativa correta em cada questão.',
      status: 'publicado',
      anonimo: false,
      resultadosVisiveis: true,
      corTema: '#10b981',
      usuariosEsperados: 10,
      encerraEm: daqui(15),
      criadoEm: daqui(-10),
      perguntas: [
        { texto: 'Qual é a saída de console.log(2 + "2")?', tipo: 'escolha_unica', obrigatoria: true, ordem: 1, opcoes: [
          { texto: '4' }, { texto: '22', correta: true }, { texto: 'NaN' }, { texto: 'Erro de sintaxe' },
        ] },
        { texto: 'Qual estrutura é usada para percorrer um array?', tipo: 'escolha_unica', obrigatoria: true, ordem: 2, opcoes: [
          { texto: 'if' }, { texto: 'switch' }, { texto: 'for', correta: true }, { texto: 'function' },
        ] },
        { texto: 'Qual operador compara valor e tipo em JavaScript?', tipo: 'escolha_unica', obrigatoria: true, ordem: 3, opcoes: [
          { texto: '==' }, { texto: '===' , correta: true}, { texto: '=' }, { texto: '!' },
        ] },
      ],
    },
    {
      titulo: 'Pesquisa de Estilo de Aprendizagem',
      descricao: 'Responda sobre como você prefere aprender e quais recursos mais ajudam nos seus estudos. Questionário anônimo com resultados restritos ao professor.',
      status: 'publicado',
      anonimo: true,
      resultadosVisiveis: false,
      corTema: '#0ea5e9',
      usuariosEsperados: null,
      encerraEm: daqui(20),
      criadoEm: daqui(-8),
      perguntas: [
        { texto: 'Quais recursos ajudam você a aprender melhor? (marque todos que se aplicam)', tipo: 'multipla_escolha', obrigatoria: true, ordem: 1, opcoes: [
          { texto: 'Vídeos' }, { texto: 'Exercícios práticos' }, { texto: 'Leituras' }, { texto: 'Aulas ao vivo' }, { texto: 'Grupos de estudo' },
        ] },
        { texto: 'De 1 a 10, quanto você aprende melhor praticando do que apenas ouvindo?', tipo: 'escala', obrigatoria: true, ordem: 2, configEscala: { min: 1, max: 10, passo: 1 } },
        { texto: 'Descreva, em poucas palavras, como você costuma estudar melhor.', tipo: 'texto_longo', obrigatoria: false, ordem: 3 },
      ],
    },
    {
      titulo: 'Feedback da Feira de Tecnologia',
      descricao: 'Avalie a Feira de Tecnologia do colégio. As perguntas com condição só aparecem para quem participou.',
      status: 'publicado',
      anonimo: true,
      resultadosVisiveis: true,
      corTema: '#f59e0b',
      usuariosEsperados: 30,
      encerraEm: daqui(7),
      criadoEm: daqui(-3),
      perguntas: [
        { texto: 'Você participou da Feira de Tecnologia?', tipo: 'escolha_unica', obrigatoria: true, ordem: 1, opcoes: [
          { texto: 'Sim (presencial)' }, { texto: 'Sim (online)' }, { texto: 'Não participei' },
        ] },
        { texto: 'Como você avalia a organização da feira?', tipo: 'escala', obrigatoria: true, ordem: 2, configEscala: { min: 1, max: 5, passo: 1 }, condicoes: [
          { perguntaOrigemId: 1, tipoCondicao: 'igual', valor: 'Sim (presencial)' },
        ] },
        { texto: 'Qual estande mais chamou sua atenção?', tipo: 'texto_curto', obrigatoria: false, ordem: 3, condicoes: [
          { perguntaOrigemId: 1, tipoCondicao: 'diferente', valor: 'Não participei' },
        ] },
      ],
    },
    {
      titulo: 'Escolha da Disciplina Eletiva',
      descricao: 'A turma votará na disciplina eletiva que será ofertada no próximo semestre. Vote na sua preferida e sugira novas ideias.',
      status: 'publicado',
      anonimo: true,
      resultadosVisiveis: true,
      corTema: '#ec4899',
      usuariosEsperados: 20,
      encerraEm: daqui(5),
      criadoEm: daqui(-2),
      perguntas: [
        { texto: 'Qual eletiva você prefere para o próximo semestre?', tipo: 'escolha_unica', obrigatoria: true, ordem: 1, opcoes: [
          { texto: 'Desenvolvimento de Jogos' }, { texto: 'Inteligência Artificial' }, { texto: 'Segurança da Informação' }, { texto: 'Robótica' }, { texto: 'Design de Interfaces' },
        ] },
        { texto: 'De 1 a 5, qual seu nível de interesse em programação?', tipo: 'escala', obrigatoria: false, ordem: 2, configEscala: { min: 1, max: 5, passo: 1 } },
        { texto: 'Sugira outra eletiva de seu interesse.', tipo: 'texto_curto', obrigatoria: false, ordem: 3 },
      ],
    },
    {
      titulo: 'Avaliação do Aplicativo Lumys',
      descricao: 'Avalie sua experiência com o aplicativo Lumys: usabilidade, velocidade e funcionamento offline. Seu retorno ajuda a melhorar o projeto.',
      status: 'publicado',
      anonimo: true,
      resultadosVisiveis: true,
      corTema: '#8b5cf6',
      usuariosEsperados: null,
      encerraEm: daqui(14),
      criadoEm: daqui(-5),
      perguntas: [
        { texto: 'De 1 a 5, como você avalia a facilidade de uso do aplicativo?', tipo: 'escala', obrigatoria: true, ordem: 1, configEscala: { min: 1, max: 5, passo: 1 } },
        { texto: 'De 1 a 5, como você avalia a velocidade do aplicativo?', tipo: 'escala', obrigatoria: false, ordem: 2, configEscala: { min: 1, max: 5, passo: 1 } },
        { texto: 'Você conseguiu usar o aplicativo offline?', tipo: 'escolha_unica', obrigatoria: false, ordem: 3, opcoes: [
          { texto: 'Sim, na maioria das vezes' }, { texto: 'Sim, mas com limitações' }, { texto: 'Não testei' },
        ] },
        { texto: 'O que você sugere para melhorar o Lumys?', tipo: 'texto_longo', obrigatoria: false, ordem: 4 },
      ],
    },
    {
      titulo: 'Pesquisa de Hábitos de Estudo da Turma',
      descricao: 'Responda sobre seus hábitos de estudo para que possamos orientar melhor a turma. Suas respostas são anônimas.',
      status: 'publicado',
      anonimo: true,
      resultadosVisiveis: true,
      corTema: '#14b8a6',
      usuariosEsperados: null,
      encerraEm: daqui(10),
      criadoEm: daqui(-6),
      perguntas: [
        { texto: 'Quantas horas por dia você costuma estudar fora da sala de aula?', tipo: 'multipla_escolha', obrigatoria: true, ordem: 1, opcoes: [
          { texto: 'Menos de 1h' }, { texto: '1 a 2 horas' }, { texto: '2 a 4 horas' }, { texto: 'Mais de 4 horas' },
        ] },
        { texto: 'Você costuma estudar em grupo?', tipo: 'escolha_unica', obrigatoria: true, ordem: 2, opcoes: [
          { texto: 'Sim, frequentemente' }, { texto: 'Sim, às vezes' }, { texto: 'Raramente' }, { texto: 'Nunca' },
        ] },
        { texto: 'De 1 a 10, qual seu nível de dedicação aos estudos?', tipo: 'escala', obrigatoria: false, ordem: 3, configEscala: { min: 1, max: 10, passo: 1 } },
        { texto: 'Qual matéria você tem mais dificuldade?', tipo: 'texto_curto', obrigatoria: false, ordem: 4 },
      ],
    },
    {
      titulo: 'Enquete de Conclusão do Curso Técnico',
      descricao: 'Enquete aplicada ao final do curso para revisar os conhecimentos. Encerrada — veja os resultados consolidados.',
      status: 'encerrado',
      anonimo: false,
      resultadosVisiveis: true,
      corTema: '#ef4444',
      usuariosEsperados: null,
      encerraEm: null,
      criadoEm: daqui(-40),
      perguntas: [
        { texto: 'Qual etapa faz parte do ciclo de desenvolvimento de software?', tipo: 'escolha_unica', obrigatoria: true, ordem: 1, opcoes: [
          { texto: 'Planejamento', correta: true }, { texto: 'Cancelamento' }, { texto: 'Adiamento' }, { texto: 'Improvisação' },
        ] },
        { texto: 'Qual banco de dados é o mais indicado para aplicar o que estudamos no curso?', tipo: 'escolha_unica', obrigatoria: true, ordem: 2, opcoes: [
          { texto: 'PostgreSQL', correta: true }, { texto: 'Planilha de Excel' }, { texto: 'Arquivo de texto' }, { texto: 'Bloco de anotações' },
        ] },
        { texto: 'Deixe um breve comentário sobre sua experiência no curso.', tipo: 'texto_longo', obrigatoria: false, ordem: 3 },
      ],
    },
  ]

  const respostasPorQuestao: RespostaSeed[][][] = [
    [
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 5 }, { ordemPergunta: 3, opcaoOrdinais: [0] }, { ordemPergunta: 4, texto: 'Banco de dados avançado' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 4 }, { ordemPergunta: 3, opcaoOrdinais: [1] }, { ordemPergunta: 4, texto: 'Redes de computadores' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, valorNumerico: 5 }, { ordemPergunta: 3, opcaoOrdinais: [0] }, { ordemPergunta: 4, texto: 'Inteligência artificial' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, valorNumerico: 4 }, { ordemPergunta: 3, opcaoOrdinais: [0] }, { ordemPergunta: 4, texto: '' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [2] }, { ordemPergunta: 2, valorNumerico: 3 }, { ordemPergunta: 3, opcaoOrdinais: [1] }, { ordemPergunta: 4, texto: 'Mais aulas práticas' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 5 }, { ordemPergunta: 3, opcaoOrdinais: [0] }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, valorNumerico: 4 }, { ordemPergunta: 3, opcaoOrdinais: [2] }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, valorNumerico: 5 }, { ordemPergunta: 3, opcaoOrdinais: [0] }, { ordemPergunta: 4, texto: 'Segurança da informação' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 4 }, { ordemPergunta: 3, opcaoOrdinais: [0] }, { ordemPergunta: 4, texto: 'DevOps' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [2] }, { ordemPergunta: 2, valorNumerico: 2 }, { ordemPergunta: 3, opcaoOrdinais: [1] }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 5 }, { ordemPergunta: 3, opcaoOrdinais: [0] }, { ordemPergunta: 4, texto: 'Inglês para programadores' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, valorNumerico: 4 }, { ordemPergunta: 3, opcaoOrdinais: [1] }, { ordemPergunta: 4, texto: 'Cloud computing' }],
    ],
    [
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, opcaoOrdinais: [2] }, { ordemPergunta: 3, opcaoOrdinais: [1] }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, opcaoOrdinais: [2] }, { ordemPergunta: 3, opcaoOrdinais: [1] }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, opcaoOrdinais: [2] }, { ordemPergunta: 3, opcaoOrdinais: [1] }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, opcaoOrdinais: [0] }, { ordemPergunta: 3, opcaoOrdinais: [1] }],
      [{ ordemPergunta: 1, opcaoOrdinais: [2] }, { ordemPergunta: 2, opcaoOrdinais: [2] }, { ordemPergunta: 3, opcaoOrdinais: [1] }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, opcaoOrdinais: [2] }, { ordemPergunta: 3, opcaoOrdinais: [0] }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, opcaoOrdinais: [3] }, { ordemPergunta: 3, opcaoOrdinais: [1] }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, opcaoOrdinais: [2] }, { ordemPergunta: 3, opcaoOrdinais: [1] }],
    ],
    [
      [{ ordemPergunta: 1, opcaoOrdinais: [0, 1] }, { ordemPergunta: 2, valorNumerico: 8 }, { ordemPergunta: 3, texto: 'Prefiro vídeos e depois pratico com exercícios.' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, valorNumerico: 9 }, { ordemPergunta: 3, texto: 'Mãos na massa: resolve tudo na prática.' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1, 4] }, { ordemPergunta: 2, valorNumerico: 7 }, { ordemPergunta: 3, texto: 'Estudo em grupo e resolvo exercícios juntos.' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [2] }, { ordemPergunta: 2, valorNumerico: 5 }, { ordemPergunta: 3, texto: 'Leio bastante e faço resumos.' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0, 1, 3] }, { ordemPergunta: 2, valorNumerico: 8 }, { ordemPergunta: 3, texto: 'Aulas ao vivo e vídeos me ajudam muito.' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1, 2] }, { ordemPergunta: 2, valorNumerico: 6 }, { ordemPergunta: 3, texto: '' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0, 4] }, { ordemPergunta: 2, valorNumerico: 7 }, { ordemPergunta: 3, texto: 'Assisto vídeos, mas prefiro discutir em grupo.' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, valorNumerico: 10 }, { ordemPergunta: 3, texto: 'Só aprendo fazendo projetos reais.' }],
    ],
    [
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 5 }, { ordemPergunta: 3, texto: 'Estande de Robótica' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 4 }, { ordemPergunta: 3, texto: 'Estande de IA' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 5 }, { ordemPergunta: 3, texto: 'Estande de Jogos' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 3 }, { ordemPergunta: 3, texto: 'Impressionou bem' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 3, texto: 'Assisti pela internet' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 4 }, { ordemPergunta: 3, texto: 'Estande de Impressão 3D' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 5 }, { ordemPergunta: 3, texto: 'Todos estavam excelentes' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [2] }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 4 }, { ordemPergunta: 3, texto: 'O de drones foi incrível' }],
    ],
    [
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 5 }, { ordemPergunta: 3, texto: 'Cibersegurança' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, valorNumerico: 5 }, { ordemPergunta: 3, texto: 'Machine Learning' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 4 }, { ordemPergunta: 3, texto: 'Design de jogos' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [2] }, { ordemPergunta: 2, valorNumerico: 3 }, { ordemPergunta: 3, texto: 'Pentest' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [3] }, { ordemPergunta: 2, valorNumerico: 5 }, { ordemPergunta: 3, texto: 'Automação residencial' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, valorNumerico: 4 }, { ordemPergunta: 3, texto: 'Desenvolvimento mobile' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 3, texto: 'Processamento de linguagem natural' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [4] }, { ordemPergunta: 2, valorNumerico: 2 }, { ordemPergunta: 3, texto: 'UX Research' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [2] }, { ordemPergunta: 2, valorNumerico: 4 }, { ordemPergunta: 3, texto: 'Hacking ético' }],
    ],
    [
      [{ ordemPergunta: 1, valorNumerico: 5 }, { ordemPergunta: 2, valorNumerico: 5 }, { ordemPergunta: 3, opcaoOrdinais: [0] }, { ordemPergunta: 4, texto: 'Muito bom, recomendo!' }],
      [{ ordemPergunta: 1, valorNumerico: 4 }, { ordemPergunta: 2, valorNumerico: 4 }, { ordemPergunta: 3, opcaoOrdinais: [1] }, { ordemPergunta: 4, texto: 'Funciona bem offline na maioria dos casos.' }],
      [{ ordemPergunta: 1, valorNumerico: 5 }, { ordemPergunta: 3, opcaoOrdinais: [0] }, { ordemPergunta: 4, texto: 'Ótimo para responder questionários sem internet.' }],
      [{ ordemPergunta: 1, valorNumerico: 3 }, { ordemPergunta: 2, valorNumerico: 3 }, { ordemPergunta: 3, opcaoOrdinais: [2] }, { ordemPergunta: 4, texto: 'Quero receber notificações push de novos questionários.' }],
      [{ ordemPergunta: 1, valorNumerico: 4 }, { ordemPergunta: 2, valorNumerico: 5 }, { ordemPergunta: 3, opcaoOrdinais: [0] }, { ordemPergunta: 4, texto: 'Tudo muito intuitivo.' }],
      [{ ordemPergunta: 1, valorNumerico: 5 }, { ordemPergunta: 2, valorNumerico: 4 }, { ordemPergunta: 3, opcaoOrdinais: [1] }, { ordemPergunta: 4, texto: 'Adicionar leitura de QR no próprio formulário.' }],
      [{ ordemPergunta: 1, valorNumerico: 4 }, { ordemPergunta: 3, opcaoOrdinais: [0] }, { ordemPergunta: 4, texto: 'Leve e rápido.' }],
    ],
    [
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, opcaoOrdinais: [1] }, { ordemPergunta: 3, valorNumerico: 7 }, { ordemPergunta: 4, texto: 'Cálculo' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0, 2] }, { ordemPergunta: 2, opcaoOrdinais: [0] }, { ordemPergunta: 3, valorNumerico: 8 }, { ordemPergunta: 4, texto: 'Física' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, opcaoOrdinais: [1] }, { ordemPergunta: 3, valorNumerico: 6 }, { ordemPergunta: 4, texto: 'Redação' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [2] }, { ordemPergunta: 2, opcaoOrdinais: [2] }, { ordemPergunta: 3, valorNumerico: 5 }, { ordemPergunta: 4, texto: 'Química' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1, 2] }, { ordemPergunta: 2, opcaoOrdinais: [0] }, { ordemPergunta: 3, valorNumerico: 9 }, { ordemPergunta: 4, texto: 'Matemática' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, opcaoOrdinais: [1] }, { ordemPergunta: 3, valorNumerico: 7 }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, opcaoOrdinais: [3] }, { ordemPergunta: 3, valorNumerico: 4 }, { ordemPergunta: 4, texto: 'Inglês' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0, 1, 2] }, { ordemPergunta: 2, opcaoOrdinais: [0] }, { ordemPergunta: 3, valorNumerico: 8 }, { ordemPergunta: 4, texto: 'Programação' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [3] }, { ordemPergunta: 2, opcaoOrdinais: [1] }, { ordemPergunta: 3, valorNumerico: 6 }, { ordemPergunta: 4, texto: 'História' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, opcaoOrdinais: [0] }, { ordemPergunta: 3, valorNumerico: 9 }, { ordemPergunta: 4, texto: 'Algoritmos' }],
    ],
    [
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, opcaoOrdinais: [0] }, { ordemPergunta: 3, texto: 'O curso foi transformador e os professores excelentes.' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, opcaoOrdinais: [0] }, { ordemPergunta: 3, texto: 'Aprendi muito sobre banco de dados e lógica.' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [1] }, { ordemPergunta: 2, opcaoOrdinais: [0] }, { ordemPergunta: 3, texto: 'Poderia ter mais atividades práticas.' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, opcaoOrdinais: [1] }, { ordemPergunta: 3, texto: 'Valeu muito a pena participar do projeto final.' }],
      [{ ordemPergunta: 1, opcaoOrdinais: [0] }, { ordemPergunta: 2, opcaoOrdinais: [0] }, { ordemPergunta: 3, texto: 'Gostaria de continuar com projetos depois do curso.' }],
    ],
  ]

  let usuariosCriados = 0
  for (const seed of seeds) {
    const tituloExistente = await prisma.questionario.findFirst({ where: { titulo: seed.titulo } })
    if (tituloExistente) {
      console.log(`Já existe: "${seed.titulo}" (id ${tituloExistente.id})`)
      continue
    }

    const questionario = await prisma.questionario.create({
      data: {
        titulo: seed.titulo,
        descricao: seed.descricao,
        status: seed.status,
        anonimo: seed.anonimo,
        resultadosVisiveis: seed.resultadosVisiveis,
        corTema: seed.corTema,
        usuariosEsperados: seed.usuariosEsperados ?? null,
        encerraEm: seed.encerraEm ?? null,
        criadoEm: seed.criadoEm,
        autorId: 1,
        perguntas: {
          create: seed.perguntas.map((p) => ({
            texto: p.texto,
            tipo: p.tipo,
            obrigatoria: p.obrigatoria,
            ordem: p.ordem,
            configEscala: p.configEscala ?? undefined,
            opcoes: {
              create: (p.opcoes || []).map((o) => ({ texto: o.texto, ordem: p.opcoes!.indexOf(o) + 1, correta: o.correta ?? false })),
            },
          })),
        },
      },
      include: { perguntas: { include: { opcoes: true }, orderBy: { ordem: 'asc' } } },
    })

    if (seed.perguntas.some((p) => p.condicoes)) {
      for (const p of seed.perguntas) {
        if (p.condicoes && p.condicoes.length > 0) {
          const pergunta = questionario.perguntas.find((q) => q.ordem === p.ordem)
          if (pergunta) {
            await prisma.pergunta.update({
              where: { id: pergunta.id },
              data: { condicoes: JSON.stringify(p.condicoes) },
            })
          }
        }
      }
      console.log(`  Condições aplicadas: "${seed.titulo}"`)
    }

    const respostas = respostasPorQuestao[seeds.indexOf(seed)] || []
    for (let ri = 0; ri < respostas.length; ri++) {
      const valoresSeed = respostas[ri]

      let usuario
      if (seed.anonimo) {
        usuario = await prisma.usuario.create({
          data: {
            nome: 'Respondente Anônimo',
            email: `anonimo-seed-${Date.now()}-${ri}@temp.com`,
            senha: '',
            tipoUsuario: 'discente',
            aceitouTermos: true,
          },
        })
        usuariosCriados++
      } else {
        usuario = await prisma.usuario.findUnique({ where: { email: `seed.aluno${ri + 1}@email.com` } })
        if (!usuario) {
          const nomeBase = nomesRespondentes[ri % nomesRespondentes.length]
          usuario = await responderReal(nomeBase, ri + 1)
          usuariosCriados++
        }
      }

      const criadoEmAnonimo = new Date(fimSeeded(seed, ri))
      const resposta = await prisma.resposta.create({
        data: {
          usuarioId: usuario!.id,
          questionarioId: questionario.id,
          nomeAnonimo: seed.anonimo && !seed.status.includes('rascunho') ? nomesRespondentes[ri % nomesRespondentes.length] : null,
          criadoEm: criadoEmAnonimo,
        },
      })

      for (const val of valoresSeed) {
        const pergunta = questionario.perguntas.find((p) => p.ordem === val.ordemPergunta)
        if (!pergunta) continue

        if (pergunta.tipo === 'escala') {
          await prisma.valorResposta.create({
            data: { respostaId: resposta.id, perguntaId: pergunta.id, valorNumerico: val.valorNumerico },
          })
        } else if (pergunta.tipo === 'multipla_escolha' && val.opcaoOrdinais) {
          for (const ord of val.opcaoOrdinais) {
            const opcao = pergunta.opcoes.sort((a, b) => a.ordem - b.ordem)[ord]
            if (opcao) {
              await prisma.valorResposta.create({
                data: { respostaId: resposta.id, perguntaId: pergunta.id, opcaoId: opcao.id },
              })
            }
          }
        } else if (val.opcaoOrdinais && pergunta.tipo === 'escolha_unica') {
          const opcao = pergunta.opcoes.sort((a, b) => a.ordem - b.ordem)[val.opcaoOrdinais[0]]
          if (opcao) {
            await prisma.valorResposta.create({
              data: { respostaId: resposta.id, perguntaId: pergunta.id, opcaoId: opcao.id },
            })
          }
        } else if (val.texto) {
          await prisma.valorResposta.create({
            data: { respostaId: resposta.id, perguntaId: pergunta.id, texto: val.texto },
          })
        }
      }
    }

    console.log(`Criado: "${seed.titulo}" (${questionario.perguntas.length} perguntas, ${respostas.length} respostas)`)
  }

  console.log(`\nSeed concluído. Usuários de teste criados: ${usuariosCriados}`)
}

function fimSeeded(seed: QuestaoSeed, ri: number) {
  const diasOffset = ri + 1
  return new Date(seed.criadoEm.getTime() + diasOffset * 60 * 60 * 1000)
}

main().then(() => prisma.$disconnect()).catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})