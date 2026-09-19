import { obterSessao } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata = {
  title: 'Painel Admin',
}

function formatarData(data: Date) {
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function AdminPage() {
  const usuario = await obterSessao()
  if (!usuario || !usuario.isAdmin) redirect('/')

  const [totalUsuarios, totalQuestionarios, totalRespostas, totalDenuncias, ultimosUsuarios, ultimosQuestionarios] = await Promise.all([
    prisma.usuario.count(),
    prisma.questionario.count(),
    prisma.resposta.count(),
    prisma.questionario.count({ where: { denuncias: { some: {} } } }),
    prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, criadoEm: true },
      orderBy: { criadoEm: 'desc' },
      take: 5,
    }),
    prisma.questionario.findMany({
      select: {
        id: true,
        titulo: true,
        status: true,
        criadoEm: true,
        autor: { select: { nome: true } },
        _count: { select: { respostas: true } },
      },
      orderBy: { criadoEm: 'desc' },
      take: 5,
    }),
  ])

  const statusColors: Record<string, string> = {
    rascunho: 'var(--text-tertiary)',
    publicado: '#22c55e',
    encerrado: '#f59e0b',
  }

  const statusLabels: Record<string, string> = {
    rascunho: 'Rascunho',
    publicado: 'Publicado',
    encerrado: 'Encerrado',
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <header>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Painel Administrativo
          </h1>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Usuários', value: totalUsuarios, href: '/admin/usuarios' },
            { label: 'Questionários', value: totalQuestionarios, href: '/admin/questionarios' },
            { label: 'Respostas', value: totalRespostas, href: '/admin/questionarios' },
            { label: 'Denúncias', value: totalDenuncias, href: '/admin/denuncias' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="p-3 rounded-xl border text-center transition-colors hover:border-[var(--btn-primary-bg)]"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--input-border)', textDecoration: 'none' }}
            >
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{item.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--input-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Últimos Usuários</h3>
              <Link href="/admin/usuarios" className="text-[11px] hover:underline" style={{ color: 'var(--btn-primary-bg)' }}>Ver todos</Link>
            </div>
            <div className="space-y-1">
              {ultimosUsuarios.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--input-border)' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      {u.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.nome}</p>
                    </div>
                  </div>
                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{formatarData(u.criadoEm)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--input-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Últimos Questionários</h3>
              <Link href="/admin/questionarios" className="text-[11px] hover:underline" style={{ color: 'var(--btn-primary-bg)' }}>Ver todos</Link>
            </div>
            <div className="space-y-1">
              {ultimosQuestionarios.map((q) => (
                <div key={q.id} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--input-border)' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{q.titulo}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{q.autor.nome}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${statusColors[q.status]}20`, color: statusColors[q.status] }}>
                      {statusLabels[q.status]}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{q._count.respostas}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
