'use client'

import { useActionState, useState } from 'react'
import { registrar } from '../usuarios.actions'
import Link from 'next/link'
import CampoSenha from '../components/CampoSenha'
import TermosModal from '@/components/TermosModal'

async function registrarAction(_prev: { error?: string } | null, formData: FormData) {
  const nome = formData.get('nome') as string
  const email = formData.get('email') as string
  const senha = formData.get('senha') as string
  const confirmarSenha = formData.get('confirmarSenha') as string
  const aceitouTermos = formData.get('aceitouTermos') === 'on'
  return await registrar(nome, email, senha, confirmarSenha, aceitouTermos)
}

export default function RegistroPage() {
  const [estado, formAction, pending] = useActionState(registrarAction, null)
  const [termosAbertos, setTermosAbertos] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  return (
    <div>
      <TermosModal isOpen={termosAbertos} onClose={() => setTermosAbertos(false)} readonly />
      <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Criar conta</h1>

      <form action={formAction} className="flex flex-col gap-4">
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

        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nome</label>
          <input
            name="nome"
            placeholder="Seu nome"
            maxLength={50}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
            style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Email</label>
          <input
            name="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
            style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
          />
        </div>

        <CampoSenha name="senha" label="Senha" minLength={8} value={senha} onChange={setSenha} />

        <CampoSenha name="confirmarSenha" label="Confirmar senha" minLength={8} placeholder="Repita a senha" value={confirmarSenha} onChange={setConfirmarSenha} />

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            name="aceitouTermos"
            id="aceitouTermos"
            required
            className="mt-1 rounded"
          />
          <label htmlFor="aceitouTermos" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Li e aceito os{' '}
            <button
              type="button"
              onClick={() => setTermosAbertos(true)}
              className="hover:underline cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
            >
              Termo de Compromisso e Responsabilidade
            </button>
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-fit"
        >
          {pending ? 'Criando...' : 'Criar conta'}
        </button>

        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Já tem conta?{' '}
          <Link href="/usuarios/login" className="hover:underline" style={{ color: 'var(--text-primary)' }}>
            Entrar
          </Link>
        </p>
      </form>
    </div>
  )
}
