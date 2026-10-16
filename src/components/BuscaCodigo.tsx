'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buscarQuestionarioPorCodigo } from '@/modules/questionarios/questionarios.actions'

export default function BuscaCodigo() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (buscando) return

    const valor = codigo.trim()
    if (!valor) {
      setErro('Digite o código do questionário.')
      return
    }

    setBuscando(true)
    setErro(null)

    try {
      const result = await buscarQuestionarioPorCodigo(valor)
      if ('error' in result && result.error) {
        setErro(result.error)
      } else if (result.questionario) {
        router.push(`/questionarios/${result.questionario.id}`)
      }
    } catch {
      setErro('Erro ao buscar o questionário. Tente novamente.')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor="codigo-acesso" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
        Digite o código do questionário
      </label>
      <div className="flex gap-2">
        <input
          id="codigo-acesso"
          type="text"
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value.toUpperCase())
            setErro(null)
          }}
          placeholder="Ex.: K7XM2P"
          maxLength={10}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="flex-1 min-w-0 rounded-xl px-4 py-3 text-sm font-medium tracking-widest uppercase focus:outline-none transition-colors"
          style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
        />
        <button
          type="submit"
          disabled={buscando}
          className="btn-primary rounded-xl px-5 py-3 text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-60"
        >
          {buscando ? 'Buscando...' : 'Acessar'}
        </button>
      </div>
      {erro && (
        <p className="text-xs mt-2" role="alert" style={{ color: '#f87171' }}>
          {erro}
        </p>
      )}
    </form>
  )
}
