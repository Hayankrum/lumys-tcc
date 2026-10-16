'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SinoNotificacoes from '@/modules/notificacoes/SinoNotificacoes'
import PendingSyncBadge from '@/modules/layout/PendingSyncBadge'

interface Usuario {
  id: number
  nome: string
  isAdmin?: boolean
}

const navItems = [
  { href: '/questionarios/meus', title: 'Meus Questionários', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  )},
]

export default function Navbar({ usuario }: { usuario: Usuario | null }) {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 hidden md:block px-4 pt-3">
      <div
        className="max-w-3xl mx-auto flex items-center gap-2 rounded-2xl px-4 py-2 backdrop-blur-xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-tertiary) 85%, transparent)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <Link href="/" className="flex items-center mr-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon1.svg" alt="" className="h-6 w-auto" style={{ filter: 'var(--watermark-glow-1) var(--watermark-glow-2)' }} />
        </Link>

        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="transition-all flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--accent-dim)' : 'transparent'
              }}
              title={item.title}
            >
              {item.icon}
              <span className="hidden lg:inline">{item.title}</span>
            </Link>
          )
        })}

        <div className="ml-auto flex items-center gap-3">
          {usuario && <SinoNotificacoes />}
          {usuario && <PendingSyncBadge />}
          {usuario ? (
            <Link
              href={`/usuarios/${usuario.id}`}
              className="transition-all flex items-center gap-2 rounded-xl px-2 py-1.5"
              title={usuario.nome}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--btn-primary-text)'
                }}
              >
                {usuario.nome.charAt(0).toUpperCase()}
              </span>
            </Link>
          ) : (
            <Link
              href="/usuarios/login"
              className="btn-primary rounded-xl px-4 py-2 text-xs font-medium"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
