export const MAX_DENUNCIAS = 5

export const MOTIVOS_DENUNCIA = [
  { valor: 'spam', label: 'Spam ou conteúdo publicitário' },
  { valor: 'conteudo_inadequado', label: 'Conteúdo inadequado ou ofensivo' },
  { valor: 'discurso_de_odio', label: 'Discurso de ódio' },
  { valor: 'outro', label: 'Outro motivo' },
]

export const MOTIVO_LABELS: Record<string, string> = {
  spam: 'Spam',
  conteudo_inadequado: 'Conteúdo inadequado',
  discurso_de_odio: 'Discurso de ódio',
  outro: 'Outro',
}