'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { denunciarQuestionario, obterMinhaDenuncia } from '../denuncias.actions'
import { MAX_DENUNCIAS, MOTIVOS_DENUNCIA } from '../denuncias.constants'
import { useUsuario } from '@/lib/useData'

interface Props {
  questionarioId: number
  autorId: number
  status: string
}

export default function BotaoDenunciar({ questionarioId, autorId, status }: Props) {
  const router = useRouter()
  const { usuario } = useUsuario()
  const [aberto, setAberto] = useState(false)
  const [jaDenunciado, setJaDenunciado] = useState(false)
  const [motivo, setMotivo] = useState(MOTIVOS_DENUNCIA[0].valor)
  const [detalhes, setDetalhes] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!usuario) return
    obterMinhaDenuncia(questionarioId).then((d) => {
      if (d) setJaDenunciado(true)
    })
  }, [usuario, questionarioId])

  const visivel = Boolean(usuario && status !== 'rascunho' && usuario.id !== autorId && !jaDenunciado)

  const handleEnviar = useCallback(async () => {
    if (processando) return
    setProcessando(true)
    setErro(null)

    try {
      const result = await denunciarQuestionario(questionarioId, motivo, detalhes)
      if (result?.error) {
        setErro(result.error)
      } else if (result?.removido) {
        setAberto(false)
        alert('Este questionário atingiu o limite de denúncias e foi removido.')
        router.push('/questionarios')
        router.refresh()
      } else {
        setJaDenunciado(true)
        setAberto(false)
        alert('Denúncia enviada. Obrigado por ajudar a manter a comunidade segura.')
        router.refresh()
      }
    } finally {
      setProcessando(false)
    }
  }, [processando, questionarioId, motivo, detalhes, router])

  if (!visivel) return null

  return (
    <>
      <button
        onClick={() => { setAberto(true); setErro(null) }}
        className="btn-ghost"
        aria-label="Denunciar questionário"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 inline">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
        Denunciar
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          onClick={() => { if (!processando) setAberto(false) }}
        >
          <div
            className="w-full max-w-md rounded-lg p-5"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Denunciar questionário</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              A denúncia é analisada e, ao atingir {MAX_DENUNCIAS} denúncias, o questionário é removido automaticamente.
            </p>

            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Motivo
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm mb-3 focus:outline-none"
              style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
            >
              {MOTIVOS_DENUNCIA.map((m) => (
                <option key={m.valor} value={m.valor}>{m.label}</option>
              ))}
            </select>

            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Detalhes <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>(opcional)</span>
            </label>
            <textarea
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Conte brevemente o que há de errado com este questionário..."
              className="w-full rounded px-3 py-2 text-sm mb-3 focus:outline-none resize-none"
              style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
            />

            {erro && (
              <p className="text-xs mb-3" style={{ color: '#f87171' }}>{erro}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setAberto(false)}
                disabled={processando}
                className="btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviar}
                disabled={processando}
                className="btn-danger"
              >
                {processando ? 'Enviando...' : 'Enviar denúncia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}