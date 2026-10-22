'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import { listarMeusQuestionarios, listarMinhasRespostas, deletarQuestionario, duplicarQuestionario, publicarQuestionario, encerrarQuestionario } from '../questionarios.actions'
import BannerQuestionario from '../components/BannerQuestionario'
import Paginacao from '@/components/Paginacao'
import ProgressBar from '@/components/ProgressBar'
import { QuestionarioListaSkeleton } from '@/components/Skeletons'

interface Questionario {
  id: number
  titulo: string
  descricao: string | null
  codigoAcesso: string | null
  status: string
  anonimo: boolean
  corTema: string | null
  criadoEm: string
  atualizadoEm: string
  totalPerguntas: number
  totalRespostas: number
}

interface RespostaHistorico {
  id: number
  nomeAnonimo: string | null
  criadoEm: string
  questionario: {
    id: number
    titulo: string
    status: string
    corTema: string | null
    autor: { nome: string }
  }
}

const STATUS_LABELS: Record<string, string> = {
  todos: 'Todos',
  rascunho: 'Rascunho',
  publicado: 'Publicado',
  encerrado: 'Encerrado',
}

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'var(--text-tertiary)',
  publicado: '#22c55e',
  encerrado: '#f59e0b',
}

export default function MeusQuestionariosPage() {
  const [aba, setAba] = useState<'criados' | 'respondidos'>('criados')
  const [questionarios, setQuestionarios] = useState<Questionario[]>([])
  const [respostas, setRespostas] = useState<RespostaHistorico[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRespostas, setLoadingRespostas] = useState(false)
  const [carregandoPagina, setCarregandoPagina] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [paginaRespostas, setPaginaRespostas] = useState(1)
  const [totalPaginasRespostas, setTotalPaginasRespostas] = useState(1)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [codigoCopiado, setCodigoCopiado] = useState<number | null>(null)
  const seqRef = useRef(0)
  const carregouRespostasRef = useRef(false)

  async function handleCopiarCodigo(q: Questionario) {
    if (!q.codigoAcesso) return
    try { await navigator.clipboard.writeText(q.codigoAcesso) } catch { /* ignore */ }
    setCodigoCopiado(q.id)
    setTimeout(() => setCodigoCopiado(null), 2000)
  }

  const carregar = useCallback(async (p: number, buscaVal: string, statusVal: string) => {
    const seq = ++seqRef.current
    setCarregandoPagina(true)

    try {
      const result = await listarMeusQuestionarios({
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
    listarMeusQuestionarios({ pagina: 1, porPagina: 10 })
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

  const carregarRespostas = useCallback(async (p: number, buscaVal: string) => {
    setLoadingRespostas(true)
    try {
      const result = await listarMinhasRespostas({
        busca: buscaVal || undefined,
        pagina: p,
        porPagina: 10,
      })
      if ('respostas' in result) {
        setRespostas(result.respostas as unknown as RespostaHistorico[])
        setTotalPaginasRespostas(result.paginas as number)
      }
    } catch {
      setErro('Erro ao carregar respostas. Tente novamente.')
    } finally {
      setLoadingRespostas(false)
    }
  }, [])

  function handleTrocarAba(novaAba: 'criados' | 'respondidos') {
    setAba(novaAba)
    setErro(null)
    setBusca('')
    if (novaAba === 'respondidos' && !carregouRespostasRef.current) {
      carregouRespostasRef.current = true
      setPaginaRespostas(1)
      carregarRespostas(1, '')
    }
  }

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (aba === 'respondidos') {
      setPaginaRespostas(1)
      carregarRespostas(1, busca)
    } else {
      setPagina(1)
      carregar(1, busca, statusFiltro)
    }
  }

  function handleFiltrarStatus(status: string) {
    setStatusFiltro(status)
    setErro(null)
    setPagina(1)
    carregar(1, busca, status)
  }

  async function handleAction(id: number, action: () => Promise<unknown>) {
    setActionLoading(id)
    await action()
    setLoading(true)
    setCarregandoPagina(false)
    carregar(pagina, busca, statusFiltro)
    setActionLoading(null)
  }

  function handleDeletar(id: number, titulo: string) {
    if (confirm(`Tem certeza que deseja deletar "${titulo}"?`)) {
      handleAction(id, () => deletarQuestionario(id))
    }
  }

  async function handlePublicar(id: number) {
    const result = await publicarQuestionario(id)
    if (result && 'error' in result && result.error) {
      alert(result.error)
    }
    setLoading(true)
    setCarregandoPagina(false)
    carregar(pagina, busca, statusFiltro)
  }

  function handlePagina(p: number) {
    if (p === pagina) return
    setErro(null)
    setPagina(p)
    carregar(p, busca, statusFiltro)
  }

  function handlePaginaRespostas(p: number) {
    if (p === paginaRespostas) return
    setErro(null)
    setPaginaRespostas(p)
    carregarRespostas(p, busca)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Meus Questionários</h1>
        {aba === 'criados' && (
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
        )}
      </div>

      {/* Abas */}
      <div className="flex mb-6">
        {(['criados', 'respondidos'] as const).map((key) => (
          <button
            key={key}
            onClick={() => handleTrocarAba(key)}
            className="text-xs font-medium px-4 py-2 transition-colors -ml-px first:ml-0 first:rounded-l-lg last:rounded-r-lg"
            style={{
              backgroundColor: aba === key ? 'var(--btn-primary-bg)' : 'var(--card-bg)',
              color: aba === key ? 'var(--btn-primary-text)' : 'var(--text-tertiary)',
              border: '1px solid var(--card-border)',
            }}
          >
            {key === 'criados' ? 'Criados' : 'Respondidos'}
          </button>
        ))}
      </div>

      {/* Busca */}
      <form onSubmit={handleBuscar} className="flex gap-2 mb-4">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={aba === 'criados' ? 'Buscar meus questionários...' : 'Buscar por título...'}
          className="flex-1 min-w-0 rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
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

      {/* Filtros de status (apenas aba criados) */}
      {aba === 'criados' && (
        <div className="mb-6 -mx-4 px-4 md:-mx-6 md:px-6 overflow-hidden">
          <div className="flex gap-0 overflow-x-auto pb-1 scrollbar-hide">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleFiltrarStatus(key)}
                className="text-xs font-medium px-3 py-1.5 transition-colors whitespace-nowrap first:rounded-l-lg last:rounded-r-lg shrink-0"
                style={{
                  backgroundColor: statusFiltro === key ? 'var(--btn-primary-bg)' : 'var(--card-bg)',
                  color: statusFiltro === key ? 'var(--btn-primary-text)' : 'var(--text-tertiary)',
                  border: '1px solid var(--card-border)',
                  marginLeft: '-1px',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {erro && (
        <div className="alert-error mb-4" role="alert">
          {erro}
        </div>
      )}

      {aba === 'respondidos' ? (
        <>
          {loading || loadingRespostas ? (
            <QuestionarioListaSkeleton />
          ) : (
            <>
              {carregandoPagina && <ProgressBar />}

              {respostas.length === 0 && (
                <p className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                  {busca ? 'Nenhuma resposta encontrada com esse filtro.' : 'Você ainda não respondeu nenhum questionário.'}
                </p>
              )}

              <div key={paginaRespostas} className="flex flex-col gap-3 animate-in">
                {respostas.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg p-4 flex items-center gap-4"
                    style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: r.questionario.corTema || 'var(--accent)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/questionarios/${r.questionario.id}`}
                        className="text-sm font-medium hover:underline block truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {r.questionario.titulo}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        por {r.questionario.autor.nome} · {new Date(r.criadoEm).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${STATUS_COLORS[r.questionario.status]}20`, color: STATUS_COLORS[r.questionario.status] }}
                      >
                        {STATUS_LABELS[r.questionario.status] || r.questionario.status}
                      </span>
                      <Link
                        href={`/questionarios/${r.questionario.id}/editar-resposta`}
                        className="text-xs px-2 py-1 rounded hover:underline"
                        style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}
                      >
                        Minha resposta
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !loadingRespostas && totalPaginasRespostas > 1 && (
            <Paginacao
              pagina={paginaRespostas}
              totalPaginas={totalPaginasRespostas}
              onChange={(p) => {
                handlePaginaRespostas(p)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          )}
        </>
      ) : (
        <>
          {loading ? (
            <QuestionarioListaSkeleton />
          ) : (
            <>
              {carregandoPagina && <ProgressBar />}

              {questionarios.length === 0 && (
                <div className="text-center py-12">
                  <p className="mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    {busca || statusFiltro !== 'todos' ? 'Nenhum questionário encontrado com esses filtros.' : 'Você ainda não criou nenhum questionário.'}
                  </p>
                  {!busca && statusFiltro === 'todos' && (
                    <Link
                      href="/questionarios/novo"
                      className="btn-primary"
                    >
                      Criar primeiro questionário
                    </Link>
                  )}
                </div>
              )}

              <div key={pagina} className="flex flex-col gap-4 animate-in">
                {questionarios.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-lg p-5 transition-colors"
                    style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                  >
                    <Link
                      href={`/questionarios/${q.id}`}
                      className="block mb-3"
                      style={{ textDecoration: 'none' }}
                    >
                      <BannerQuestionario cor={q.corTema} compacto className="mb-3" />
                      <h2 className="font-medium text-lg mb-1" style={{ color: 'var(--text-primary)' }}>{q.titulo}</h2>
                      {q.descricao && (
                        <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{q.descricao}</p>
                      )}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
                      <span
                        className="px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${STATUS_COLORS[q.status]}20`, color: STATUS_COLORS[q.status] }}
                      >
                        {STATUS_LABELS[q.status] || q.status}
                      </span>
                      <span>{q.totalPerguntas} {q.totalPerguntas === 1 ? 'pergunta' : 'perguntas'}</span>
                      <span>{q.totalRespostas} {q.totalRespostas === 1 ? 'resposta' : 'respostas'}</span>
                      {q.anonimo && <span>Anônimo</span>}
                      {q.codigoAcesso && (
                        <button
                          onClick={() => handleCopiarCodigo(q)}
                          className="px-2 py-0.5 rounded-full font-medium tracking-wider transition-colors"
                          style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)', border: '1px solid var(--input-border)' }}
                          title="Copiar código de acesso"
                        >
                          {codigoCopiado === q.id ? 'Copiado!' : `Código: ${q.codigoAcesso}`}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/questionarios/${q.id}`}
                        className="btn-secondary"
                        style={{ textDecoration: 'none' }}
                      >
                        Ver
                      </Link>

                      <Link
                        href={`/questionarios/${q.id}/imprimir`}
                        className="btn-secondary"
                        style={{ textDecoration: 'none' }}
                      >
                        Imprimir
                      </Link>

                      {q.status === 'rascunho' && (
                        <>
                          <Link
                            href={`/questionarios/${q.id}/editar`}
                            className="btn-secondary"
                            style={{ textDecoration: 'none' }}
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handlePublicar(q.id)}
                            disabled={actionLoading === q.id}
                            className="btn-success"
                          >
                            Publicar
                          </button>
                        </>
                      )}

                      {q.status === 'publicado' && (
                        <button
                          onClick={() => handleAction(q.id, () => encerrarQuestionario(q.id))}
                          disabled={actionLoading === q.id}
                          className="btn-warning"
                        >
                          Encerrar
                        </button>
                      )}

                      {q.status !== 'rascunho' && q.totalRespostas === 0 && (
                        <button
                          onClick={() => handleDeletar(q.id, q.titulo)}
                          disabled={actionLoading === q.id}
                          className="btn-danger"
                        >
                          Deletar
                        </button>
                      )}

                      <button
                        onClick={() => handleAction(q.id, () => duplicarQuestionario(q.id))}
                        disabled={actionLoading === q.id}
                        className="btn-ghost"
                      >
                        Duplicar
                      </button>
                    </div>
                  </div>
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
        </>
      )}
    </div>
  )
}