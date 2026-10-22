import FolhaImpressaoPage from '@/modules/questionarios/pages/FolhaImpressaoPage'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata() {
  return { title: 'Lumys' }
}

export default async function Page({ params }: Props) {
  const { id } = await params
  return <FolhaImpressaoPage questionarioId={Number(id)} />
}
