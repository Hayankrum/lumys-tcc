import { obterSessao } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MAX_DENUNCIAS, MOTIVO_LABELS } from '@/modules/questionarios/denuncias.constants'
import DeletarDenunciado from './DeletarDenunciado'

export const metadata = {
  title: 'Denúncias - Admin',
}

function formatarData(data: Date) {
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function AdminDenunciasPage() {
  const usuario = await obterSessao()
  if (!usuario || !usuario.isAdmin) redirect('/')

  const questionarios = await prisma.questionario.findMany({
    where: { denuncias: { some: {} } },
    select: {
      id: true,
      titulo: true,
      status: true,
      criadoEm: true,
      autor: { select: { nome: true } },
      denuncias: {
        select: { motivo: true, detalhes: true, criadaEm: true },
        orderBy: { criadaEm: 'desc' },
      },
      _count: { select: { denuncias: true } },
    },
    orderBy: { criadoEm: 'desc' },
  })

  const totalDenuncias = questionarios.reduce((acc, q) => acc + q._count.denuncias, 0)

  const statusLabels: Record<string, string> = {
    rascunho: 'Rascunho',
    publicado: 'Publicado',
    encerrado: 'Encerrado',
  }

  const statusColors: Record<string, string> = {
    rascunho: 'var(--text-tertiary)',
    publicado: '#22c55e',
    encerrado: '#f59e0b',
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div>
          <a
            href="/admin"
            className="inline-flex items-center gap-1 text-xs mb-3 hover:underline"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Voltar
          </a>
          <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Denúncias
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            {questionarios.length} questionários com denúncia · {totalDenuncias} denúncias no total · remoção automática ao atingir {MAX_DENUNCIAS}
          </p>
        </div>

        {questionarios.length === 0 ? (
          <div
            className="rounded-lg p-8 text-center"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Nenhuma denúncia registrada.</p>
          </div>
        ) : (
          <div className="card overflow-x-auto" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--input-border)' }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--input-border)' }}>
                  <th className="py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Título</th>
                  <th className="py-3 px-3 text-xs font-semibold hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>Autor</th>
                  <th className="py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Denúncias</th>
                  <th className="py-3 px-3 text-xs font-semibold hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>Última denúncia</th>
                  <th className="py-3 px-3 text-xs font-semibold hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>Status</th>
                  <th className="py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {questionarios.map((q) => {
                  const ultima = q.denuncias[0]
                  const percentual = Math.min(100, Math.round((q._count.denuncias / MAX_DENUNCIAS) * 100))
                  const alta = q._count.denuncias >= 3
                  return (
                    <tr key={q.id} className="border-b last:border-0" style={{ borderColor: 'var(--input-border)' }}>
                      <td className="py-3 px-3">
                        <a
                          href={`/questionarios/${q.id}`}
                          className="text-xs font-medium hover:underline"
                          style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                        >
                          {q.titulo}
                        </a>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                          {MOTIVO_LABELS[ultima.motivo] || ultima.motivo}
                          {ultima.detalhes ? ` · ${ultima.detalhes}` : ''}
                        </p>
                      </td>
                      <td className="py-3 px-3 hidden sm:table-cell">
                        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{q.autor.nome}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 min-w-[90px]">
                          <span className="text-xs font-medium" style={{ color: alta ? '#f87171' : 'var(--text-primary)' }}>
                            {q._count.denuncias}/{MAX_DENUNCIAS}
                          </span>
                          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--input-bg)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${percentual}%`, backgroundColor: alta ? '#f87171' : '#f59e0b' }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{formatarData(ultima.criadaEm)}</span>
                      </td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ backgroundColor: `${statusColors[q.status]}20`, color: statusColors[q.status] }}>
                          {statusLabels[q.status] || q.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <DeletarDenunciado questionarioId={q.id} titulo={q.titulo} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}