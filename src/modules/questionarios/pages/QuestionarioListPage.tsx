'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import { listarQuestionariosPublicos } from '../questionarios.actions'
import BannerQuestionario from '../components/BannerQuestionario'
import Paginacao from '@/components/Paginacao'
import ProgressBar from '@/components/ProgressBar'
import { QuestionarioListaSkeleton } from '@/components/Skeletons'

interface Questionario {
  id: number
  titulo: string
  descricao: string | null
  status: string
  anonimo: boolean
  corTema: string | null
  criadoEm: string
  autor: { id: number; nome: string }
  totalPerguntas: number
  totalRespostas: number
}

const STATUS_LABELS: Record<string, string> = {
  todos: 'Todos',
  publicado: 'Publicado',
  encerrado: 'Encerrado',
}

const STATUS_COLORS: Record<string, string> = {
  publicado: '#22c55e',
  encerrado: '#f59e0b',
}

export default function QuestionarioListPage() {
  const [questionarios, setQuestionarios] = useState<Questionario[]>([])
  const [loading, setLoading] = useState(true)
  const [carregandoPagina, setCarregandoPagina] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const seqRef = useRef(0)

  const carregar = useCallback(async (p: number, buscaVal: string, statusVal: string) => {
    const seq = ++seqRef.current
    setCarregandoPagina(true)

    try {
      const result = await listarQuestionariosPublicos({
        busca: buscaVal || undefined,
        status: statusVal !== 'todos' ? statusVal : undefined,
        pagina: p,
        porPagina: 10,
      })
      if (seq !== seqRef.current) return
      if ('questionarios' in result) {
        setQuestionarios(result.questionarios as unknown as Questionario[])
        setTotalPaginas(result.paginas as number)
      }
    } catch {
      if (seq === seqRef.current) setErro('Erro ao carregar questionários. Tente novamente.')
    } finally {
      if (seq === seqRef.current) {
        setLoading(false)
        setCarregandoPagina(false)
      }
    }
  }, [])

  useEffect(() => {
    let active = true
    listarQuestionariosPublicos({ pagina: 1, porPagina: 10 })
      .then((result) => {
        if (!active) return
        if ('questionarios' in result) {
          setQuestionarios(result.questionarios as unknown as Questionario[])
          setTotalPaginas(result.paginas as number)
        }
      })
      .catch(() => {
        if (active) setErro('Erro ao carregar questionários. Tente novamente.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setPagina(1)
    carregar(1, busca, statusFiltro)
  }

  function handleFiltrarStatus(status: string) {
    setStatusFiltro(status)
    setErro(null)
    setPagina(1)
    carregar(1, busca, status)
  }

  function handlePagina(p: number) {
    if (p === pagina) return
    setErro(null)
    setPagina(p)
    carregar(p, busca, statusFiltro)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Questionários</h1>
        <Link
          href="/questionarios/novo"
          className="font-medium rounded-lg w-8 h-8 flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
          title="Novo questionário"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </Link>
      </div>

      {/* Busca */}
      <form onSubmit={handleBuscar} className="flex gap-2 mb-4">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar questionários..."
          className="flex-1 rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
          style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
        />
        <button
          type="submit"
          className="font-medium rounded-lg w-8 h-8 flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'var(--btn-secondary-bg)', color: 'var(--text-primary)' }}
          title="Buscar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </form>

      {/* Filtros de status */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleFiltrarStatus(key)}
              className="text-xs font-medium px-3 py-1.5 transition-colors -ml-px first:ml-0 first:rounded-l-lg last:rounded-r-lg"
              style={{
                backgroundColor: statusFiltro === key ? 'var(--btn-primary-bg)' : 'var(--card-bg)',
                color: statusFiltro === key ? 'var(--btn-primary-text)' : 'var(--text-tertiary)',
                border: '1px solid var(--card-border)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <div className="alert-error mb-4" role="alert">
          {erro}
        </div>
      )}

      {loading ? (
        <QuestionarioListaSkeleton />
      ) : (
        <>
          {carregandoPagina && <ProgressBar />}

          {questionarios.length === 0 && (
            <p style={{ color: 'var(--text-tertiary)' }}>
              {busca || statusFiltro !== 'todos' ? 'Nenhum questionário encontrado com esses filtros.' : 'Nenhum questionário publicado ainda.'}
            </p>
          )}

          <div key={pagina} className="flex flex-col gap-4 animate-in">
            {questionarios.map((q) => (
              <Link
                key={q.id}
                href={`/questionarios/${q.id}`}
                className="rounded-lg p-5 block transition-colors hover:opacity-90"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', textDecoration: 'none' }}
              >
                <BannerQuestionario cor={q.corTema} compacto className="mb-3" />
                <h2 className="font-medium text-lg mb-1" style={{ color: 'var(--text-primary)' }}>{q.titulo}</h2>
                <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>por {q.autor.nome}</p>
                {q.descricao && (
                  <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{q.descricao}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span
                    className="px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${STATUS_COLORS[q.status]}20`, color: STATUS_COLORS[q.status] }}
                  >
                    {STATUS_LABELS[q.status] || q.status}
                  </span>
                  <span>{q.totalPerguntas} {q.totalPerguntas === 1 ? 'pergunta' : 'perguntas'}</span>
                  <span>{q.totalRespostas} {q.totalRespostas === 1 ? 'resposta' : 'respostas'}</span>
                  {q.anonimo && <span>Anônimo</span>}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Paginação */}
      {!loading && totalPaginas > 1 && (
        <Paginacao
          pagina={pagina}
          totalPaginas={totalPaginas}
          onChange={(p) => {
            handlePagina(p)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}
    </div>
  )
}