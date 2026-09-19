import { obterSessao } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Paginacao from '@/components/Paginacao'
import DeletarUsuario from './DeletarUsuario'

export const metadata = {
  title: 'Gerenciar Usuários - Admin',
}

const POR_PAGINA = 10

function formatarData(data: Date) {
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const usuario = await obterSessao()
  if (!usuario || !usuario.isAdmin) redirect('/')

  const params = await searchParams
  const pagina = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const [usuarios, total] = await Promise.all([
    prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        tipoUsuario: true,
        isAdmin: true,
        criadoEm: true,
        _count: { select: { questionarios: true, respostasQuestionario: true } },
      },
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.usuario.count(),
  ])

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)

  const tipoLabels: Record<string, string> = {
    discente: 'Discente',
    docente: 'Docente',
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
            Usuários
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            {total} usuários cadastrados
          </p>
        </div>

        <div className="card overflow-x-auto" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--input-border)' }}>
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--input-border)' }}>
                <th className="py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Usuário</th>
                <th className="py-3 px-3 text-xs font-semibold hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>Tipo</th>
                <th className="py-3 px-3 text-xs font-semibold hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>Questionários</th>
                <th className="py-3 px-3 text-xs font-semibold hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>Respostas</th>
                <th className="py-3 px-3 text-xs font-semibold hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>Cadastro</th>
                <th className="py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Admin</th>
                <th className="py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr
                  key={u.id}
                  className="border-b last:border-0"
                  style={{ borderColor: 'var(--input-border)' }}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                      >
                        {u.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {u.nome}
                        </p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell">
                    <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      {tipoLabels[u.tipoUsuario] || u.tipoUsuario}
                    </span>
                  </td>
                  <td className="py-3 px-3 hidden md:table-cell">
                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                      {u._count.questionarios}
                    </span>
                  </td>
                  <td className="py-3 px-3 hidden md:table-cell">
                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                      {u._count.respostasQuestionario}
                    </span>
                  </td>
                  <td className="py-3 px-3 hidden lg:table-cell">
                    <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                      {formatarData(u.criadoEm)}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {u.isAdmin ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}>
                        Admin
                      </span>
                    ) : (
                      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        —
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <DeletarUsuario usuarioId={u.id} nome={u.nome} email={u.email} />
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
            baseUrl="/admin/usuarios?page="
          />
        )}
      </div>
    </div>
  )
}