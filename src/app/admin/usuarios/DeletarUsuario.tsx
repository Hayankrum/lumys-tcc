'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletarUsuarioAdmin } from '@/modules/usuarios/usuarios.actions'

interface Props {
  usuarioId: number
  nome: string
  email: string
}

export default function DeletarUsuario({ usuarioId, nome, email }: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [senha, setSenha] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function fechar() {
    if (processando) return
    setAberto(false)
    setSenha('')
    setErro(null)
  }

  async function handleDeletar() {
    if (processando) return
    if (!senha) {
      setErro('Informe sua senha para confirmar')
      return
    }
    setProcessando(true)
    setErro(null)

    const result = await deletarUsuarioAdmin(usuarioId, senha)
    if (result?.error) {
      setErro(result.error)
      setProcessando(false)
    } else {
      fechar()
      router.refresh()
    }
  }

  return (
    <>
      <button
        onClick={() => { setAberto(true); setErro(null) }}
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors hover:underline"
        style={{ backgroundColor: '#f8717120', color: '#f87171' }}
      >
        Remover
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          onClick={fechar}
        >
          <div
            className="w-full max-w-md rounded-lg p-5"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Excluir usuário</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Confirmar a exclusão de <strong style={{ color: 'var(--text-primary)' }}>{nome}</strong>
              {email ? ` (${email})` : ''}?
            </p>

            <div
              className="rounded-md p-3 text-xs mb-4"
              style={{ backgroundColor: '#f8717120', color: '#f87171' }}
            >
              Esta ação é irreversível. Os questionários e respostas deste usuário também serão removidos.
            </div>

            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Sua senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoFocus
              placeholder="Confirme com sua senha de admin"
              className="w-full rounded px-3 py-2 text-sm mb-3 focus:outline-none"
              style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleDeletar() }}
            />

            {erro && (
              <p className="text-xs mb-3" style={{ color: '#f87171' }}>{erro}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={fechar}
                disabled={processando}
                className="btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletar}
                disabled={processando}
                className="btn-danger"
              >
                {processando ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}