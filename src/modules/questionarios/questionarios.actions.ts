'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getUsuarioLogado } from '@/modules/usuarios/usuarios.actions'

const MAX_TITULO = 200
const MAX_DESCRICAO = 2000
const MAX_TEXTO_PERGUNTA = 500
const MAX_TEXTO_OPCAO = 200
const MAX_TEXTO_RESPOSTA = 5000
const MAX_OPCOES = 10
const MAX_PERGUNTAS = 50

const TIPOS_PERGUNTA_VALIDOS = ['texto_curto', 'texto_longo', 'escolha_unica', 'multipla_escolha', 'escala']

function sanitizeInput(value: string): string {
  return value.replace(/[<>]/g, '').trim()
}

interface OpcaoInput {
  id?: number
  texto: string
  ordem: number
  correta?: boolean
}

interface CondicaoInput {
  perguntaOrigemId: number
  tipoCondicao: 'igual' | 'diferente' | 'contem' | 'nao_contem'
  valor: string
}

interface PerguntaInput {
  id?: number
  texto: string
  tipo: string
  obrigatoria: boolean
  ordem: number
  opcoes?: OpcaoInput[]
  configEscala?: { min: number; max: number; passo: number } | null
  condicoes?: CondicaoInput[]
}

interface ValorRespostaInput {
  perguntaId: number
  tipo?: string
  texto?: string | null
  opcaoId?: number | null
  opcaoIds?: number[]
  valorNumerico?: number | null
}

async function obterQuestionarioDoUsuario(id: number) {
  const usuario = await getUsuarioLogado()
  if (!usuario) return { error: 'Você precisa estar logado' as const, questionario: null }

  const questionario = await prisma.questionario.findUnique({ where: { id } })
  if (!questionario) return { error: 'Questionário não encontrado' as const, questionario: null }
  if (questionario.autorId !== usuario.id) return { error: 'Você não pode acessar um questionário que não é seu' as const, questionario: null }

  return { questionario, usuario }
}

function validarPerguntas(perguntas: PerguntaInput[]): string | null {
  if (!perguntas || perguntas.length === 0) return 'O questionário deve ter pelo menos uma pergunta'
  if (perguntas.length > MAX_PERGUNTAS) return `O questionário deve ter no máximo ${MAX_PERGUNTAS} perguntas`

  for (let i = 0; i < perguntas.length; i++) {
    const pergunta = perguntas[i]
    const textoClean = sanitizeInput(pergunta.texto)
    if (!textoClean || textoClean.length < 3) return `Pergunta ${i + 1}: texto deve ter pelo menos 3 caracteres`
    if (textoClean.length > MAX_TEXTO_PERGUNTA) return `Pergunta ${i + 1}: texto deve ter no máximo ${MAX_TEXTO_PERGUNTA} caracteres`

    if (!TIPOS_PERGUNTA_VALIDOS.includes(pergunta.tipo)) {
      return `Pergunta ${i + 1}: tipo inválido "${pergunta.tipo}"`
    }

    if (pergunta.tipo === 'escolha_unica' || pergunta.tipo === 'multipla_escolha') {
      if (!pergunta.opcoes || pergunta.opcoes.length < 2) {
        return `Pergunta ${i + 1}: deve ter pelo menos 2 opções`
      }
      if (pergunta.opcoes.length > MAX_OPCOES) {
        return `Pergunta ${i + 1}: deve ter no máximo ${MAX_OPCOES} opções`
      }
      for (let j = 0; j < pergunta.opcoes.length; j++) {
        const opcaoTexto = sanitizeInput(pergunta.opcoes[j].texto)
        if (!opcaoTexto || opcaoTexto.length < 1) {
          return `Pergunta ${i + 1}, Opção ${j + 1}: texto é obrigatório`
        }
        if (opcaoTexto.length > MAX_TEXTO_OPCAO) {
          return `Pergunta ${i + 1}, Opção ${j + 1}: texto deve ter no máximo ${MAX_TEXTO_OPCAO} caracteres`
        }
      }
    }

    if (pergunta.tipo === 'escala') {
      if (!pergunta.configEscala) {
        return `Pergunta ${i + 1}: escala deve ter configuração (min, max, passo)`
      }
      const { min, max, passo } = pergunta.configEscala
      if (typeof min !== 'number' || typeof max !== 'number' || typeof passo !== 'number') {
        return `Pergunta ${i + 1}: configuração de escala inválida`
      }
      if (min >= max) {
        return `Pergunta ${i + 1}: min deve ser menor que max`
      }
      if (passo <= 0 || passo > (max - min)) {
        return `Pergunta ${i + 1}: passo inválido`
      }
    }
  }

  return null
}

// ---------- CRUD QUESTIONÁRIO ----------

export async function criarQuestionario(
  titulo: string,
  descricao: string,
  perguntas: PerguntaInput[],
  encerraEm?: Date | null,
  anonimo?: boolean,
  corTema?: string,
  usuariosEsperados?: number | null,
  resultadosVisiveis?: boolean
) {
  const usuario = await getUsuarioLogado()
  if (!usuario) return { error: 'Você precisa estar logado para criar um questionário' }

  const tituloClean = sanitizeInput(titulo)
  const descricaoClean = sanitizeInput(descricao)

  if (!tituloClean || tituloClean.length < 3) return { error: 'Título deve ter pelo menos 3 caracteres' }
  if (tituloClean.length > MAX_TITULO) return { error: `Título deve ter no máximo ${MAX_TITULO} caracteres` }
  if (descricaoClean.length > MAX_DESCRICAO) return { error: `Descrição deve ter no máximo ${MAX_DESCRICAO} caracteres` }

  const erroPerguntas = validarPerguntas(perguntas)
  if (erroPerguntas) return { error: erroPerguntas }

  const questionario = await prisma.questionario.create({
    data: {
      titulo: tituloClean,
      descricao: descricaoClean || null,
      encerraEm: encerraEm ?? null,
      anonimo: anonimo ?? true,
      resultadosVisiveis: resultadosVisiveis ?? true,
      corTema: corTema || '#6366f1',
      usuariosEsperados: usuariosEsperados ?? null,
      autorId: usuario.id,
      perguntas: {
        create: perguntas.map((p, idx) => ({
          texto: sanitizeInput(p.texto),
          tipo: p.tipo,
          obrigatoria: p.obrigatoria,
          ordem: p.ordem ?? idx + 1,
          configEscala: p.configEscala ?? Prisma.JsonNull,
          condicoes: p.condicoes ? JSON.stringify(p.condicoes) : Prisma.JsonNull,
          opcoes: {
            create: (p.opcoes || []).map((o, oIdx) => ({
              texto: sanitizeInput(o.texto),
              ordem: o.ordem ?? oIdx + 1,
              correta: o.correta ?? false,
            })),
          },
        })),
      },
    },
    include: {
      perguntas: {
        include: { opcoes: true },
        orderBy: { ordem: 'asc' },
      },
    },
  })

  revalidatePath('/questionarios')
  return { questionario }
}

export async function editarQuestionario(
  id: number,
  titulo: string,
  descricao: string,
  perguntas: PerguntaInput[],
  encerraEm?: Date | null,
  anonimo?: boolean,
  corTema?: string,
  usuariosEsperados?: number | null,
  resultadosVisiveis?: boolean
) {
  const { error, questionario } = await obterQuestionarioDoUsuario(id)
  if (error) return { error }

  if (questionario!.status !== 'rascunho') {
    return { error: 'Só é possível editar questionários em rascunho' }
  }

  const tituloClean = sanitizeInput(titulo)
  const descricaoClean = sanitizeInput(descricao)

  if (!tituloClean || tituloClean.length < 3) return { error: 'Título deve ter pelo menos 3 caracteres' }
  if (tituloClean.length > MAX_TITULO) return { error: `Título deve ter no máximo ${MAX_TITULO} caracteres` }
  if (descricaoClean.length > MAX_DESCRICAO) return { error: `Descrição deve ter no máximo ${MAX_DESCRICAO} caracteres` }

  const erroPerguntas = validarPerguntas(perguntas)
  if (erroPerguntas) return { error: erroPerguntas }

  await prisma.$transaction(async (tx) => {
    const perguntaIds = await tx.pergunta.findMany({
      where: { questionarioId: id },
      select: { id: true },
    })
    const idsParaDeletar = perguntaIds.map((p) => p.id)

    if (idsParaDeletar.length > 0) {
      await tx.valorResposta.deleteMany({
        where: { perguntaId: { in: idsParaDeletar } },
      })
      await tx.opcao.deleteMany({
        where: { perguntaId: { in: idsParaDeletar } },
      })
      await tx.pergunta.deleteMany({
        where: { questionarioId: id },
      })
    }

    await tx.questionario.update({
      where: { id },
      data: {
        titulo: tituloClean,
        descricao: descricaoClean || null,
        encerraEm: encerraEm ?? undefined,
        anonimo: anonimo ?? undefined,
        resultadosVisiveis: resultadosVisiveis ?? undefined,
        corTema: corTema ?? undefined,
        usuariosEsperados: usuariosEsperados ?? undefined,
        atualizadoEm: new Date(),
      },
    })

    for (let idx = 0; idx < perguntas.length; idx++) {
      const p = perguntas[idx]
      const perguntaCriada = await tx.pergunta.create({
        data: {
          texto: sanitizeInput(p.texto),
          tipo: p.tipo,
          obrigatoria: p.obrigatoria,
          ordem: p.ordem ?? idx + 1,
          configEscala: p.configEscala ?? Prisma.JsonNull,
          condicoes: p.condicoes ? JSON.stringify(p.condicoes) : Prisma.JsonNull,
          questionarioId: id,
        },
      })

      if (p.opcoes && (p.tipo === 'escolha_unica' || p.tipo === 'multipla_escolha')) {
        for (let oIdx = 0; oIdx < p.opcoes.length; oIdx++) {
          await tx.opcao.create({
            data: {
              texto: sanitizeInput(p.opcoes[oIdx].texto),
              ordem: p.opcoes[oIdx].ordem ?? oIdx + 1,
              correta: p.opcoes[oIdx].correta ?? false,
              perguntaId: perguntaCriada.id,
            },
          })
        }
      }
    }
  })

  revalidatePath('/questionarios')
  revalidatePath(`/questionarios/${id}`)
  redirect(`/questionarios/${id}`)
}

export async function deletarQuestionario(id: number) {
  const { error } = await obterQuestionarioDoUsuario(id)
  if (error) return { error }

  await prisma.questionario.delete({ where: { id } })
  revalidatePath('/questionarios')
}

export async function duplicarQuestionario(id: number) {
  const { error } = await obterQuestionarioDoUsuario(id)
  if (error) return { error }

  const original = await prisma.questionario.findUnique({
    where: { id },
    include: {
      perguntas: {
        include: { opcoes: true },
        orderBy: { ordem: 'asc' },
      },
    },
  })

  if (!original) return { error: 'Questionário não encontrado' }

  const usuario = await getUsuarioLogado()
  if (!usuario) return { error: 'Você precisa estar logado' }

  const novoQuestionario = await prisma.questionario.create({
    data: {
      titulo: `${original.titulo} (Cópia)`,
      descricao: original.descricao,
      status: 'rascunho',
      autorId: usuario.id,
      perguntas: {
        create: original.perguntas.map((p) => ({
          texto: p.texto,
          tipo: p.tipo,
          obrigatoria: p.obrigatoria,
          ordem: p.ordem,
          configEscala: p.configEscala ?? undefined,
          opcoes: {
            create: p.opcoes.map((o) => ({
              texto: o.texto,
              ordem: o.ordem,
              correta: o.correta,
            })),
          },
        })),
      },
    },
    include: {
      perguntas: true,
    },
  })

  revalidatePath('/questionarios')
  return { questionario: novoQuestionario }
}

// ---------- STATUS ----------

export async function publicarQuestionario(id: number) {
  const { error, questionario } = await obterQuestionarioDoUsuario(id)
  if (error) return { error }

  if (questionario!.status !== 'rascunho') {
    return { error: 'Só é possível publicar questionários em rascunho' }
  }

  await prisma.questionario.update({
    where: { id },
    data: { status: 'publicado' },
  })

  revalidatePath('/questionarios')
  revalidatePath(`/questionarios/${id}`)
}

export async function encerrarQuestionario(id: number) {
  const { error, questionario } = await obterQuestionarioDoUsuario(id)
  if (error) return { error }

  if (questionario!.status !== 'publicado') {
    return { error: 'Só é possível encerrar questionários publicados' }
  }

  await prisma.questionario.update({
    where: { id },
    data: { status: 'encerrado' },
  })

  revalidatePath('/questionarios')
  revalidatePath(`/questionarios/${id}`)
}

// ---------- RESPOSTAS ----------

export async function enviarResposta(questionarioId: number, valores: ValorRespostaInput[], nomeAnonimo?: string, syncId?: string) {
  const usuario = await getUsuarioLogado()

  const questionario = await prisma.questionario.findUnique({
    where: { id: questionarioId },
    include: {
      perguntas: {
        include: { opcoes: true },
        orderBy: { ordem: 'asc' },
      },
    },
  })

  if (!questionario) return { error: 'Questionário não encontrado' }
  if (questionario.status !== 'publicado') return { error: 'Este questionário não está disponível para respostas' }

  if (questionario.encerraEm && new Date(questionario.encerraEm) < new Date()) {
    return { error: 'Este questionário encerrou o prazo de respostas' }
  }

  if (!questionario.anonimo && !usuario) {
    return { error: 'Você precisa estar logado para responder' }
  }

  // Idempotência: se esta resposta já foi sincronizada antes (ex: a resposta
  // chegou ao servidor mas o cliente perdeu a conexão), não criar duplicata.
  if (syncId) {
    const jaSincronizada = await prisma.resposta.findUnique({
      where: { syncId },
      select: { id: true },
    })
    if (jaSincronizada) {
      return { success: true, jaExistia: true }
    }
  }

  if (!questionario.anonimo && usuario) {
    const respostaExistente = await prisma.resposta.findUnique({
      where: {
        usuarioId_questionarioId: {
          usuarioId: usuario.id,
          questionarioId,
        },
      },
    })

    if (respostaExistente) {
      return { error: 'Você já respondeu este questionário' }
    }
  }

  const perguntasObrigatorias = questionario.perguntas.filter((p) => p.obrigatoria)
  const perguntasRespondidas = new Set(valores.filter((v) => v.texto || v.opcaoId || (v.opcaoIds && v.opcaoIds.length > 0) || v.valorNumerico != null).map((v) => v.perguntaId))

  for (const pergunta of perguntasObrigatorias) {
    if (!perguntasRespondidas.has(pergunta.id)) {
      return { error: `A pergunta "${pergunta.texto}" é obrigatória` }
    }
  }

  for (const valor of valores) {
    const pergunta = questionario.perguntas.find((p) => p.id === valor.perguntaId)
    if (!pergunta) return { error: 'Pergunta inválida encontrada nas respostas' }

    if (pergunta.tipo === 'escolha_unica') {
      if (!valor.opcaoId) return { error: `Pergunta "${pergunta.texto}": selecione uma opção` }
      const opcaoValida = pergunta.opcoes.find((o) => o.id === valor.opcaoId)
      if (!opcaoValida) return { error: `Pergunta "${pergunta.texto}": opção inválida` }
    }

    if (pergunta.tipo === 'multipla_escolha') {
      const ids = valor.opcaoIds || (valor.opcaoId ? [valor.opcaoId] : [])
      if (ids.length === 0) return { error: `Pergunta "${pergunta.texto}": selecione pelo menos uma opção` }
      for (const id of ids) {
        const opcaoValida = pergunta.opcoes.find((o) => o.id === id)
        if (!opcaoValida) return { error: `Pergunta "${pergunta.texto}": opção inválida` }
      }
    }

    if (pergunta.tipo === 'escala') {
      if (valor.valorNumerico == null) return { error: `Pergunta "${pergunta.texto}": selecione um valor` }
      const config = pergunta.configEscala as { min: number; max: number } | null
      if (config) {
        if (valor.valorNumerico < config.min || valor.valorNumerico > config.max) {
          return { error: `Pergunta "${pergunta.texto}": valor fora da escala` }
        }
      }
    }

    if (pergunta.tipo === 'texto_curto' || pergunta.tipo === 'texto_longo') {
      if (valor.texto && valor.texto.length > MAX_TEXTO_RESPOSTA) {
        return { error: `Pergunta "${pergunta.texto}": resposta muito longa` }
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    let usuarioIdParaResposta: number

    if (questionario.anonimo && !usuario) {
      const usuarioAnonimo = await tx.usuario.create({
        data: {
          nome: nomeAnonimo || 'Anônimo',
          email: `anonimo-${Date.now()}@temp.com`,
          senha: '',
        },
      })
      usuarioIdParaResposta = usuarioAnonimo.id
    } else {
      usuarioIdParaResposta = usuario!.id
    }

    const resposta = await tx.resposta.create({
      data: {
        usuarioId: usuarioIdParaResposta,
        questionarioId,
        nomeAnonimo: questionario.anonimo ? (nomeAnonimo || null) : null,
        syncId: syncId || null,
      },
    })

    for (const valor of valores) {
      if (valor.tipo === 'multipla_escolha') {
        const ids = valor.opcaoIds || (valor.opcaoId ? [valor.opcaoId] : [])
        for (const opcaoId of ids) {
          await tx.valorResposta.create({
            data: {
              respostaId: resposta.id,
              perguntaId: valor.perguntaId,
              opcaoId,
            },
          })
        }
      } else if (valor.texto || valor.opcaoId || valor.valorNumerico != null) {
        await tx.valorResposta.create({
          data: {
            respostaId: resposta.id,
            perguntaId: valor.perguntaId,
            texto: valor.texto ?? null,
            opcaoId: valor.opcaoId ?? null,
            valorNumerico: valor.valorNumerico ?? null,
          },
        })
      }
    }
  })

  revalidatePath(`/questionarios/${questionarioId}`)
  revalidatePath(`/questionarios/${questionarioId}/resultados`)

  try {
    const autor = await prisma.usuario.findUnique({
      where: { id: questionario.autorId },
      select: { notificarQuestionarios: true },
    })

    if (autor?.notificarQuestionarios) {
      const nomeRespondente = nomeAnonimo || usuario?.nome || 'Anônimo'
      await prisma.notificacao.create({
        data: {
          titulo: 'Nova resposta recebida',
          mensagem: `${nomeRespondente} respondeu ao questionário "${questionario.titulo}"`,
          url: `/questionarios/${questionarioId}/resultados`,
          usuarioId: questionario.autorId,
        },
      })

      revalidatePath('/notificacoes')
    }

    if (questionario.usuariosEsperados && autor?.notificarQuestionarios) {
      const totalRespostas = await prisma.resposta.count({
        where: { questionarioId },
      })

      if (totalRespostas >= questionario.usuariosEsperados) {
        await prisma.notificacao.create({
          data: {
            titulo: 'Meta de respostas atingida!',
            mensagem: `O questionário "${questionario.titulo}" atingiu ${questionario.usuariosEsperados} respostas (${totalRespostas} no total)`,
            url: `/questionarios/${questionarioId}/resultados`,
            usuarioId: questionario.autorId,
          },
        })

        revalidatePath('/notificacoes')
      }
    }
  } catch {
    // Ignorar erros de notificação
  }

  return { success: true }
}

export async function editarResposta(questionarioId: number, valores: ValorRespostaInput[]) {
  const usuario = await getUsuarioLogado()
  if (!usuario) return { error: 'Você precisa estar logado para editar' }

  const questionario = await prisma.questionario.findUnique({
    where: { id: questionarioId },
    include: {
      perguntas: {
        include: { opcoes: true },
        orderBy: { ordem: 'asc' },
      },
    },
  })

  if (!questionario) return { error: 'Questionário não encontrado' }
  if (questionario.status !== 'publicado') return { error: 'Este questionário não está disponível' }

  if (questionario.encerraEm && new Date(questionario.encerraEm) < new Date()) {
    return { error: 'Este questionário encerrou o prazo de respostas' }
  }

  const respostaExistente = await prisma.resposta.findUnique({
    where: {
      usuarioId_questionarioId: {
        usuarioId: usuario.id,
        questionarioId,
      },
    },
  })

  if (!respostaExistente) {
    return { error: 'Você ainda não respondeu este questionário' }
  }

  const perguntasObrigatorias = questionario.perguntas.filter((p) => p.obrigatoria)
  const perguntasRespondidas = new Set(valores.filter((v) => v.texto || v.opcaoId || (v.opcaoIds && v.opcaoIds.length > 0) || v.valorNumerico != null).map((v) => v.perguntaId))

  for (const pergunta of perguntasObrigatorias) {
    if (!perguntasRespondidas.has(pergunta.id)) {
      return { error: `A pergunta "${pergunta.texto}" é obrigatória` }
    }
  }

  for (const valor of valores) {
    const pergunta = questionario.perguntas.find((p) => p.id === valor.perguntaId)
    if (!pergunta) return { error: 'Pergunta inválida encontrada nas respostas' }

    if (pergunta.tipo === 'escolha_unica') {
      if (!valor.opcaoId) return { error: `Pergunta "${pergunta.texto}": selecione uma opção` }
      const opcaoValida = pergunta.opcoes.find((o) => o.id === valor.opcaoId)
      if (!opcaoValida) return { error: `Pergunta "${pergunta.texto}": opção inválida` }
    }

    if (pergunta.tipo === 'multipla_escolha') {
      const ids = valor.opcaoIds || (valor.opcaoId ? [valor.opcaoId] : [])
      if (ids.length === 0) return { error: `Pergunta "${pergunta.texto}": selecione pelo menos uma opção` }
      for (const id of ids) {
        const opcaoValida = pergunta.opcoes.find((o) => o.id === id)
        if (!opcaoValida) return { error: `Pergunta "${pergunta.texto}": opção inválida` }
      }
    }

    if (pergunta.tipo === 'escala') {
      if (valor.valorNumerico == null) return { error: `Pergunta "${pergunta.texto}": selecione um valor` }
      const config = pergunta.configEscala as { min: number; max: number } | null
      if (config) {
        if (valor.valorNumerico < config.min || valor.valorNumerico > config.max) {
          return { error: `Pergunta "${pergunta.texto}": valor fora da escala` }
        }
      }
    }

    if (pergunta.tipo === 'texto_curto' || pergunta.tipo === 'texto_longo') {
      if (valor.texto && valor.texto.length > MAX_TEXTO_RESPOSTA) {
        return { error: `Pergunta "${pergunta.texto}": resposta muito longa` }
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.valorResposta.deleteMany({
      where: { respostaId: respostaExistente.id },
    })

    for (const valor of valores) {
      if (valor.tipo === 'multipla_escolha') {
        const ids = valor.opcaoIds || (valor.opcaoId ? [valor.opcaoId] : [])
        for (const opcaoId of ids) {
          await tx.valorResposta.create({
            data: {
              respostaId: respostaExistente.id,
              perguntaId: valor.perguntaId,
              opcaoId,
            },
          })
        }
      } else if (valor.texto || valor.opcaoId || valor.valorNumerico != null) {
        await tx.valorResposta.create({
          data: {
            respostaId: respostaExistente.id,
            perguntaId: valor.perguntaId,
            texto: valor.texto ?? null,
            opcaoId: valor.opcaoId ?? null,
            valorNumerico: valor.valorNumerico ?? null,
          },
        })
      }
    }
  })

  revalidatePath(`/questionarios/${questionarioId}`)
  revalidatePath(`/questionarios/${questionarioId}/resultados`)
  return { success: true }
}

// ---------- CONSULTAS ----------

export async function listarMeusQuestionarios(filtros?: {
  busca?: string
  status?: string
  pagina?: number
  porPagina?: number
}) {
  const usuario = await getUsuarioLogado()
  if (!usuario) return { error: 'Você precisa estar logado' as const, questionarios: [], total: 0, paginas: 1 }

  const pagina = filtros?.pagina || 1
  const porPagina = filtros?.porPagina || 10
  const skip = (pagina - 1) * porPagina

  const where: Record<string, unknown> = { autorId: usuario.id }

  if (filtros?.busca && filtros.busca.trim()) {
    where.OR = [
      { titulo: { contains: filtros.busca, mode: 'insensitive' } },
      { descricao: { contains: filtros.busca, mode: 'insensitive' } },
    ]
  }

  if (filtros?.status && filtros.status !== 'todos') {
    where.status = filtros.status
  }

  const [questionarios, total] = await Promise.all([
    prisma.questionario.findMany({
      where,
      include: {
        _count: { select: { perguntas: true, respostas: true } },
      },
      orderBy: { atualizadoEm: 'desc' },
      skip,
      take: porPagina,
    }),
    prisma.questionario.count({ where }),
  ])

  return {
    questionarios: questionarios.map((q) => ({
      ...q,
      totalPerguntas: q._count.perguntas,
      totalRespostas: q._count.respostas,
      _count: undefined,
    })),
    total,
    paginas: Math.ceil(total / porPagina),
    pagina,
  }
}

export async function obterQuestionario(id: number) {
  const questionario = await prisma.questionario.findUnique({
    where: { id },
    include: {
      autor: { select: { id: true, nome: true } },
      perguntas: {
        include: { opcoes: { orderBy: { ordem: 'asc' } } },
        orderBy: { ordem: 'asc' },
      },
      _count: { select: { respostas: true } },
    },
  })

  if (!questionario) return { error: 'Questionário não encontrado' as const, questionario: null }

  return {
    questionario: {
      ...questionario,
      totalRespostas: questionario._count.respostas,
      _count: undefined,
    },
  }
}

export async function obterQuestionarioParaEdicao(id: number) {
  const { error } = await obterQuestionarioDoUsuario(id)
  if (error) return { error, questionario: null }

  const completo = await prisma.questionario.findUnique({
    where: { id },
    include: {
      perguntas: {
        include: { opcoes: { orderBy: { ordem: 'asc' } } },
        orderBy: { ordem: 'asc' },
      },
    },
  })

  return { questionario: completo }
}

export async function podeResponder(questionarioId: number) {
  const usuario = await getUsuarioLogado()

  const questionario = await prisma.questionario.findUnique({
    where: { id: questionarioId },
    select: { status: true, autorId: true, anonimo: true },
  })

  if (!questionario) return { pode: false, razao: 'Questionário não encontrado' }
  if (questionario.status !== 'publicado') return { pode: false, razao: 'Questionário não está disponível' }

  if (questionario.anonimo) {
    return { pode: true, anonimo: true }
  }

  if (!usuario) return { pode: false, razao: 'Não autenticado' }

  const respostaExistente = await prisma.resposta.findUnique({
    where: {
      usuarioId_questionarioId: {
        usuarioId: usuario.id,
        questionarioId,
      },
    },
  })

  if (respostaExistente) return { pode: false, razao: 'Você já respondeu este questionário', jaRespondeu: true }

  return { pode: true }
}

export async function obterRespostaDoUsuario(questionarioId: number) {
  const usuario = await getUsuarioLogado()
  if (!usuario) return null

  const resposta = await prisma.resposta.findUnique({
    where: {
      usuarioId_questionarioId: {
        usuarioId: usuario.id,
        questionarioId,
      },
    },
    include: {
      valores: {
        include: { opcao: true },
      },
    },
  })

  if (!resposta) return null

  return {
    id: resposta.id,
    valores: resposta.valores.map((v) => ({
      perguntaId: v.perguntaId,
      texto: v.texto,
      opcaoId: v.opcaoId,
      valorNumerico: v.valorNumerico,
    })),
  }
}

export async function obterResultados(
  questionarioId: number,
  filtros?: {
    dataInicio?: string
    dataFim?: string
    usuarioId?: number
  }
) {
  const questionario = await prisma.questionario.findUnique({
    where: { id: questionarioId },
    select: { autorId: true, resultadosVisiveis: true },
  })

  if (!questionario) return { error: 'Questionário não encontrado' }

  if (!questionario.resultadosVisiveis) {
    const usuario = await getUsuarioLogado()
    if (!usuario || (usuario.id !== questionario.autorId && !usuario.isAdmin)) {
      return { error: 'Os resultados deste questionário não estão disponíveis' }
    }
  }

  const whereRespostas: Record<string, unknown> = {}
  if (filtros?.dataInicio && filtros.dataInicio.trim()) {
    whereRespostas.criadoEm = { ...(whereRespostas.criadoEm as object), gte: new Date(filtros.dataInicio) }
  }
  if (filtros?.dataFim && filtros.dataFim.trim()) {
    whereRespostas.criadoEm = { ...(whereRespostas.criadoEm as object), lte: new Date(filtros.dataFim) }
  }
  if (filtros?.usuarioId) {
    whereRespostas.usuarioId = filtros.usuarioId
  }

  const temFiltros = filtros?.dataInicio || filtros?.dataFim || filtros?.usuarioId

  const dados = await prisma.questionario.findUnique({
    where: { id: questionarioId },
    include: {
      autor: {
        select: { id: true, nome: true },
      },
      perguntas: {
        include: {
          opcoes: { orderBy: { ordem: 'asc' } },
          valores: temFiltros
            ? {
                where: {
                  resposta: whereRespostas,
                },
                include: { opcao: true },
              }
            : {
                include: { opcao: true },
              },
        },
        orderBy: { ordem: 'asc' },
      },
      _count: { select: { respostas: true } },
      respostas: {
        select: {
          id: true,
          nomeAnonimo: true,
          criadoEm: true,
          usuario: {
            select: { id: true, nome: true },
          },
          valores: {
            include: { opcao: { select: { texto: true } } },
          },
        },
        orderBy: { criadoEm: 'desc' },
      },
    },
  })

  if (!dados) return { error: 'Questionário não encontrado' }

  const resultados = dados.perguntas.map((pergunta) => {
    const totalRespostasPergunta = pergunta.valores.length

    if (pergunta.tipo === 'escolha_unica' || pergunta.tipo === 'multipla_escolha') {
      const temCorretas = pergunta.opcoes.some((o) => o.correta)
      const distribuicao = pergunta.opcoes.map((opcao) => {
        const count = pergunta.valores.filter((v) => v.opcaoId === opcao.id).length
        return {
          opcaoId: opcao.id,
          texto: opcao.texto,
          correta: opcao.correta,
          count,
          percentual: totalRespostasPergunta > 0 ? Math.round((count / totalRespostasPergunta) * 100) : 0,
        }
      })

      let acertos: number | undefined
      let taxaAcerto: number | undefined
      if (temCorretas && pergunta.tipo === 'escolha_unica') {
        acertos = pergunta.valores.filter((v) => {
          const opcao = pergunta.opcoes.find((o) => o.id === v.opcaoId)
          return opcao?.correta
        }).length
        taxaAcerto = totalRespostasPergunta > 0 ? Math.round((acertos / totalRespostasPergunta) * 100) : 0
      }

      return {
        perguntaId: pergunta.id,
        texto: pergunta.texto,
        tipo: pergunta.tipo,
        totalRespostas: totalRespostasPergunta,
        distribuicao,
        temCorretas,
        acertos,
        taxaAcerto,
      }
    }

    if (pergunta.tipo === 'escala') {
      const valoresNumericos = pergunta.valores.filter((v) => v.valorNumerico != null).map((v) => v.valorNumerico!)
      const media = valoresNumericos.length > 0
        ? valoresNumericos.reduce((a, b) => a + b, 0) / valoresNumericos.length
        : 0
      const config = pergunta.configEscala as { min: number; max: number } | null
      return {
        perguntaId: pergunta.id,
        texto: pergunta.texto,
        tipo: pergunta.tipo,
        totalRespostas: totalRespostasPergunta,
        media: Math.round(media * 100) / 100,
        min: config?.min ?? 0,
        max: config?.max ?? 10,
      }
    }

    if (pergunta.tipo === 'texto_curto' || pergunta.tipo === 'texto_longo') {
      const respostasTextuais = pergunta.valores
        .filter((v) => v.texto)
        .map((v) => v.texto!)
      return {
        perguntaId: pergunta.id,
        texto: pergunta.texto,
        tipo: pergunta.tipo,
        totalRespostas: totalRespostasPergunta,
        respostas: respostasTextuais,
      }
    }

    return {
      perguntaId: pergunta.id,
      texto: pergunta.texto,
      tipo: pergunta.tipo,
      totalRespostas: totalRespostasPergunta,
    }
  })

  return {
    questionario: {
      id: dados.id,
      titulo: dados.titulo,
      descricao: dados.descricao,
      status: dados.status,
      corTema: dados.corTema,
      anonimo: dados.anonimo,
      autor: dados.autor,
    },
    totalRespostas: dados._count.respostas,
    resultados,
    respondentes: dados.respostas.map((r) => ({
      id: r.id,
      nome: r.nomeAnonimo || r.usuario.nome,
      criadoEm: r.criadoEm,
      valores: r.valores.map((v) => ({
        perguntaId: v.perguntaId,
        texto: v.texto,
        opcaoId: v.opcaoId,
        opcao: v.opcao ? v.opcao.texto : null,
        valorNumerico: v.valorNumerico,
      })),
    })),
  }
}

export async function listarQuestionariosPublicos(filtros?: {
  busca?: string
  status?: string
  pagina?: number
  porPagina?: number
}) {
  const pagina = filtros?.pagina || 1
  const porPagina = filtros?.porPagina || 10
  const skip = (pagina - 1) * porPagina

  const where: Record<string, unknown> = {}

  if (filtros?.status && filtros.status !== 'todos') {
    where.status = filtros.status
  } else {
    where.status = { in: ['publicado', 'encerrado'] }
  }

  if (filtros?.busca && filtros.busca.trim()) {
    where.OR = [
      { titulo: { contains: filtros.busca, mode: 'insensitive' } },
      { descricao: { contains: filtros.busca, mode: 'insensitive' } },
    ]
  }

  const [questionarios, total] = await Promise.all([
    prisma.questionario.findMany({
      where,
      include: {
        autor: { select: { id: true, nome: true } },
        _count: { select: { perguntas: true, respostas: true } },
      },
      orderBy: { criadoEm: 'desc' },
      skip,
      take: porPagina,
    }),
    prisma.questionario.count({ where }),
  ])

  return {
    questionarios: questionarios.map((q) => ({
      id: q.id,
      titulo: q.titulo,
      descricao: q.descricao,
      status: q.status,
      anonimo: q.anonimo,
      corTema: q.corTema,
      criadoEm: q.criadoEm,
      autor: q.autor,
      totalPerguntas: q._count.perguntas,
      totalRespostas: q._count.respostas,
    })),
    total,
    paginas: Math.ceil(total / porPagina),
    pagina,
  }
}
