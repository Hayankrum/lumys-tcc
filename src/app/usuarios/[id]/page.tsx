import UsuarioDetailPage from '@/modules/usuarios/pages/UsuarioDetailPage'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params
  const { page } = await searchParams
  return <UsuarioDetailPage id={Number(id)} page={page ? Number(page) : 1} />
}