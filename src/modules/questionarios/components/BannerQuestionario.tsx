'use client'

interface Props {
  cor: string | null
  compacto?: boolean
  className?: string
}

export default function BannerQuestionario({ cor, compacto = false, className = '' }: Props) {
  const corBase = cor || 'var(--accent)'

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg ${compacto ? 'h-16' : 'h-24'} ${className}`}
      style={{ backgroundColor: corBase }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 85% 50%, rgba(0,0,0,0.14), transparent 55%)' }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/icon1.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 top-1/2 h-[220%] w-auto -translate-y-1/2 opacity-30"
      />
    </div>
  )
}
