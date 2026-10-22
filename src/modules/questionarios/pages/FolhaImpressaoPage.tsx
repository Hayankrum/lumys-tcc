'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { obterQuestionario } from '../questionarios.actions'

interface QuestionarioData {
  id: number
  titulo: string
  descricao: string | null
  codigoAcesso: string | null
  status: string
  corTema: string | null
  autor: { id: number; nome: string }
}

interface Props {
  questionarioId: number
}

export default function FolhaImpressaoPage({ questionarioId }: Props) {
  const [questionario, setQuestionario] = useState<QuestionarioData | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState<string | null>(null)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/questionarios/${questionarioId}/responder`
    : ''

  useEffect(() => {
    if (!shareUrl) return
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(shareUrl, { width: 600, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        .then((dataUrl) => setQrCode(dataUrl))
    })

    obterQuestionario(questionarioId).then((result) => {
      if (result && 'questionario' in result && result.questionario) {
        setQuestionario(result.questionario as unknown as QuestionarioData)
      } else {
        setErro('Questionário não encontrado.')
      }
      setLoading(false)
    })
  }, [questionarioId, shareUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm animate-pulse" style={{ color: 'var(--text-tertiary)' }}>Carregando folha...</p>
      </div>
    )
  }

  if (erro || !questionario) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p style={{ color: 'var(--text-secondary)' }}>{erro ?? 'Questionário não encontrado.'}</p>
        <Link href="/" className="btn-primary">Voltar para o início</Link>
      </div>
    )
  }

  const geradoEm = new Date().toLocaleDateString('pt-BR')
  const descricaoCurta =
    questionario.descricao && questionario.descricao.length > 140
      ? `${questionario.descricao.slice(0, 140).trimEnd()}…`
      : questionario.descricao

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href={`/questionarios/${questionario.id}`} className="btn-secondary">
          Voltar
        </Link>
        <button onClick={() => window.print()} className="btn-primary">
          Imprimir
        </button>
      </div>

      <article
        className="flex flex-col gap-5 rounded-lg border border-neutral-200 bg-white p-6 text-black shadow-sm sm:p-8 print:gap-4 print:shadow-none"
        style={{ borderTopWidth: 6, borderTopColor: questionario.corTema || '#1B3A3A' }}
      >
        <header className="w-full text-center">
          <div className="flex items-center justify-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon1.svg"
              alt=""
              aria-hidden="true"
              className="h-10 w-10"
              style={{ filter: 'invert(1)' }}
            />
            <div className="text-left">
              <p className="text-base font-bold leading-none">Lumys</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                Questionário
              </p>
            </div>
          </div>

          <div className="mt-3 h-px w-full bg-neutral-200" />

          <h1 className="mt-3 text-xl font-bold break-words sm:text-2xl">{questionario.titulo}</h1>
          {descricaoCurta && (
            <p className="mx-auto mt-1 max-w-lg text-sm text-neutral-600">{descricaoCurta}</p>
          )}
        </header>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="shrink-0 rounded-lg border border-neutral-200 p-2">
            {qrCode ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrCode}
                alt={`QR Code do questionário ${questionario.titulo}`}
                className="h-36 w-36 sm:h-40 sm:w-40"
              />
            ) : (
              <div className="flex h-36 w-36 items-center justify-center text-sm text-neutral-400 sm:h-40 sm:w-40">
                Gerando QR Code...
              </div>
            )}
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-1">
            <div className="text-sm text-neutral-700">
              <p>
                <span className="font-semibold">1.</span> Escaneie o QR Code com a câmera do celular.
              </p>
              <p className="mt-1">
                <span className="font-semibold">2.</span> Ou acesse{' '}
                <span className="font-medium break-all">{shareUrl}</span>
              </p>
            </div>

            {questionario.codigoAcesso && (
              <div className="flex items-center gap-4 rounded-lg border-2 border-dashed border-neutral-300 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                    Código de acesso
                  </p>
                  <p className="mt-1 text-3xl font-bold leading-none tracking-[0.25em]">
                    {questionario.codigoAcesso}
                  </p>
                </div>
                <p className="text-[11px] leading-snug text-neutral-500">
                  digite-o também na
                  <br />
                  página inicial
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-neutral-100 pt-2 text-center text-[10px] text-neutral-400">
          {shareUrl.replace(/^https?:\/\//, '').split('/questionarios')[0]} • Gerado em {geradoEm}
        </footer>
      </article>
    </div>
  )
}
