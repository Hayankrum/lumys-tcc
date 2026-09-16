'use client'

import { useActionState, useState } from 'react'
import { alterarSenha } from '../usuarios.actions'
import Link from 'next/link'
import CampoSenha from '../components/CampoSenha'

interface Props {
  usuarioId: number
}

async function alterarAction(_prev: { error?: string; success?: string } | null, formData: FormData) {
  const id = Number(formData.get('id'))
  const senhaAtual = formData.get('senhaAtual') as string
  const novaSenha = formData.get('novaSenha') as string
  const confirmarSenha = formData.get('confirmarSenha') as string
  return await alterarSenha(id, senhaAtual, novaSenha, confirmarSenha)
}

export default function AlterarSenhaPage({ usuarioId }: Props) {
  const [estado, formAction, pending] = useActionState(alterarAction, null)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  return (
    <div>
      <Link
        href={`/usuarios/${usuarioId}`}
        className="text-sm transition-colors mb-6 inline-block hover:underline"
        style={{ color: 'var(--text-tertiary)' }}
      >
        ← Voltar
      </Link>

      <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Alterar senha</h1>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={usuarioId} />

        {estado?.error && (
          <div className="alert-error" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {estado.error}
          </div>
        )}

        {estado?.success && (
          <div className="alert-success" role="status">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            {estado.success}
          </div>
        )}

        <CampoSenha name="senhaAtual" label="Senha atual" value={senhaAtual} onChange={setSenhaAtual} />

        <CampoSenha name="novaSenha" label="Nova senha" minLength={8} placeholder="Mínimo 8 caracteres" value={novaSenha} onChange={setNovaSenha} />

        <CampoSenha name="confirmarSenha" label="Confirmar nova senha" minLength={8} placeholder="Repita a nova senha" value={confirmarSenha} onChange={setConfirmarSenha} />

        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-fit"
        >
          {pending ? 'Alterando...' : 'Alterar senha'}
        </button>
      </form>
    </div>
  )
}
