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
  { href: '/', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { href: '/questionarios/meus', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 14l2 2 4-4"/>
    </svg>
  )},
]

export default function MobileBottomNav({ usuario }: { usuario: Usuario | null }) {
  const pathname = usePathname()

  const linkClass = () =>
    `flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-[11px] font-medium transition-all`

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-4 pb-3">
      <div
        className="flex w-fit mx-auto items-center gap-2 rounded-2xl px-3 py-2 backdrop-blur-xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-tertiary) 85%, transparent)',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }}
      >
        {navItems.map(item => {
          const isActive = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <div key={item.href} className="relative">
              <Link
                href={item.href}
                className={linkClass()}
                style={{
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--accent-dim)' : 'transparent'
                }}
              >
                {item.icon}
              </Link>
              {usuario && item.href === '/questionarios/meus' && <PendingSyncBadge mobile />}
            </div>
          )
        })}

        {usuario && (
          <Link
            href="/notificacoes"
            className={linkClass()}
            style={{
              color: pathname === '/notificacoes' ? 'var(--accent)' : 'var(--text-secondary)',
              backgroundColor: pathname === '/notificacoes' ? 'var(--accent-dim)' : 'transparent'
            }}
          >
            <SinoNotificacoes showLink={false} activeColor={pathname === '/notificacoes' ? 'var(--accent)' : undefined} />
          </Link>
        )}

        {usuario ? (
          <Link
            href={`/usuarios/${usuario.id}`}
            className={linkClass()}
            style={{
              color: pathname.startsWith(`/usuarios/${usuario.id}`) ? 'var(--accent)' : 'var(--text-secondary)',
              backgroundColor: pathname.startsWith(`/usuarios/${usuario.id}`) ? 'var(--accent-dim)' : 'transparent'
            }}
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
            className={linkClass()}
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          </Link>
        )}
      </div>
    </nav>
  )
}
