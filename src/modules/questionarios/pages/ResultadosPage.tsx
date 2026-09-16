'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUsuario } from '@/lib/useData'
import { useState, useEffect, type ReactElement } from 'react'
import { obterResultados } from '../questionarios.actions'
import ResultadosBasicos from '../components/ResultadosBasicos'
import ExportarCSV from '../components/ExportarCSV'
import FiltroResultados from '../components/FiltroResultados'
import BannerQuestionario from '../components/BannerQuestionario'

interface ResultadoData {
  questionario: {
    id: number
    titulo: string
    descricao: string | null
    status: string
    corTema: string | null
    anonimo: boolean
    autor: { id: number; nome: string }
  }
  totalRespostas: number
  resultados: {
    perguntaId: number
    texto: string
    tipo: string
    totalRespostas: number
    distribuicao?: {
      opcaoId: number
      texto: string
      count: number
      percentual: number
    }[]
    temCorretas?: boolean
    acertos?: number
    taxaAcerto?: number
    media?: number
    min?: number
    max?: number
    respostas?: string[]
  }[]
  respondentes: {
    id: number
    nome: string
    criadoEm: string
    valores: {
      perguntaId: number
      texto: string | null
      opcaoId: number | null
      opcao: string | null
      valorNumerico: number | null
    }[]
  }[]
}

interface Props {
  questionarioId: number
}

const STATUS_LABELS: Record<string, string> = {
  publicado: 'Publicado',
  encerrado: 'Encerrado',
}

const STATUS_COLORS: Record<string, string> = {
  publicado: '#22c55e',
  encerrado: '#f59e0b',
}

function StatCard({
  icone,
  rotulo,
  valor,
  sufixo,
  destaque,
}: {
  icone: ReactElement
  rotulo: string
  valor: number | string
  sufixo?: string
  destaque?: boolean
}) {
  return (
    <div
      className="flex items-center gap-3 p-4"
      style={destaque ? { backgroundColor: 'var(--accent-dim)' } : undefined}
    >
      <span
        className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
        style={{ backgroundColor: destaque ? 'var(--card-bg)' : 'var(--input-bg)', color: 'var(--btn-primary-bg)' }}
      >
        {icone}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--text-tertiary)' }}>
          {rotulo}
        </p>
        <p className="text-lg font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
          {valor}
          {sufixo && <span className="text-sm font-normal ml-0.5" style={{ color: 'var(--text-tertiary)' }}>{sufixo}</span>}
        </p>
      </div>
    </div>
  )
}

function inicial(nome: string) {
  return nome.trim().charAt(0).toUpperCase() || '?'
}

export default function ResultadosPage({ questionarioId }: Props) {
  const router = useRouter()
  const { loading: loadingUsuario } = useUsuario()
  const [dados, setDados] = useState<ResultadoData | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtrando, setFiltrando] = useState(false)

  const carregarResultados = async (filtros?: { dataInicio?: string; dataFim?: string }) => {
    const result = await obterResultados(questionarioId, filtros)
    if (result && 'error' in result) {
      setErro(result.error as string)
    } else if (result && 'totalRespostas' in result) {
      setDados(result as unknown as ResultadoData)
    }
  }

  useEffect(() => {
    if (loadingUsuario) return

    let cancelled = false
    obterResultados(questionarioId).then((result) => {
      if (cancelled) return
      if (result && 'error' in result) {
        setErro(result.error as string)
      } else if (result && 'totalRespostas' in result) {
        setDados(result as unknown as ResultadoData)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [questionarioId, loadingUsuario])

  async function handleFiltrar(filtros: { dataInicio: string; dataFim: string }) {
    setFiltrando(true)
    await carregarResultados(filtros)
    setFiltrando(false)
  }

  if (loading || loadingUsuario) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-24 animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }} />
        ))}
      </div>
    )
  }

  if (erro) {
    return (
      <div>
        <div className="alert-error mb-4" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {erro}
        </div>
        <button
          onClick={() => router.push('/questionarios')}
          className="btn-secondary"
        >
          Voltar
        </button>
      </div>
    )
  }

  if (!dados) {
    return (
      <div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>Resultado não encontrado.</p>
        <button
          onClick={() => router.push('/questionarios')}
          className="btn-secondary"
        >
          Voltar
        </button>
      </div>
    )
  }

  const perguntasComResposta = dados.resultados.filter((r) => r.totalRespostas > 0).length
  const resultadosComAcerto = dados.resultados.filter((r) => r.taxaAcerto != null)
  const taxaAcertoMedia = resultadosComAcerto.length > 0
    ? Math.round(resultadosComAcerto.reduce((acc, r) => acc + (r.taxaAcerto || 0), 0) / resultadosComAcerto.length)
    : null

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/questionarios/${questionarioId}`}
        className="text-sm transition-colors mb-2 inline-block hover:underline"
        style={{ color: 'var(--text-tertiary)' }}
      >
        ← Voltar
      </Link>

      <BannerQuestionario cor={dados.questionario.corTema} compacto />

      {/* Header da página */}
      <div className="card !p-0 overflow-hidden">
        <div className="p-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Resultados do questionário
            </p>
            <h1 className="text-2xl font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
              {dados.questionario.titulo}
            </h1>
            {dados.questionario.descricao && (
              <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                {dados.questionario.descricao}
              </p>
            )}
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
              por{' '}
              <Link href={`/usuarios/${dados.questionario.autor.id}`} className="hover:underline" style={{ color: 'var(--text-primary)' }}>
                {dados.questionario.autor.nome}
              </Link>
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${STATUS_COLORS[dados.questionario.status]}20`, color: STATUS_COLORS[dados.questionario.status] }}
              >
                {STATUS_LABELS[dados.questionario.status] || dados.questionario.status}
              </span>
              {dados.questionario.anonimo && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-tertiary)' }}>
                  Anônimo
                </span>
              )}
            </div>
          </div>
          <ExportarCSV
            titulo={dados.questionario.titulo}
            resultados={dados.resultados}
            totalRespostas={dados.totalRespostas}
            respondentes={dados.respondentes}
          />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ borderTop: '1px solid var(--card-border)' }}>
          <StatCard
            rotulo="Respostas"
            valor={dados.totalRespostas}
            icone={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            }
          />
          <StatCard
            rotulo="Perguntas com resposta"
            valor={perguntasComResposta}
            sufixo={`de ${dados.resultados.length}`}
            icone={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            }
          />
          {dados.respondentes.length === 0 ? (
            <StatCard
              rotulo="Respondentes"
              valor="-"
              icone={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              }
            />
          ) : (
            <StatCard
              rotulo="Respondentes"
              valor={dados.respondentes.length}
              icone={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              }
            />
          )}
          <StatCard
            rotulo="Taxa média de acerto"
            valor={taxaAcertoMedia != null ? `${taxaAcertoMedia}%` : '—'}
            icone={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10"/>
                <path d="M18 20V4"/>
                <path d="M6 20v-4"/>
              </svg>
            }
          />
        </div>
      </div>

      <FiltroResultados onFiltrar={handleFiltrar} loading={filtrando} />

      {/* Respondentes */}
      {dados.respondentes.length > 0 && (
        <div className="card">
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Quem respondeu{dados.questionario.anonimo ? ' (anônimo)' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {dados.respondentes.map((r) => (
              <div
                key={r.id}
                className="inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-xs"
                style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
              >
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                >
                  {inicial(r.nome)}
                </span>
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{r.nome}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(r.criadoEm).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ResultadosBasicos
        totalRespostas={dados.totalRespostas}
        resultados={dados.resultados}
      />
    </div>
  )
}