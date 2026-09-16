'use client'

import { useRouter } from 'next/navigation'
import { useUsuario } from '@/lib/useData'
import { useState, useEffect } from 'react'
import { obterQuestionario, obterRespostaDoUsuario } from '../questionarios.actions'
import FormResposta from '../components/FormResposta'
import { QuestionarioDetalheSkeleton } from '@/components/Skeletons'

interface Pergunta {
  id: number
  texto: string
  tipo: string
  obrigatoria: boolean
  ordem: number
  opcoes: { id: number; texto: string; ordem: number; correta: boolean }[]
  configEscala: { min: number; max: number; passo: number } | null
}

interface QuestionarioData {
  id: number
  titulo: string
  descricao: string | null
  perguntas: Pergunta[]
}

interface RespostaData {
  id: number
  valores: {
    perguntaId: number
    texto: string | null
    opcaoId: number | null
    valorNumerico: number | null
  }[]
}

interface Props {
  questionarioId: number
}

export default function EditarResponderPage({ questionarioId }: Props) {
  const router = useRouter()
  const { usuario, loading: loadingUsuario } = useUsuario()
  const [questionario, setQuestionario] = useState<QuestionarioData | null>(null)
  const [resposta, setResposta] = useState<RespostaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (loadingUsuario) return

    if (!usuario) {
      router.push('/usuarios/login')
      return
    }

    Promise.all([
      obterQuestionario(questionarioId),
      obterRespostaDoUsuario(questionarioId),
    ]).then(([qResult, rResult]) => {
      if (qResult && 'questionario' in qResult && qResult.questionario) {
        setQuestionario(qResult.questionario as unknown as QuestionarioData)
      } else {
        router.push('/questionarios')
        return
      }
      setResposta(rResult as RespostaData | null)
      setLoading(false)
    })
  }, [questionarioId, usuario, loadingUsuario, router])

  if (loading || loadingUsuario) {
    return <QuestionarioDetalheSkeleton />
  }

  if (!questionario) {
    return <p style={{ color: 'var(--text-tertiary)' }}>Questionário não encontrado.</p>
  }

  if (!resposta) {
    return (
      <div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
          Você ainda não respondeu este questionário.
        </p>
        <button
          onClick={() => router.push(`/questionarios/${questionarioId}`)}
          className="text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          style={{ backgroundColor: 'var(--btn-secondary-bg)', color: 'var(--btn-secondary-text)' }}
        >
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        Editar resposta: {questionario.titulo}
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Altere suas respostas e salve as mudanças.
      </p>
      <FormResposta
        questionario={{
          id: questionario.id,
          titulo: questionario.titulo,
          descricao: questionario.descricao,
          perguntas: questionario.perguntas,
        }}
        respostaExistente={resposta}
      />
    </div>
  )
}
