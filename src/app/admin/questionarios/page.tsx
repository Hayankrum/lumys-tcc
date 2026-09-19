import { obterSessao } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Paginacao from '@/components/Paginacao'

export const metadata = {
  title: 'Questionários - Admin',
}

const POR_PAGINA = 10

function formatarData(data: Date) {
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function AdminQuestionariosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const usuario = await obterSessao()
  if (!usuario || !usuario.isAdmin) redirect('/')

  const params = await searchParams
  const pagina = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const [questionarios, total] = await Promise.all([
    prisma.questionario.findMany({
      select: {
        id: true,
        titulo: true,
        status: true,
        criadoEm: true,
        autor: { select: { nome: true } },
        _count: { select: { respostas: true, perguntas: true } },
      },
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.questionario.count(),
  ])

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)

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
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs mb-3 hover:underline"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Voltar
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Questionários
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            {total} questionários cadastrados
          </p>
        </div>

        <div className="card overflow-x-auto" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--input-border)' }}>
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--input-border)' }}>
                <th className="py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Título</th>
                <th className="py-3 px-3 text-xs font-semibold hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>Autor</th>
                <th className="py-3 px-3 text-xs font-semibold hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>Perguntas</th>
                <th className="py-3 px-3 text-xs font-semibold hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>Respostas</th>
                <th className="py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
                <th className="py-3 px-3 text-xs font-semibold hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {questionarios.map((q) => (
                <tr
                  key={q.id}
                  className="border-b last:border-0"
                  style={{ borderColor: 'var(--input-border)' }}
                >
                  <td className="py-3 px-3">
                    <Link
                      href={`/questionarios/${q.id}`}
                      className="text-xs font-medium hover:underline"
                      style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                    >
                      {q.titulo}
                    </Link>
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell">
                    <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      {q.autor.nome}
                    </span>
                  </td>
                  <td className="py-3 px-3 hidden md:table-cell">
                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                      {q._count.perguntas}
                    </span>
                  </td>
                  <td className="py-3 px-3 hidden md:table-cell">
                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                      {q._count.respostas}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${statusColors[q.status]}20`, color: statusColors[q.status] }}
                    >
                      {statusLabels[q.status] || q.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 hidden lg:table-cell">
                    <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                      {formatarData(q.criadoEm)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <Paginacao
            pagina={paginaAtual}
            totalPaginas={totalPaginas}
            baseUrl="/admin/questionarios?page="
          />
        )}
      </div>
    </div>
  )
}