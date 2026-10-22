'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { enviarResposta, editarResposta } from '../questionarios.actions'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { usePendingRespostas } from '@/lib/useData'

const PERGUNTAS_POR_PAGINA = 10

interface Opcao {
  id: number
  texto: string
  ordem: number
}

interface Pergunta {
  id: number
  texto: string
  tipo: string
  obrigatoria: boolean
  ordem: number
  opcoes: Opcao[]
  configEscala: { min: number; max: number; passo: number } | null
}

interface Questionario {
  id: number
  titulo: string
  descricao: string | null
  perguntas: Pergunta[]
}

interface Props {
  questionario: Questionario
  anonimo?: boolean
  respostaExistente?: {
    id: number
    valores: {
      perguntaId: number
      texto: string | null
      opcaoId: number | null
      valorNumerico: number | null
    }[]
  } | null
}

interface ValoresResposta {
  [perguntaId: number]: {
    texto?: string
    opcaoId?: number
    opcaoIds?: number[]
    valorNumerico?: number
  }
}

export default function FormResposta({ questionario, anonimo, respostaExistente }: Props) {
  const router = useRouter()
  const isOnline = useOnlineStatus()
  const { pending, addPending } = usePendingRespostas(questionario.id)
  const [valores, setValores] = useState<ValoresResposta>(() => {
    if (!respostaExistente) return {}
    const inicial: ValoresResposta = {}
    for (const v of respostaExistente.valores) {
      inicial[v.perguntaId] = {
        texto: v.texto || undefined,
        opcaoId: v.opcaoId || undefined,
        valorNumerico: v.valorNumerico || undefined,
      }
    }
    return inicial
  })
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enfileirado, setEnfileirado] = useState(false)
  const [nomeAnonimo, setNomeAnonimo] = useState('')
  const [pagina, setPagina] = useState(0)

  const isEdicao = !!respostaExistente
  const jaEnfileirada = !isEdicao && pending.length > 0

  const totalPerguntas = questionario.perguntas.length
  const totalPaginas = Math.max(1, Math.ceil(totalPerguntas / PERGUNTAS_POR_PAGINA))
  const inicio = pagina * PERGUNTAS_POR_PAGINA
  const perguntasPagina = questionario.perguntas.slice(inicio, inicio + PERGUNTAS_POR_PAGINA)

  function perguntaRespondida(pergunta: Pergunta): boolean {
    const v = valores[pergunta.id]
    if (!v) return false
    switch (pergunta.tipo) {
      case 'texto_curto':
      case 'texto_longo':
        return (v.texto || '').trim().length > 0
      case 'escolha_unica':
        return v.opcaoId != null
      case 'multipla_escolha':
        return (v.opcaoIds?.length || 0) > 0
      case 'escala':
        return v.valorNumerico != null
      default:
        return false
    }
  }

  const respondidas = questionario.perguntas.filter(perguntaRespondida).length
  const percentual = totalPerguntas > 0 ? Math.round((respondidas / totalPerguntas) * 100) : 0

  function irParaPagina(nova: number) {
    setPagina(Math.max(0, Math.min(nova, totalPaginas - 1)))
    setErro(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function validarPaginaAtual(): boolean {
    return perguntasPagina.every((p) => !p.obrigatoria || perguntaRespondida(p))
  }

  function avancar() {
    if (!validarPaginaAtual()) {
      setErro('Responda as perguntas obrigatórias (*) antes de avançar.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    irParaPagina(pagina + 1)
  }

  function gerarSyncId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  function atualizarTexto(perguntaId: number, texto: string) {
    setValores((prev) => ({
      ...prev,
      [perguntaId]: { ...prev[perguntaId], texto },
    }))
  }

  function atualizarOpcao(perguntaId: number, opcaoId: number) {
    setValores((prev) => ({
      ...prev,
      [perguntaId]: { ...prev[perguntaId], opcaoId },
    }))
  }

  function toggleMultiplaEscolha(perguntaId: number, opcaoId: number) {
    setValores((prev) => {
      const atual = prev[perguntaId]?.opcaoIds || []
      const novo = atual.includes(opcaoId)
        ? atual.filter((id) => id !== opcaoId)
        : [...atual, opcaoId]
      return {
        ...prev,
        [perguntaId]: { ...prev[perguntaId], opcaoIds: novo },
      }
    })
  }

  function atualizarEscala(perguntaId: number, valor: number) {
    setValores((prev) => ({
      ...prev,
      [perguntaId]: { ...prev[perguntaId], valorNumerico: valor },
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (jaEnfileirada) {
      setErro('Você já tem uma resposta salva neste dispositivo, aguardando sincronização.')
      return
    }
    setErro(null)
    setEnviando(true)

    const valoresEnvio = Object.entries(valores).map(([perguntaId, v]) => {
      const pergunta = questionario.perguntas.find((p) => p.id === Number(perguntaId))
      return {
        perguntaId: Number(perguntaId),
        tipo: pergunta?.tipo || '',
        texto: v.texto || null,
        opcaoId: v.opcaoId || null,
        opcaoIds: v.opcaoIds || [],
        valorNumerico: v.valorNumerico ?? null,
      }
    })

    try {
      if (!isOnline) {
        await addPending({
          questionarioId: questionario.id,
          syncId: gerarSyncId(),
          valores: valoresEnvio,
          nomeAnonimo: nomeAnonimo || undefined,
          isEdicao,
          respostaId: respostaExistente?.id,
        })

        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          try {
            const registration = await navigator.serviceWorker.ready
            const swReg = registration as unknown as { sync: { register: (tag: string) => Promise<void> } }
            await swReg.sync.register('sync-mutations')
          } catch {
            // se não conseguir agendar, sincroniza na próxima reconexão (useOfflineSync)
          }
        }

        setEnfileirado(true)
        setEnviando(false)
        return
      }

      let resultado
      if (isEdicao) {
        resultado = await editarResposta(questionario.id, valoresEnvio)
      } else {
        resultado = await enviarResposta(questionario.id, valoresEnvio, nomeAnonimo || undefined)
      }
      if (resultado?.error) {
        setErro(resultado.error)
        setEnviando(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        router.push(`/questionarios/${questionario.id}/resultados`)
        router.refresh()
      }
    } catch {
      setErro(isEdicao ? 'Erro ao editar resposta' : 'Erro ao enviar resposta')
      setEnviando(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function renderPergunta(pergunta: Pergunta) {
    const valor = valores[pergunta.id]

    switch (pergunta.tipo) {
      case 'texto_curto':
        return (
          <input
            type="text"
            value={valor?.texto || ''}
            onChange={(e) => atualizarTexto(pergunta.id, e.target.value)}
            placeholder="Sua resposta"
            className="w-full rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
            style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
          />
        )

      case 'texto_longo':
        return (
          <textarea
            value={valor?.texto || ''}
            onChange={(e) => atualizarTexto(pergunta.id, e.target.value)}
            placeholder="Sua resposta"
            rows={4}
            className="w-full rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors resize-none"
            style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
          />
        )

      case 'escolha_unica':
        return (
          <div className="flex flex-col gap-2">
            {pergunta.opcoes.map((opcao) => (
              <label
                key={opcao.id}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                style={{
                  backgroundColor: valor?.opcaoId === opcao.id ? 'var(--btn-primary-bg)' : 'var(--input-bg)',
                  border: `1px solid ${valor?.opcaoId === opcao.id ? 'var(--btn-primary-bg)' : 'var(--input-border)'}`,
                  color: valor?.opcaoId === opcao.id ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                }}
              >
                <input
                  type="radio"
                  name={`pergunta_${pergunta.id}`}
                  checked={valor?.opcaoId === opcao.id}
                  onChange={() => atualizarOpcao(pergunta.id, opcao.id)}
                  className="accent-current"
                />
                <span className="text-sm">{opcao.texto}</span>
              </label>
            ))}
          </div>
        )

      case 'multipla_escolha':
        return (
          <div className="flex flex-col gap-2">
            {pergunta.opcoes.map((opcao) => {
              const selecionada = valor?.opcaoIds?.includes(opcao.id) || false
              return (
                <label
                  key={opcao.id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  style={{
                    backgroundColor: selecionada ? 'var(--btn-primary-bg)' : 'var(--input-bg)',
                    border: `1px solid ${selecionada ? 'var(--btn-primary-bg)' : 'var(--input-border)'}`,
                    color: selecionada ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selecionada}
                    onChange={() => toggleMultiplaEscolha(pergunta.id, opcao.id)}
                    className="accent-current"
                  />
                  <span className="text-sm">{opcao.texto}</span>
                </label>
              )
            })}
          </div>
        )

      case 'escala': {
        const config = pergunta.configEscala || { min: 1, max: 5, passo: 1 }
        const atual = valor?.valorNumerico ?? config.min
        return (
          <div className="flex flex-col gap-2">
            <input
              type="range"
              min={config.min}
              max={config.max}
              step={config.passo}
              value={atual}
              onChange={(e) => atualizarEscala(pergunta.id, Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{ backgroundColor: 'var(--input-bg)' }}
            />
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <span>{config.min}</span>
              <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{atual}</span>
              <span>{config.max}</span>
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {erro && (
        <div className="alert-error" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {erro}
        </div>
      )}

      {enfileirado && (
        <div className="alert-success flex items-center gap-2" role="status">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <path d="M9 10h6"/>
          </svg>
          <span>
            Você está offline. Sua resposta foi <strong>salva no dispositivo</strong> e será enviada automaticamente quando a conexão voltar.
          </span>
        </div>
      )}

      {jaEnfileirada && (
        <div className="alert-warning flex items-center gap-2" role="status">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>
            Você já respondeu este questionário neste dispositivo. A resposta será enviada automaticamente quando a conexão voltar.
          </span>
        </div>
      )}

      {!isOnline && !enfileirado && !jaEnfileirada && (
        <div className="alert-warning flex items-center gap-2" role="status">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18"/>
            <path d="M6 6l12 12"/>
          </svg>
          <span>
            Você está offline. Suas respostas serão salvas localmente e sincronizadas quando a conexão voltar.
          </span>
        </div>
      )}

      {totalPaginas > 1 && (
        <div
          className="rounded-lg p-3 flex flex-col gap-2"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <div className="flex items-center justify-between gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-medium">Página {pagina + 1} de {totalPaginas}</span>
            <span>{respondidas} de {totalPerguntas} respondidas ({percentual}%)</span>
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--input-bg)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${percentual}%`, backgroundColor: 'var(--btn-primary-bg)' }}
            />
          </div>
        </div>
      )}

      {pagina === 0 && anonimo && !isEdicao && (
        <div className="rounded-lg p-4 flex flex-col gap-2" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Como você gostaria de ser identificado? <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>(opcional)</span>
          </p>
          <input
            type="text"
            value={nomeAnonimo}
            onChange={(e) => setNomeAnonimo(e.target.value)}
            placeholder="Seu nome (ou deixe em branco para anônimo)"
            className="rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
            style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
          />
        </div>
      )}

      {perguntasPagina.map((pergunta, idx) => (
        <div
          key={pergunta.id}
          className="rounded-lg p-4 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <div className="flex items-start gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {inicio + idx + 1}.
            </span>
            <p className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>
              {pergunta.texto}
              {pergunta.obrigatoria && (
                <span className="ml-1" style={{ color: '#f87171' }}>*</span>
              )}
            </p>
          </div>
          {renderPergunta(pergunta)}
        </div>
      ))}

      <div className="flex flex-wrap gap-2 pt-2">
        {pagina > 0 && (
          <button
            type="button"
            onClick={() => irParaPagina(pagina - 1)}
            className="btn-secondary"
          >
            Voltar
          </button>
        )}
        {pagina < totalPaginas - 1 ? (
          <button
            type="button"
            onClick={avancar}
            className="btn-primary flex-1 min-w-[7rem]"
          >
            Avançar
          </button>
        ) : (
          <button
            type="submit"
            disabled={enviando || enfileirado || jaEnfileirada}
            className="btn-primary flex-1 min-w-[7rem]"
          >
            {jaEnfileirada ? 'Resposta já salva' : enfileirado ? 'Resposta salva ✓' : enviando ? (isEdicao ? 'Salvando...' : 'Enviando...') : (!isOnline ? 'Salvar offline' : (isEdicao ? 'Salvar alterações' : 'Enviar respostas'))}
          </button>
        )}
        {pending.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 rounded-lg" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-secondary)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {pending.length} resposta(s) pendente(s)
          </span>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
