import Link from 'next/link'
import { getUsuarioLogado } from '@/modules/usuarios/usuarios.actions'
import { primeiroNome } from '@/lib/utils'
import HeroMinimal from '@/components/HeroMinimal'
import HomeScanner from '@/components/HomeScanner'
import BuscaCodigo from '@/components/BuscaCodigo'

export default async function Home() {
  const usuario = await getUsuarioLogado()

  return (
    <HeroMinimal>
      <h1 className="text-3xl md:text-4xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        {usuario ? (
          <>
            <span className="block">Bem-vindo,</span>
            <span className="block text-2xl md:text-3xl font-medium mt-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
              {primeiroNome(usuario.nome)}
            </span>
          </>
        ) : (
          'Bem-vindo ao aplicativo'
        )}
      </h1>

      <p className="leading-relaxed mb-8 max-w-md" style={{ color: 'var(--text-secondary)' }}>
        Crie, compartilhe e responda seus questionários em segundos.
      </p>

      <div className="w-full max-w-md mb-6">
        <BuscaCodigo />
      </div>

      <div className="flex flex-col gap-4 w-full sm:w-auto">
        {!usuario && (
          <Link
            href="/usuarios/login"
            className="btn-primary rounded-xl px-6 py-3 text-sm transition-all text-center min-h-[44px] flex items-center justify-center hover:scale-[1.02]"
          >
            Entrar
          </Link>
        )}
        <HomeScanner />
      </div>
    </HeroMinimal>
  )
}
