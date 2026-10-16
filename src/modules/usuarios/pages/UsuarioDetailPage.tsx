import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getUsuarioLogado } from '@/modules/usuarios/usuarios.actions'

interface Props {
  id: number
}

export default async function UsuarioDetailPage({ id }: Props) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
  })

  if (!usuario) notFound()

  const usuarioLogado = await getUsuarioLogado()
  const isDono = usuarioLogado?.id === usuario.id

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Perfil</h1>

      <div className="flex items-start gap-5 mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold flex-shrink-0" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
          {usuario.nome.charAt(0).toUpperCase()}
        </div>

        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{usuario.nome}</h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{usuario.email}</p>
        </div>
      </div>

      {usuario.bio && (
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{usuario.bio}</p>
      )}

      {isDono && (
        <div className="mb-8 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex">
            <Link
              href={`/usuarios/${usuario.id}/editar`}
              className="text-xs font-medium px-3 py-1.5 transition-colors -ml-px first:ml-0 first:rounded-l-lg hover:underline"
              style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}
            >
              Editar perfil
            </Link>
            {usuario.senha && (
              <Link
                href={`/usuarios/${usuario.id}/senha`}
                className="text-xs font-medium px-3 py-1.5 transition-colors -ml-px hover:underline"
                style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}
              >
                Alterar senha
              </Link>
            )}
            <Link
              href="/usuarios/configuracoes"
              className="text-xs font-medium px-3 py-1.5 transition-colors -ml-px hover:underline"
              style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}
            >
              Configurações
            </Link>
            <Link
              href="/usuarios/sobre"
              className="text-xs font-medium px-3 py-1.5 transition-colors -ml-px last:rounded-r-lg hover:underline"
              style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}
            >
              Sobre
            </Link>
          </div>

            {usuarioLogado?.isAdmin && (
              <div className="mt-3">
                <Link
                  href="/admin"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 hover:underline"
                  style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  Painel administrativo
                </Link>
              </div>
            )}
          </div>
      )}
    </div>
  )
}
