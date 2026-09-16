import { NextRequest, NextResponse } from 'next/server'
import {
  enviarResposta,
  editarResposta,
  criarQuestionario,
  editarQuestionario,
} from '@/modules/questionarios/questionarios.actions'

function isRedirectError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    typeof (err as { digest: unknown }).digest === 'string' &&
    (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'resposta') {
      const { questionarioId, syncId, valores, nomeAnonimo, isEdicao, respostaId } = data

      if (!questionarioId || !valores) {
        return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
      }

      let result
      if (isEdicao && respostaId) {
        result = await editarResposta(questionarioId, valores)
      } else {
        result = await enviarResposta(questionarioId, valores, nomeAnonimo, syncId)
      }

      if (result?.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'criar_questionario') {
      const { titulo, descricao, perguntas, encerraEm, anonimo, corTema, usuariosEsperados, resultadosVisiveis } = data

      if (!titulo || !perguntas) {
        return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
      }

      const result = await criarQuestionario(
        titulo,
        descricao || '',
        perguntas,
        encerraEm ? new Date(encerraEm) : null,
        anonimo,
        corTema,
        usuariosEsperados ?? null,
        resultadosVisiveis
      )

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({ success: true, questionario: result.questionario })
    }

    if (action === 'editar_questionario') {
      const { id, titulo, descricao, perguntas, encerraEm, anonimo, corTema, usuariosEsperados, resultadosVisiveis } = data

      if (!id || !titulo || !perguntas) {
        return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
      }

      try {
        const result = await editarQuestionario(
          id,
          titulo,
          descricao || '',
          perguntas,
          encerraEm ? new Date(encerraEm) : null,
          anonimo,
          corTema,
          usuariosEsperados ?? null,
          resultadosVisiveis
        )

        if (result && result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }
      } catch (err) {
        // editarQuestionario chama redirect() ao final - tratamos como sucesso
        if (!isRedirectError(err)) {
          return NextResponse.json({ error: 'Erro ao editar questionário' }, { status: 500 })
        }
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}