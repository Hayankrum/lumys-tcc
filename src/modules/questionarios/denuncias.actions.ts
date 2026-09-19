'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getUsuarioLogado } from '@/modules/usuarios/usuarios.actions'
import { MAX_DENUNCIAS, MOTIVO_LABELS } from './denuncias.constants'

const MOTIVOS_VALIDOS = new Set(Object.keys(MOTIVO_LABELS))
const MAX_DETALHES = 1000

export async function denunciarQuestionario(questionarioId: number, motivo: string, detalhes?: string) {
  const usuario = await getUsuarioLogado()
  if (!usuario) return { error: 'Você precisa estar logado para denunciar' }

  if (!MOTIVOS_VALIDOS.has(motivo)) return { error: 'Motivo de denúncia inválido' }

  const detalhesClean = (detalhes || '').replace(/[<>]/g, '').trim().slice(0, MAX_DETALHES)

  const questionario = await prisma.questionario.findUnique({
    where: { id: questionarioId },
    select: { id: true, titulo: true, autorId: true, status: true },
  })

  if (!questionario) return { error: 'Questionário não encontrado' }
  if (questionario.status === 'rascunho') return { error: 'Este questionário não está disponível para denúncia' }
  if (questionario.autorId === usuario.id) return { error: 'Você não pode denunciar seu próprio questionário' }

  const jaDenunciado = await prisma.denuncia.findUnique({
    where: {
      questionarioId_denuncianteId: {
        questionarioId,
        denuncianteId: usuario.id,
      },
    },
    select: { id: true },
  })

  if (jaDenunciado) return { error: 'Você já denunciou este questionário' }

  await prisma.denuncia.create({
    data: {
      questionarioId,
      denuncianteId: usuario.id,
      motivo,
      detalhes: detalhesClean || null,
    },
  })

  const totalDenuncias = await prisma.denuncia.count({ where: { questionarioId } })

  if (totalDenuncias >= MAX_DENUNCIAS) {
    await prisma.questionario.delete({ where: { id: questionarioId } })

    const admins = await prisma.usuario.findMany({
      where: { isAdmin: true },
      select: { id: true },
    })

    if (admins.length > 0) {
      await prisma.notificacao.createMany({
        data: admins.map((a) => ({
          titulo: 'Questionário removido por denúncias',
          mensagem: `"${questionario.titulo}" atingiu ${MAX_DENUNCIAS} denúncias e foi removido automaticamente.`,
          url: '/admin/denuncias',
          usuarioId: a.id,
        })),
      })
    }

    revalidatePath('/questionarios')
    revalidatePath('/admin')
    revalidatePath('/admin/denuncias')
    return { success: true, removido: true }
  }

  revalidatePath(`/questionarios/${questionarioId}`)
  return { success: true, removido: false, denuncias: totalDenuncias, maxDenuncias: MAX_DENUNCIAS }
}

export async function obterMinhaDenuncia(questionarioId: number) {
  const usuario = await getUsuarioLogado()
  if (!usuario) return null

  return prisma.denuncia.findUnique({
    where: {
      questionarioId_denuncianteId: {
        questionarioId,
        denuncianteId: usuario.id,
      },
    },
    select: { motivo: true, criadaEm: true },
  })
}

export async function deletarQuestionarioAdmin(id: number) {
  const usuario = await getUsuarioLogado()
  if (!usuario || !usuario.isAdmin) return { error: 'Não autorizado' }

  await prisma.questionario.delete({ where: { id } })

  revalidatePath('/admin/denuncias')
  revalidatePath('/admin/questionarios')
  revalidatePath('/admin')
  revalidatePath('/questionarios')
  return { success: true }
}