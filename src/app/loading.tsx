import { Skeleton } from '@/components/Skeletons'

export default function Loading() {
  return (
    <div role="status" aria-label="Carregando..." className="flex flex-col gap-4">
      <span className="sr-only">Carregando...</span>
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <div className="flex flex-col gap-4 mt-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  )
}