'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import InstallPWAButton from '@/components/InstallPWAButton'
import TermosModal from '@/components/TermosModal'

function ShareSection() {
  const [shareData, setShareData] = useState({ url: '', qrSvg: '' })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const origin = window.location.origin
    QRCode.toString(origin, { type: 'svg', margin: 2, width: 150 }, (err, svg) => {
      setShareData({ url: origin, qrSvg: err ? '' : svg })
    })
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Confira este aplicativo',
          text: 'Confira este aplicativo!',
          url: shareData.url,
        })
      } catch {
        // usuário cancelou
      }
    } else {
      handleCopy()
    }
  }

  if (!shareData.url) return null

  return (
    <section className="rounded-lg p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
      <h2 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Compartilhar</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Compartilhe o aplicativo com amigos e colegas.
      </p>

      <div className="flex flex-col items-center gap-4">
        {/* QR Code */}
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'white' }}
          dangerouslySetInnerHTML={{ __html: shareData.qrSvg }}
        />

        {/* URL */}
        <div className="w-full">
          <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Link do aplicativo:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareData.url}
              className="flex-1 px-3 py-2 rounded-md text-xs border truncate"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-md text-xs font-medium transition-colors min-h-[44px]"
              style={{
                backgroundColor: copied ? 'var(--btn-primary-bg)' : 'var(--btn-secondary-bg)',
                color: copied ? 'var(--btn-primary-text)' : 'var(--text-primary)',
              }}
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Botão Compartilhar */}
        <button
          onClick={handleShare}
          className="w-full font-medium rounded-lg px-6 py-3 text-sm transition-colors min-h-[44px] flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
        >
          <span>📤</span>
          <span>Compartilhar</span>
        </button>
      </div>
    </section>
  )
}

interface UserInfo {
  id: number
}

export default function SobrePage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [termosAbertos, setTermosAbertos] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) setUser(data)
      })
      .catch(() => {})
  }, [])

  return (
    <div>
      <Link
        href={user ? `/usuarios/${user.id}` : '/'}
        className="text-sm transition-colors mb-6 inline-block hover:underline"
        style={{ color: 'var(--text-tertiary)' }}
      >
        ← Voltar ao perfil
      </Link>

      <h1 className="text-2xl font-semibold mb-8" style={{ color: 'var(--text-primary)' }}>Sobre o aplicativo</h1>

      <div className="flex flex-col gap-6">
        <section className="rounded-lg p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Uma plataforma completa para criar e responder questionários com suporte offline,
            notificações push e gerenciamento de usuários.
          </p>
        </section>

        <section className="rounded-lg p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <h2 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Funcionalidades</h2>
          <ul className="text-sm space-y-3" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>Criação e gerenciamento de questionários</span>
            </li>
            <li className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span>Notificações push em tempo real</span>
            </li>
            <li className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
              </svg>
              <span>Suporte offline completo</span>
            </li>
            <li className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              <span>Tema claro e escuro</span>
            </li>
            <li className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <rect x="5" y="2" width="14" height="20" rx="2"/>
                <line x1="12" y1="18" x2="12" y2="18"/>
              </svg>
              <span>PWA - instalável em qualquer dispositivo</span>
            </li>
          </ul>
        </section>

        <section className="rounded-lg p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <h2 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Instalar aplicativo</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Instale o aplicativo na sua tela inicial para acesso rápido e melhor experiência offline.
          </p>
          <InstallPWAButton />
        </section>

        <section className="rounded-lg p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <h2 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Como instalar</h2>
          <div className="text-sm space-y-3" style={{ color: 'var(--text-secondary)' }}>
            <div>
              <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Chrome / Edge</p>
              <p className="text-xs">Clique no ícone de instalar que aparece na barra de endereço do navegador.</p>
            </div>
            <div>
              <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Firefox</p>
              <p className="text-xs">Clique nos 3 pontos do menu → &quot;Instalar&quot;.</p>
            </div>
            <div>
              <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Safari (iOS)</p>
              <p className="text-xs">Toque no botão &quot;Compartilhar&quot; → &quot;Adicionar à Tela de Início&quot;.</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <h2 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Termos de Uso e Compromisso</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Consulte a qualquer momento os termos, o compromisso e as regras de uso da plataforma.
          </p>
          <button
            onClick={() => setTermosAbertos(true)}
            className="w-full font-medium rounded-lg px-6 py-3 text-sm transition-colors min-h-[44px]"
            style={{ backgroundColor: 'var(--btn-secondary-bg)', color: 'var(--text-primary)' }}
          >
            Ver Termos de Uso e Compromisso
          </button>
        </section>

        <ShareSection />
      </div>

      <TermosModal isOpen={termosAbertos} onClose={() => setTermosAbertos(false)} readonly />
    </div>
  )
}
