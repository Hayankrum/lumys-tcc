'use client'

import { useState } from 'react'

interface OpcaoData {
  texto: string
  ordem: number
  correta: boolean
}

interface CondicaoData {
  perguntaOrigemId: number
  tipoCondicao: 'igual' | 'diferente' | 'contem' | 'nao_contem'
  valor: string
}

interface PerguntaData {
  texto: string
  tipo: string
  obrigatoria: boolean
  ordem: number
  opcoes: OpcaoData[]
  configEscala?: { min: number; max: number; passo: number } | null
  condicoes?: CondicaoData[]
}

interface MetaData {
  titulo?: string
  descricao?: string
  encerraEm?: string
  anonimo?: boolean
  resultadosVisiveis?: boolean
  corTema?: string
  usuariosEsperados?: number
}

interface Props {
  onImport: (perguntas: PerguntaData[], meta?: MetaData) => void
}

const EXEMPLO_JSON = `{
  "titulo": "Titulo do Questionario",
  "descricao": "Descricao opcional do questionario",
  "encerraEm": "2026-12-31T23:59",
  "anonimo": false,
  "resultadosVisiveis": true,
  "corTema": "#6366f1",
  "usuariosEsperados": 50,
  "perguntas": [
    {
      "texto": "Texto da pergunta aqui",
      "tipo": "escala",
      "obrigatoria": true,
      "escala": { "min": 1, "max": 5, "passo": 1 }
    },
    {
      "texto": "Outra pergunta",
      "tipo": "escolha_unica",
      "obrigatoria": true,
      "opcoes": [
        { "texto": "Opcao 1", "correta": false },
        { "texto": "Opcao 2", "correta": true },
        { "texto": "Opcao 3", "correta": false }
      ]
    },
    {
      "texto": "Pergunta condicional",
      "tipo": "texto_longo",
      "obrigatoria": false,
      "condicoes": [
        {
          "perguntaOrigem": 2,
          "tipoCondicao": "igual",
          "valor": "Opcao 2"
        }
      ]
    },
    {
      "texto": "Pergunta de texto livre",
      "tipo": "texto_longo",
      "obrigatoria": false
    }
  ]
}`

export default function ImportarJson({ onImport }: Props) {
  const [aberto, setAberto] = useState(false)
  const [json, setJson] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [preview, setPreview] = useState<PerguntaData[] | null>(null)
  const [meta, setMeta] = useState<MetaData | null>(null)

  const TIPOS_MAP: Record<string, string> = {
    texto_curto: 'texto_curto',
    texto_longo: 'texto_longo',
    escolha_unica: 'escolha_unica',
    multipla_escolha: 'multipla_escolha',
    escala: 'escala',
    curto: 'texto_curto',
    longo: 'texto_longo',
    unica: 'escolha_unica',
    multipla: 'multipla_escolha',
  }

  const CONDICOES_TIPO_MAP: Record<string, string> = {
    igual: 'igual',
    equal: 'igual',
    diferente: 'diferente',
    different: 'diferente',
    contem: 'contem',
    contains: 'contem',
    nao_contem: 'nao_contem',
    not_contains: 'nao_contem',
    does_not_contain: 'nao_contem',
  }

  function validarEConverter(): boolean {
    setErro(null)
    setPreview(null)
    setMeta(null)

    try {
      const dados = JSON.parse(json)

      const novaMeta: MetaData = {}
      if (dados.titulo) novaMeta.titulo = dados.titulo
      if (dados.descricao) novaMeta.descricao = dados.descricao
      if (dados.encerraEm) novaMeta.encerraEm = dados.encerraEm
      if (dados.anonimo !== undefined) novaMeta.anonimo = !!dados.anonimo
      if (dados.resultadosVisiveis !== undefined) novaMeta.resultadosVisiveis = !!dados.resultadosVisiveis
      if (dados.corTema) novaMeta.corTema = dados.corTema
      if (dados.usuariosEsperados) novaMeta.usuariosEsperados = Number(dados.usuariosEsperados)
      if (Object.keys(novaMeta).length > 0) setMeta(novaMeta)

      const perguntasRaw = dados.perguntas || dados.questions || dados

      if (!Array.isArray(perguntasRaw)) {
        setErro('JSON deve conter um array de perguntas (campo "perguntas")')
        return false
      }

      if (perguntasRaw.length === 0) {
        setErro('O array de perguntas está vazio')
        return false
      }

      const perguntasConvertidas: PerguntaData[] = perguntasRaw.map((p: Record<string, unknown>, idx: number) => {
        const texto = (p.texto || p.text || p.question || p.pergunta || '') as string
        const tipoRaw = (p.tipo || p.type || 'texto_curto') as string
        const tipo = TIPOS_MAP[tipoRaw.toLowerCase()] || 'texto_curto'
        const obrigatoria = p.obrigatoria !== undefined ? !!p.obrigatoria : p.required !== undefined ? !!p.required : false
        const opcoesRaw = p.opcoes || p.options || []
        const escalaRaw = p.escala || p.scale || p.configEscala || null

        let configEscala: { min: number; max: number; passo: number } | null = null
        if (escalaRaw && typeof escalaRaw === 'object' && 'min' in escalaRaw && 'max' in escalaRaw) {
          const e = escalaRaw as Record<string, number>
          configEscala = {
            min: e.min ?? 1,
            max: e.max ?? 5,
            passo: e.passo ?? 1,
          }
        }

        const opcoes: OpcaoData[] = Array.isArray(opcoesRaw)
          ? opcoesRaw.map((o: string | { texto?: string; text?: string; correta?: boolean }, oIdx: number) => ({
              texto: typeof o === 'string' ? o : (o.texto || o.text || ''),
              ordem: oIdx + 1,
              correta: typeof o === 'object' && o.correta === true,
            }))
          : []

        const condicoesRaw = p.condicoes || p.conditions || []
        const condicoes: CondicaoData[] = Array.isArray(condicoesRaw)
          ? condicoesRaw.map((c: Record<string, unknown>) => {
              const perguntaOrigem = (c.perguntaOrigem || c.perguntaOrigemId || c.from || c.questionIndex || 0) as number
              const tipoCondicaoRaw = (c.tipoCondicao || c.type || c.operator || 'igual') as string
              const tipoCondicao = (CONDICOES_TIPO_MAP[tipoCondicaoRaw.toLowerCase()] || 'igual') as CondicaoData['tipoCondicao']
              const valor = (c.valor || c.value || '') as string

              return {
                perguntaOrigemId: typeof perguntaOrigem === 'number' ? perguntaOrigem : parseInt(String(perguntaOrigem), 10) || 1,
                tipoCondicao,
                valor,
              }
            })
          : []

        return {
          texto,
          tipo,
          obrigatoria,
          ordem: idx + 1,
          opcoes,
          configEscala,
          condicoes: condicoes.length > 0 ? condicoes : undefined,
        }
      })

      const invalida = perguntasConvertidas.find((p) => !p.texto)
      if (invalida) {
        setErro('Todas as perguntas devem ter um texto')
        return false
      }

      const tipoInvalido = perguntasConvertidas.find(
        (p) => !['texto_curto', 'texto_longo', 'escolha_unica', 'multipla_escolha', 'escala'].includes(p.tipo)
      )
      if (tipoInvalido) {
        setErro(`Tipo inválido: "${tipoInvalido.tipo}". Use: texto_curto, texto_longo, escolha_unica, multipla_escolha, escala`)
        return false
      }

      const escalaInvalida = perguntasConvertidas.find(
        (p) => p.tipo === 'escala' && (!p.configEscala || typeof p.configEscala !== 'object')
      )
      if (escalaInvalida) {
        setErro(`Pergunta de escala "${escalaInvalida.texto}" precisa de configuração: "escala": {"min": 1, "max": 5, "passo": 1}`)
        return false
      }

      const escolhaInvalida = perguntasConvertidas.find(
        (p) =>
          (p.tipo === 'escolha_unica' || p.tipo === 'multipla_escolha') &&
          p.opcoes.length < 2
      )
      if (escolhaInvalida) {
        setErro(`Pergunta "${escolhaInvalida.texto}" precisa de pelo menos 2 opções`)
        return false
      }

      setPreview(perguntasConvertidas)
      return true
    } catch (e) {
      setErro(`JSON inválido: ${e instanceof Error ? e.message : 'formato incorreto'}`)
      return false
    }
  }

  function handleImportar() {
    if (!preview) return
    onImport(preview, meta || undefined)
    setAberto(false)
    setJson('')
    setPreview(null)
    setMeta(null)
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="btn-secondary"
      >
        Importar perguntas
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-lg overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Importar perguntas via JSON</h3>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Cole um JSON com as perguntas. Clique em &quot;Carregar exemplo&quot; para ver o formato aceito.
          </p>
          <button
            type="button"
            onClick={() => { setAberto(false); setJson(''); setPreview(null); setErro(null) }}
            className="btn-icon"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
          {!preview ? (
            <>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setJson(EXEMPLO_JSON)}
                  className="btn-ghost !text-xs"
                >
                  Carregar exemplo
                </button>
              </div>

              <textarea
                value={json}
                onChange={(e) => setJson(e.target.value)}
                placeholder={EXEMPLO_JSON}
                rows={16}
                className="w-full rounded-lg px-4 py-3 text-sm font-mono focus:outline-none resize-none"
                style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
                spellCheck={false}
              />

              {erro && (
                <div className="alert-error" role="alert">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {erro}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setAberto(false); setJson(''); setErro(null) }}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={validarEConverter}
                  className="btn-primary"
                >
                  Validar e visualizar
                </button>
              </div>
            </>
          ) : (
            <>
              {meta && (
                <div className="p-3 rounded-lg text-sm flex flex-col gap-1" style={{ backgroundColor: 'var(--card-bg)' }}>
                  {meta.titulo && <p style={{ color: 'var(--text-primary)' }}><strong>Título:</strong> {meta.titulo}</p>}
                  {meta.descricao && <p style={{ color: 'var(--text-secondary)' }}><strong>Descrição:</strong> {meta.descricao}</p>}
                  {meta.encerraEm && <p style={{ color: 'var(--text-secondary)' }}><strong>Encerra em:</strong> {new Date(meta.encerraEm).toLocaleString('pt-BR')}</p>}
                  {meta.anonimo !== undefined && <p style={{ color: 'var(--text-secondary)' }}><strong>Anônimo:</strong> {meta.anonimo ? 'Sim' : 'Não'}</p>}
                  {meta.resultadosVisiveis !== undefined && <p style={{ color: 'var(--text-secondary)' }}><strong>Resultados visíveis:</strong> {meta.resultadosVisiveis ? 'Sim' : 'Não'}</p>}
                  {meta.corTema && (
                    <p className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <strong>Cor do tema:</strong>
                      <span className="w-4 h-4 rounded inline-block" style={{ backgroundColor: meta.corTema }} />
                      {meta.corTema}
                    </p>
                  )}
                  {meta.usuariosEsperados && <p style={{ color: 'var(--text-secondary)' }}><strong>Respostas esperadas:</strong> {meta.usuariosEsperados}</p>}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {preview.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg text-sm flex items-start gap-3"
                    style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                  >
                    <span className="font-medium" style={{ color: 'var(--text-tertiary)' }}>{idx + 1}.</span>
                    <div className="flex-1">
                      <p style={{ color: 'var(--text-primary)' }}>
                        {p.texto}
                        {p.obrigatoria && <span style={{ color: '#f87171' }}> *</span>}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {p.tipo}
                        {p.tipo === 'escala' && p.configEscala && ` (${p.configEscala.min} - ${p.configEscala.max})`}
                        {p.opcoes.length > 0 && ` — ${p.opcoes.map((o) => o.texto).join(', ')}`}
                        {p.opcoes.some((o) => o.correta) && ` ✓`}
                      </p>
                      {p.condicoes && p.condicoes.length > 0 && (
                        <p className="text-xs mt-1" style={{ color: '#a855f7' }}>
                          Condição: {p.condicoes.map((c) => {
                            const perguntaIdx = c.perguntaOrigemId - 1
                            const perguntaTexto = preview[perguntaIdx]?.texto || `#${c.perguntaOrigemId}`
                            return `se "${perguntaTexto}" ${c.tipoCondicao} "${c.valor}"`
                          }).join(' e ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setPreview(null); setMeta(null) }}
                  className="btn-ghost"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={handleImportar}
                  className="btn-primary"
                >
                  Importar {preview.length} {preview.length === 1 ? 'pergunta' : 'perguntas'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
