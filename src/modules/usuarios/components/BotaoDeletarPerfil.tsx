'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletarUsuario } from '../usuarios.actions'
import CampoSenha from './CampoSenha'

interface Props {
  id: number
  temSenha: boolean
}

export default function BotaoDeletarPerfil({ id, temSenha }: Props) {
  const [aberto, setAberto] = useState(false)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()

  async function handleDeletar() {
    setErro('')
    if (temSenha && !senha.trim()) {
      setErro('Digite sua senha para confirmar')
      return
    }
    setCarregando(true)
    const resultado = await deletarUsuario(id, senha)
    if (resultado?.error) {
      setErro(resultado.error)
      setCarregando(false)
      return
    }
    router.push('/usuarios/login')
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="btn-danger"
      >
        Deletar conta
      </button>

      {aberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-sm mx-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Deletar conta</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Tem certeza que quer deletar sua conta? Todos os seus posts também serão deletados. Esta ação não pode ser desfeita.
            </p>
            {temSenha && (
              <div className="mb-4">
                <CampoSenha name="senha" label="Digite sua senha para confirmar" value={senha} onChange={setSenha} />
              </div>
            )}
            {erro && (
              <div className="alert-error mb-4" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {erro}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setAberto(false); setSenha(''); setErro('') }}
                className="btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletar}
                disabled={carregando}
                className="btn-danger"
              >
                {carregando ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
