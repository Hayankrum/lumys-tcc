'use client'

interface ResultadoItem {
  perguntaId: number
  texto: string
  tipo: string
  totalRespostas: number
  distribuicao?: {
    opcaoId: number
    texto: string
    count: number
    percentual: number
  }[]
  media?: number
  min?: number
  max?: number
}

interface Respondente {
  id: number
  nome: string
  criadoEm: string
  valores: {
    perguntaId: number
    texto: string | null
    opcaoId: number | null
    opcao: string | null
    valorNumerico: number | null
  }[]
}

interface Props {
  titulo: string
  resultados: ResultadoItem[]
  totalRespostas: number
  respondentes?: Respondente[]
}

function esc(valor: string | number | undefined | null): string {
  return `"${String(valor ?? '').replace(/"/g, '""')}"`
}

function valorDoRespondente(resp: Respondente, resultado: ResultadoItem): string {
  const valores = resp.valores.filter((v) => v.perguntaId === resultado.perguntaId)
  if (resultado.tipo === 'multipla_escolha') {
    return valores.filter((v) => v.opcao).map((v) => v.opcao).join('; ')
  }
  if (resultado.tipo === 'escolha_unica') {
    return valores.find((v) => v.opcao)?.opcao ?? ''
  }
  if (resultado.tipo === 'escala') {
    return String(valores.find((v) => v.valorNumerico != null)?.valorNumerico ?? '')
  }
  return valores
    .map((v) => v.texto || '')
    .filter(Boolean)
    .join('; ')
}

export default function ExportarCSV({ titulo, resultados, totalRespostas, respondentes }: Props) {
  function gerarCSV() {
    const linhas: string[] = []

    // ---------- Cabeçalho ----------
    linhas.push(['Questionário', titulo].map(esc).join(';'))
    linhas.push(['Total de Respostas', totalRespostas].map(esc).join(';'))
    linhas.push('')

    // ---------- Resumo por pergunta ----------
    linhas.push(['Pergunta', 'Tipo', 'Resposta / Opção', 'Quantidade', 'Percentual'].map(esc).join(';'))
    for (const r of resultados) {
      if (r.distribuicao) {
        for (const opcao of r.distribuicao) {
          linhas.push([r.texto, r.tipo, opcao.texto, opcao.count, `${opcao.percentual}%`].map(esc).join(';'))
        }
      } else if (r.media !== undefined) {
        linhas.push([r.texto, r.tipo, 'Média', r.media, `min ${r.min ?? '-'} / max ${r.max ?? '-'}`].map(esc).join(';'))
      } else {
        linhas.push([r.texto, r.tipo, 'Respostas textuais', r.totalRespostas, ''].map(esc).join(';'))
      }
    }
    linhas.push('')

    // ---------- Respostas individuais (uma linha por respondente) ----------
    const colunas = ['Respondente', 'Data', ...resultados.map((r) => r.texto)]
    linhas.push(colunas.map(esc).join(';'))

    for (const resp of respondentes ?? []) {
      const linha = [resp.nome, new Date(resp.criadoEm).toLocaleDateString('pt-BR')]
      for (const resultado of resultados) {
        linha.push(valorDoRespondente(resp, resultado))
      }
      linhas.push(linha.map(esc).join(';'))
    }

    return linhas.join('\n')
  }

  function downloadCSV() {
    const csv = gerarCSV()
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `resultados-${titulo.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={downloadCSV}
      className="btn-secondary"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Exportar resultados (.csv)
    </button>
  )
}