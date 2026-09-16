export default function ProgressBar() {
  return (
    <div
      className="relative h-1 w-full overflow-hidden rounded-full mb-4"
      style={{ backgroundColor: 'var(--accent-dim)' }}
      role="progressbar"
      aria-label="Carregando..."
    >
      <div
        className="absolute inset-y-0 w-1/3 animate-slide-linear rounded-full"
        style={{ backgroundColor: 'var(--btn-primary-bg)' }}
      />
    </div>
  )
}