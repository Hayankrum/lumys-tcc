'use client'

import { useState, type ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { criarQuestionario, editarQuestionario } from '../questionarios.actions'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { addPendingMutation } from '@/lib/db'
import ImportarJson from './ImportarJson'
import PreviewQuestionario from './PreviewQuestionario'
import CondicoesPergunta from './CondicoesPergunta'

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

interface QuestionarioExistente {
  id: number
  titulo: string
  descricao: string | null
  encerraEm?: Date | string | null
  corTema?: string
  usuariosEsperados?: number | null
  anonimo?: boolean
  resultadosVisiveis?: boolean
  perguntas: {
    id: number
    texto: string
    tipo: string
    obrigatoria: boolean
    ordem: number
    opcoes: { id: number; texto: string; ordem: number; correta: boolean }[]
    configEscala: { min: number; max: number; passo: number } | null
  }[]
}

interface Props {
  questionario?: QuestionarioExistente
}

const TIPOS = [
  { valor: 'texto_curto', label: 'Texto Curto' },
  { valor: 'texto_longo', label: 'Texto Longo' },
  { valor: 'escolha_unica', label: 'Escolha Única' },
  { valor: 'multipla_escolha', label: 'Múltipla Escolha' },
  { valor: 'escala', label: 'Escala' },
]

const TIPOS_LABELS: Record<string, string> = {
  texto_curto: 'Texto Curto',
  texto_longo: 'Texto Longo',
  escolha_unica: 'Escolha Única',
  multipla_escolha: 'Múltipla Escolha',
  escala: 'Escala',
}

const TIPO_ICONS: Record<string, ReactElement> = {
  texto_curto: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7"/>
      <line x1="9" y1="20" x2="15" y2="20"/>
      <line x1="12" y1="4" x2="12" y2="20"/>
    </svg>
  ),
  texto_longo: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16"/>
      <path d="M4 12h16"/>
      <path d="M4 18h10"/>
    </svg>
  ),
  escolha_unica: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  multipla_escolha: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  escala: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10"/>
      <line x1="18" y1="20" x2="18" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="16"/>
    </svg>
  ),
}

function UnidadeIcon({ icon, label }: { icon: ReactElement; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap"
      style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-secondary)' }}
      title={label}
    >
      {icon}
      {label}
    </span>
  )
}

interface SortablePerguntaProps {
  idx: number
  pergunta: PerguntaData
  perguntas: PerguntaData[]
  onUpdate: (index: number, campo: keyof PerguntaData, valor: unknown) => void
  onRemove: (index: number) => void
  onAddOption: (indexPergunta: number) => void
  onRemoveOption: (indexPergunta: number, indexOpcao: number) => void
  onUpdateOption: (indexPergunta: number, indexOpcao: number, texto: string) => void
  onToggleCorreta: (indexPergunta: number, indexOpcao: number) => void
  total: number
}

function SortablePergunta({
  idx,
  pergunta,
  perguntas,
  onUpdate,
  onRemove,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onToggleCorreta,
  total,
}: SortablePerguntaProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: idx })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-1 touch-none"
            {...attributes}
            {...listeners}
            style={{ color: 'var(--text-tertiary)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="6" r="1" />
              <circle cx="15" cy="6" r="1" />
              <circle cx="9" cy="12" r="1" />
              <circle cx="15" cy="12" r="1" />
              <circle cx="9" cy="18" r="1" />
              <circle cx="15" cy="18" r="1" />
            </svg>
          </button>
          <span
            className="flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold shrink-0"
            style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-primary)' }}
          >
            {idx + 1}
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Pergunta {idx + 1} de {total}
          </span>
          <UnidadeIcon icon={TIPO_ICONS[pergunta.tipo]} label={TIPOS_LABELS[pergunta.tipo] || pergunta.tipo} />
          {pergunta.obrigatoria && (
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap"
              style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
            >
              Obrigatória
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="btn-icon !text-red-400 hover:!bg-red-500/10"
          title="Remover pergunta"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>

      <input
        type="text"
        value={pergunta.texto}
        onChange={(e) => onUpdate(idx, 'texto', e.target.value)}
        placeholder="Escreva sua pergunta aqui..."
        className="input !rounded-lg !text-base"
      />

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Tipo de resposta</label>
          <select
            value={pergunta.tipo}
            onChange={(e) => onUpdate(idx, 'tipo', e.target.value)}
            className="input !rounded-lg"
          >
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>{t.label}</option>
            ))}
          </select>
        </div>

        <label
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer select-none"
          style={{ backgroundColor: pergunta.obrigatoria ? 'var(--accent-dim)' : 'var(--input-bg)', border: '1px solid var(--input-border)' }}
        >
          <input
            type="checkbox"
            checked={pergunta.obrigatoria}
            onChange={(e) => onUpdate(idx, 'obrigatoria', e.target.checked)}
            className="accent-[var(--btn-primary-bg)]"
          />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Obrigatória
          </span>
        </label>
      </div>

      {(pergunta.tipo === 'escolha_unica' || pergunta.tipo === 'multipla_escolha') && (
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Opções</span>
          </div>
          {pergunta.opcoes.map((opcao, oIdx) => (
            <div key={oIdx} className="flex items-center gap-2">
              <span
                className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold shrink-0"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: opcao.correta ? '#16a34a' : 'var(--text-tertiary)' }}
              >
                {oIdx + 1}
              </span>
              <input
                type="text"
                value={opcao.texto}
                onChange={(e) => onUpdateOption(idx, oIdx, e.target.value)}
                placeholder={`Opção ${oIdx + 1}`}
                className="input !rounded-lg !py-1.5"
              />
              <label
                className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap px-2 py-1 rounded-md cursor-pointer select-none shrink-0"
                style={{
                  backgroundColor: opcao.correta ? 'rgba(22,163,74,0.12)' : 'transparent',
                  color: opcao.correta ? '#16a34a' : 'var(--text-tertiary)',
                }}
              >
                <input
                  type="checkbox"
                  checked={opcao.correta}
                  onChange={() => onToggleCorreta(idx, oIdx)}
                  className="accent-green-600"
                />
                Correta
              </label>
              {pergunta.opcoes.length > 2 && (
                <button
                  type="button"
                  onClick={() => onRemoveOption(idx, oIdx)}
                  className="btn-icon shrink-0"
                  style={{ color: '#f87171' }}
                  title="Remover opção"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
          {pergunta.opcoes.length < 10 && (
            <button
              type="button"
              onClick={() => onAddOption(idx)}
              className="btn-ghost !px-2 !py-1 self-start mt-1"
            >
              + Adicionar opção
            </button>
          )}
        </div>
      )}

      {pergunta.tipo === 'escala' && pergunta.configEscala && (
        <div className="flex flex-wrap items-center gap-4 mt-1">
          {(['min', 'max', 'passo'] as const).map((campo) => (
            <div key={campo} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium capitalize" style={{ color: 'var(--text-tertiary)' }}>
                {campo}
              </label>
              <input
                type="number"
                value={pergunta.configEscala![campo]}
                onChange={(e) =>
                  onUpdate(idx, 'configEscala', {
                    ...pergunta.configEscala!,
                    [campo]: Number(e.target.value),
                  })
                }
                className="input !rounded-lg !w-20"
              />
            </div>
          ))}
        </div>
      )}

      <CondicoesPergunta
        perguntas={perguntas}
        perguntaAtual={idx}
        condicoes={pergunta.condicoes || []}
        onChange={(condicoes) => onUpdate(idx, 'condicoes', condicoes)}
      />
    </div>
  )
}

export default function FormQuestionario({ questionario }: Props) {
  const router = useRouter()
  const isOnline = useOnlineStatus()
  const [titulo, setTitulo] = useState(questionario?.titulo || '')
  const [descricao, setDescricao] = useState(questionario?.descricao || '')
  const [perguntas, setPerguntas] = useState<PerguntaData[]>(
    questionario?.perguntas.map((p) => ({
      texto: p.texto,
      tipo: p.tipo,
      obrigatoria: p.obrigatoria,
      ordem: p.ordem,
      opcoes: p.opcoes.map((o, i) => ({ texto: o.texto, ordem: o.ordem ?? i + 1, correta: o.correta ?? false })),
      configEscala: p.configEscala || null,
    })) || []
  )
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [enfileirado, setEnfileirado] = useState(false)
  const [mostrarPreview, setMostrarPreview] = useState(false)
  const [encerraEm, setEncerraEm] = useState<string>(
    questionario?.encerraEm ? new Date(questionario.encerraEm).toISOString().slice(0, 16) : ''
  )
  const [corTema, setCorTema] = useState(questionario?.corTema || '#6366f1')
  const [usuariosEsperados, setUsuariosEsperados] = useState<string>(questionario?.usuariosEsperados?.toString() || '')
  const [anonimo, setAnonimo] = useState(questionario?.anonimo ?? true)
  const [resultadosVisiveis, setResultadosVisiveis] = useState(questionario?.resultadosVisiveis ?? true)

  const isEdicao = !!questionario

  function adicionarPergunta() {
    setPerguntas([
      ...perguntas,
      {
        texto: '',
        tipo: 'texto_curto',
        obrigatoria: false,
        ordem: perguntas.length + 1,
        opcoes: [],
        configEscala: null,
      },
    ])
  }

  function removerPergunta(index: number) {
    const novas = perguntas.filter((_, i) => i !== index)
    novas.forEach((p, i) => (p.ordem = i + 1))
    setPerguntas(novas)
  }

  function atualizarPergunta(index: number, campo: keyof PerguntaData, valor: unknown) {
    const novas = [...perguntas]
    novas[index] = { ...novas[index], [campo]: valor }

    if (campo === 'tipo') {
      if (valor === 'escolha_unica' || valor === 'multipla_escolha') {
        if (novas[index].opcoes.length < 2) {
          novas[index].opcoes = [{ texto: '', ordem: 1, correta: false }, { texto: '', ordem: 2, correta: false }]
        }
      } else {
        novas[index].opcoes = []
      }
      if (valor === 'escala' && !novas[index].configEscala) {
        novas[index].configEscala = { min: 1, max: 5, passo: 1 }
      }
      if (valor !== 'escala') {
        novas[index].configEscala = null
      }
    }

    setPerguntas(novas)
  }

  function adicionarOpcao(indexPergunta: number) {
    const novas = [...perguntas]
    novas[indexPergunta].opcoes.push({ texto: '', ordem: novas[indexPergunta].opcoes.length + 1, correta: false })
    setPerguntas(novas)
  }

  function removerOpcao(indexPergunta: number, indexOpcao: number) {
    const novas = [...perguntas]
    novas[indexPergunta].opcoes = novas[indexPergunta].opcoes.filter((_, i) => i !== indexOpcao)
    setPerguntas(novas)
  }

  function atualizarOpcao(indexPergunta: number, indexOpcao: number, texto: string) {
    const novas = [...perguntas]
    novas[indexPergunta].opcoes[indexOpcao] = { ...novas[indexPergunta].opcoes[indexOpcao], texto, ordem: indexOpcao + 1 }
    setPerguntas(novas)
  }

  function toggleCorreta(indexPergunta: number, indexOpcao: number) {
    const novas = [...perguntas]
    const opcao = novas[indexPergunta].opcoes[indexOpcao]
    novas[indexPergunta].opcoes[indexOpcao] = { ...opcao, correta: !opcao.correta }
    setPerguntas(novas)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active.id !== over?.id) {
      setPerguntas((items) => {
        const oldIndex = active.id as number
        const newIndex = over!.id as number
        const novas = arrayMove(items, oldIndex, newIndex)
        novas.forEach((p, i) => (p.ordem = i + 1))
        return novas
      })
    }
  }

  function handleImportarJson(novasPerguntas: PerguntaData[], meta?: { titulo?: string; descricao?: string; encerraEm?: string; anonimo?: boolean; resultadosVisiveis?: boolean; corTema?: string; usuariosEsperados?: number }) {
    setPerguntas((prev) => {
      const atualizadas = [...prev, ...novasPerguntas]
      atualizadas.forEach((p, i) => (p.ordem = i + 1))
      return atualizadas
    })
    if (meta?.titulo && !titulo) setTitulo(meta.titulo)
    if (meta?.descricao && !descricao) setDescricao(meta.descricao)
    if (meta?.encerraEm && !encerraEm) setEncerraEm(meta.encerraEm)
    if (meta?.anonimo !== undefined) setAnonimo(meta.anonimo)
    if (meta?.resultadosVisiveis !== undefined) setResultadosVisiveis(meta.resultadosVisiveis)
    if (meta?.corTema) setCorTema(meta.corTema)
    if (meta?.usuariosEsperados && !usuariosEsperados) setUsuariosEsperados(meta.usuariosEsperados.toString())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setSalvando(true)

    const encerraEmDate = encerraEm ? new Date(encerraEm) : null
    const usuariosEsperadosNum = usuariosEsperados ? parseInt(usuariosEsperados, 10) : null

    if (!isOnline) {
      try {
        await addPendingMutation({
          url: '/api/sync',
          method: 'POST',
          body: JSON.stringify({
            action: isEdicao ? 'editar_questionario' : 'criar_questionario',
            data: {
              ...(isEdicao ? { id: questionario.id } : {}),
              titulo,
              descricao,
              perguntas,
              encerraEm: encerraEmDate ? encerraEmDate.toISOString() : null,
              anonimo,
              resultadosVisiveis,
              corTema,
              usuariosEsperados: usuariosEsperadosNum,
            },
          }),
          createdAt: Date.now(),
        })

        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          try {
            const registration = await navigator.serviceWorker.ready
            const swReg = registration as unknown as { sync: { register: (tag: string) => Promise<void> } }
            await swReg.sync.register('sync-mutations')
          } catch {
            // sincroniza na próxima reconexão via SyncProvider
          }
        }

        setEnfileirado(true)
        setSalvando(false)
      } catch {
        setErro('Não foi possível salvar o questionário')
        setSalvando(false)
      }
      return
    }

    try {
      let resultado
      if (isEdicao) {
        resultado = await editarQuestionario(questionario.id, titulo, descricao, perguntas, encerraEmDate, anonimo, corTema, usuariosEsperadosNum, resultadosVisiveis)
      } else {
        resultado = await criarQuestionario(titulo, descricao, perguntas, encerraEmDate, anonimo, corTema, usuariosEsperadosNum, resultadosVisiveis)
      }

      if ('error' in resultado && resultado.error) {
        setErro(resultado.error as string)
        setSalvando(false)
      } else if ('questionario' in resultado && resultado.questionario) {
        router.push(`/questionarios/${(resultado.questionario as { id: number }).id}`)
      }
    } catch {
      setErro('Erro ao salvar questionário')
      setSalvando(false)
    }
  }

  const totalObrigatorias = perguntas.filter((p) => p.obrigatoria).length

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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

      {enfileirado && (
        <div className="alert-success flex items-center gap-2" role="status">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <path d="M9 10h6"/>
          </svg>
          <span>
            Você está offline. O questionário foi <strong>salvo no dispositivo</strong> e será enviado automaticamente quando a conexão voltar.
          </span>
        </div>
      )}

      {!isOnline && !enfileirado && (
        <div className="alert-warning flex items-center gap-2" role="status">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18"/>
            <path d="M6 6l12 12"/>
          </svg>
          <span>
            Você está offline. Ao salvar, o questionário ficará na fila e será sincronizado quando a conexão voltar.
          </span>
        </div>
      )}

      {/* Header do formulário */}
      <div className="card overflow-hidden !p-0">
        <div
          className="h-24 w-full"
          style={{ backgroundColor: corTema }}
        >
        </div>
        <div className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-primary)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {perguntas.length} {perguntas.length === 1 ? 'pergunta' : 'perguntas'}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-primary)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {totalObrigatorias} obrigatória{totalObrigatorias === 1 ? '' : 's'}
            </span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {isEdicao ? 'Editando questionário existente' : 'Criando novo questionário'}
          </span>
        </div>
      </div>

      {/* Informações básicas */}
      <div className="card flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-primary)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </span>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Informações básicas</h2>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Título *
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título do questionário"
            className="input"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Explique o objetivo do questionário (opcional)"
            rows={3}
            className="input resize-none"
          />
        </div>
      </div>

      {/* Configurações */}
      <div className="card flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-primary)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
          </span>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Configurações</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Prazo de encerramento
            </label>
            <input
              type="datetime-local"
              value={encerraEm}
              onChange={(e) => setEncerraEm(e.target.value)}
              className="input"
            />
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Encerra automaticamente nesta data.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Respostas esperadas
            </label>
            <input
              type="number"
              min="1"
              value={usuariosEsperados}
              onChange={(e) => setUsuariosEsperados(e.target.value)}
              placeholder="Ex: 50"
              className="input"
            />
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Você será notificado ao atingir esse número.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer rounded-lg p-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
            style={{ backgroundColor: anonimo ? 'var(--btn-primary-bg)' : 'var(--btn-secondary-bg)' }}
            onClick={() => setAnonimo(!anonimo)}
          >
            <span
              className="inline-block h-4 w-4 transform rounded-full transition-transform"
              style={{ backgroundColor: 'var(--btn-primary-text)', transform: anonimo ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Permitir respostas anônimas
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Quando ativo, qualquer pessoa pode responder sem estar logada.
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer rounded-lg p-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
            style={{ backgroundColor: resultadosVisiveis ? 'var(--btn-primary-bg)' : 'var(--btn-secondary-bg)' }}
            onClick={() => setResultadosVisiveis(!resultadosVisiveis)}
          >
            <span
              className="inline-block h-4 w-4 transform rounded-full transition-transform"
              style={{ backgroundColor: 'var(--btn-primary-text)', transform: resultadosVisiveis ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Disponibilizar resultados para todos
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Quando ativo, qualquer pessoa pode ver e baixar os resultados. Desative para restringir ao autor.
            </p>
          </div>
        </label>
      </div>

      {/* Aparência */}
      <div className="card flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-primary)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="6.5" r=".5"/>
              <circle cx="17.5" cy="10.5" r=".5"/>
              <circle cx="8.5" cy="7.5" r=".5"/>
              <circle cx="6.5" cy="12.5" r=".5"/>
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
            </svg>
          </span>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Aparência</h2>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Cor do tema
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={corTema}
              onChange={(e) => setCorTema(e.target.value)}
              className="w-11 h-11 rounded-lg cursor-pointer border"
              style={{ borderColor: 'var(--input-border)' }}
            />
            <input
              type="text"
              value={corTema}
              onChange={(e) => setCorTema(e.target.value)}
              placeholder="#6366f1"
              className="input flex-1"
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Cor utilizada no banner e destaque do questionário.
          </p>
        </div>
      </div>

      {/* Perguntas */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Perguntas</h2>
          <div className="flex gap-2">
            <ImportarJson
              onImport={handleImportarJson}
            />
            <button
              type="button"
              onClick={adicionarPergunta}
              className="btn-primary"
            >
              + Adicionar pergunta
            </button>
          </div>
        </div>

        {perguntas.length === 0 && (
          <div
            className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 p-10 text-center"
            style={{ borderColor: 'var(--card-border)', backgroundColor: 'transparent' }}
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-full" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-primary)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </span>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Nenhuma pergunta ainda
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Clique em &quot;Adicionar pergunta&quot; para começar a montar seu questionário.
            </p>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={perguntas.map((_, i) => i)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4">
              {perguntas.map((pergunta, idx) => (
                <div
                  key={idx}
                  className="card !rounded-xl"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  <SortablePergunta
                    idx={idx}
                    pergunta={pergunta}
                    perguntas={perguntas}
                    onUpdate={atualizarPergunta}
                    onRemove={removerPergunta}
                    onAddOption={adicionarOpcao}
                    onRemoveOption={removerOpcao}
                    onUpdateOption={atualizarOpcao}
                    onToggleCorreta={toggleCorreta}
                    total={perguntas.length}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {perguntas.length > 0 && (
          <button
            type="button"
            onClick={adicionarPergunta}
            className="rounded-xl border-2 border-dashed px-4 py-6 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            style={{ borderColor: 'var(--card-border)', color: 'var(--text-tertiary)' }}
          >
            <span className="text-lg leading-none">+</span> Adicionar pergunta
          </button>
        )}
      </div>

      {/* Barra de ações */}
      <div
        className="rounded-xl p-4 flex flex-wrap gap-2 items-center"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 -2px 12px rgba(0,0,0,0.05)' }}
      >
        <button
          type="submit"
          disabled={salvando || enfileirado || perguntas.length === 0}
          className="btn-primary"
        >
          {enfileirado ? 'Salvo na fila ✓' : salvando ? 'Salvando...' : isEdicao ? (isOnline ? 'Salvar alterações' : 'Salvar offline') : (isOnline ? 'Criar questionário' : 'Salvar offline')}
        </button>
        <button
          type="button"
          onClick={() => setMostrarPreview(true)}
          disabled={perguntas.length === 0}
          className="btn-secondary"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost ml-auto"
        >
          Cancelar
        </button>
      </div>

      {mostrarPreview && (
        <PreviewQuestionario
          questionario={{
            titulo: titulo || 'Sem título',
            descricao,
            perguntas: perguntas.map((p, i) => ({
              ...p,
              id: i,
              ordem: i + 1,
            })),
          }}
          onFechar={() => setMostrarPreview(false)}
        />
      )}
    </form>
  )
}