import type { CSSProperties } from 'react'

const baseStyle: CSSProperties = { backgroundColor: 'var(--bg-tertiary)' }

export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg ${className}`}
      style={{ ...baseStyle, ...style }}
    />
  )
}

export function QuestionarioCardSkeleton() {
  return (
    <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
      <Skeleton className="h-8 w-28 mb-4" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-2/3 mb-4" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  )
}

export function QuestionarioListaSkeleton({ itens = 3 }: { itens?: number }) {
  return (
    <div id="skeleton-lista" role="status" aria-label="Carregando..." className="flex flex-col gap-4">
      <span className="sr-only">Carregando...</span>
      {Array.from({ length: itens }).map((_, i) => (
        <QuestionarioCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function QuestionarioDetalheSkeleton() {
  return (
    <div role="status" aria-label="Carregando..." className="flex flex-col gap-6">
      <span className="sr-only">Carregando...</span>
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-28" />
      </div>
      <Skeleton className="h-32 w-full" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div role="status" aria-label="Carregando..." className="flex flex-col gap-6">
      <span className="sr-only">Carregando...</span>
      <Skeleton className="h-7 w-1/3" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  )
}

export function ListaSkeleton({ itens = 5, altura = 'h-16' }: { itens?: number; altura?: string }) {
  return (
    <div role="status" aria-label="Carregando..." className="flex flex-col gap-2">
      <span className="sr-only">Carregando...</span>
      {Array.from({ length: itens }).map((_, i) => (
        <Skeleton key={i} className={`${altura} w-full`} />
      ))}
    </div>
  )
}

export function ConfigSkeleton() {
  return (
    <div role="status" aria-label="Carregando..." className="flex flex-col gap-6">
      <span className="sr-only">Carregando...</span>
      <Skeleton className="h-7 w-40" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  )
}