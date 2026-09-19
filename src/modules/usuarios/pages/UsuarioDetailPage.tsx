import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getUsuarioLogado } from '@/modules/usuarios/usuarios.actions'


const PAGE_SIZE = 20

interface Props {
  id: number
  page?: number
}

export default async function UsuarioDetailPage({ id, page = 1 }: Props) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
  })

  if (!usuario) notFound()

  const paginaAtual = Math.max(1, page)

  const usuarioLogado = await getUsuarioLogado()
  const isDono = usuarioLogado?.id === usuario.id

  const [respostas, totalRespostas] = isDono
    ? await Promise.all([
        prisma.resposta.findMany({
          where: { usuarioId: usuario.id },
          select: {
            id: true,
            nomeAnonimo: true,
            criadoEm: true,
            questionario: {
              select: {
                id: true,
                titulo: true,
                status: true,
                corTema: true,
                autor: { select: { nome: true } },
              },
            },
          },
          orderBy: { criadoEm: 'desc' },
          skip: (paginaAtual - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        prisma.resposta.count({ where: { usuarioId: usuario.id } }),
      ])
    : [[], 0]

  const totalPaginas = Math.max(1, Math.ceil(totalRespostas / PAGE_SIZE))

  const STATUS_LABELS: Record<string, string> = {
    rascunho: 'Rascunho',
    publicado: 'Publicado',
    encerrado: 'Encerrado',
  }

  const STATUS_COLORS: Record<string, string> = {
    rascunho: 'var(--text-tertiary)',
    publicado: '#22c55e',
    encerrado: '#f59e0b',
  }

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

      {isDono && respostas.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Histórico de questionários respondidos
          </h2>
          <div className="flex flex-col gap-3">
            {respostas.map((r) => (
              <div
                key={r.id}
                className="rounded-lg p-4 flex items-center gap-4"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: r.questionario.corTema || 'var(--accent)' }}
                />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/questionarios/${r.questionario.id}`}
                    className="text-sm font-medium hover:underline block truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {r.questionario.titulo}
                  </Link>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {r.nomeAnonimo || 'Respondido'} · {r.criadoEm.toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${STATUS_COLORS[r.questionario.status]}20`, color: STATUS_COLORS[r.questionario.status] }}
                  >
                    {STATUS_LABELS[r.questionario.status] || r.questionario.status}
                  </span>
                  <Link
                    href={`/questionarios/${r.questionario.id}/editar-resposta`}
                    className="text-xs px-2 py-1 rounded hover:underline"
                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}
                  >
                    Minha resposta
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Mostrando {Math.min(paginaAtual * PAGE_SIZE, totalRespostas)} de {totalRespostas} respostas
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={paginaAtual > 1 ? `/usuarios/${usuario.id}?page=${paginaAtual - 1}` : `/usuarios/${usuario.id}`}
                  aria-disabled={paginaAtual <= 1}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-secondary)',
                    opacity: paginaAtual <= 1 ? 0.4 : 1,
                    pointerEvents: paginaAtual <= 1 ? 'none' : 'auto',
                  }}
                >
                  Anterior
                </Link>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {paginaAtual} de {totalPaginas}
                </span>
                <Link
                  href={paginaAtual < totalPaginas ? `/usuarios/${usuario.id}?page=${paginaAtual + 1}` : `/usuarios/${usuario.id}?page=${totalPaginas}`}
                  aria-disabled={paginaAtual >= totalPaginas}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-secondary)',
                    opacity: paginaAtual >= totalPaginas ? 0.4 : 1,
                    pointerEvents: paginaAtual >= totalPaginas ? 'none' : 'auto',
                  }}
                >
                  Próxima
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
