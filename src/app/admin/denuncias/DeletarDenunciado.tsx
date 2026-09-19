'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletarQuestionarioAdmin } from '@/modules/questionarios/denuncias.actions'

interface Props {
  questionarioId: number
  titulo: string
}

export default function DeletarDenunciado({ questionarioId, titulo }: Props) {
  const router = useRouter()
  const [processando, setProcessando] = useState(false)

  async function handleDeletar() {
    if (!confirm(`Remover o questionário "${titulo}"?`)) return
    setProcessando(true)

    const result = await deletarQuestionarioAdmin(questionarioId)
    if (result?.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
    setProcessando(false)
  }

  return (
    <button
      onClick={handleDeletar}
      disabled={processando}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors hover:underline"
      style={{ backgroundColor: '#f8717120', color: '#f87171' }}
    >
      {processando ? 'Removendo...' : 'Remover'}
    </button>
  )
}