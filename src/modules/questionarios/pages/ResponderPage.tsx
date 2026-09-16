'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUsuario } from '@/lib/useData'
import { useState, useEffect } from 'react'
import { obterQuestionario } from '../questionarios.actions'
import FormResposta from '../components/FormResposta'
import BannerQuestionario from '../components/BannerQuestionario'
import { getCachedQuestionario, cacheQuestionario, type CachedQuestionario } from '@/lib/db'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
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
  anonimo: boolean
  corTema: string | null
  encerraEm: string | null
  perguntas: Pergunta[]
}

interface Props {
  questionarioId: number
}

export default function ResponderPage({ questionarioId }: Props) {
  const router = useRouter()
  const { usuario, loading: loadingUsuario } = useUsuario()
  const isOnline = useOnlineStatus()
  const [questionario, setQuestionario] = useState<QuestionarioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [usandoCache, setUsandoCache] = useState(false)

  useEffect(() => {
    if (loadingUsuario) return

    if (!usuario) {
      router.push('/usuarios/login')
      return
    }

    async function carregar() {
      try {
        const result = await obterQuestionario(questionarioId)
        if (result && 'questionario' in result && result.questionario) {
          const q = result.questionario as unknown as QuestionarioData
          setQuestionario(q)
          setUsandoCache(false)
          await cacheQuestionario(q as unknown as CachedQuestionario)
        } else {
          await carregarDoCache()
        }
      } catch {
        await carregarDoCache()
      }
      setLoading(false)
    }

    async function carregarDoCache() {
      if (!isOnline) {
        const cached = await getCachedQuestionario(questionarioId)
        if (cached) {
          setQuestionario({
            id: cached.id,
            titulo: cached.titulo,
            descricao: cached.descricao,
            anonimo: cached.anonimo,
            corTema: cached.corTema,
            encerraEm: cached.encerraEm,
            perguntas: cached.perguntas,
          })
          setUsandoCache(true)
        }
      }
    }

    carregar()
  }, [questionarioId, usuario, loadingUsuario, router, isOnline])

  if (loading || loadingUsuario) {
    return <QuestionarioDetalheSkeleton />
  }

  if (!questionario) {
    return <p style={{ color: 'var(--text-tertiary)' }}>Questionário não encontrado.</p>
  }

  return (
    <div>
      <Link
        href={`/questionarios/${questionarioId}`}
        className="text-sm transition-colors mb-6 inline-block hover:underline"
        style={{ color: 'var(--text-tertiary)' }}
      >
        ← Voltar
      </Link>
      <BannerQuestionario cor={questionario.corTema} compacto className="mb-6" />
      {usandoCache && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg text-sm" role="status" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span>Você está offline. Exibindo versão salva no dispositivo. Suas respostas serão sincronizadas quando a conexão voltar.</span>
        </div>
      )}
      <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {questionario.titulo}
      </h1>
      {questionario.descricao && (
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{questionario.descricao}</p>
      )}
      <FormResposta
        questionario={{
          id: questionario.id,
          titulo: questionario.titulo,
          descricao: questionario.descricao,
          perguntas: questionario.perguntas,
        }}
        anonimo={questionario.anonimo}
      />
    </div>
  )
}
