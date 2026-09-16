'use client'

import { useActionState } from 'react'
import { aceitarTermos } from '@/modules/usuarios/usuarios.actions'

interface TermosModalProps {
  isOpen: boolean
  onClose?: () => void
  readonly?: boolean
}

async function aceitarTermosAction() {
  return await aceitarTermos()
}

export default function TermosModal({ isOpen, onClose, readonly = false }: TermosModalProps) {
  const [estado, formAction, pending] = useActionState(aceitarTermosAction, null)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-2xl max-h-[85vh] mx-4 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--card-bg)' }}
      >
        <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Termo de Compromisso e Responsabilidade
          </h1>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg transition-colors hover:bg-[var(--btn-secondary-bg)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 prose prose-sm max-w-none" style={{ color: 'var(--text-secondary)' }}>
          <p className="mb-4">
            Ao utilizar o Lumys para criar ou responder questionários, o usuário declara estar ciente e de acordo com
            as condições estabelecidas neste Termo.
          </p>

          <h2 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>1. Sobre o Lumys</h2>
          <p className="mb-4">
            O Lumys é uma plataforma para criação, disponibilização e gerenciamento de questionários.
          </p>
          <p className="mb-4">
            A plataforma disponibiliza recursos para que seus usuários possam criar questionários, coletar respostas,
            visualizar resultados por meio de uma dashboard e exportar os dados coletados em formato CSV.
          </p>
          <p className="mb-4">
            O Lumys funciona como uma ferramenta tecnológica e não participa da elaboração, validação ou interpretação
            dos questionários criados por seus usuários.
          </p>

          <h2 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>2. Responsabilidade pelo questionário</h2>
          <p className="mb-4">
            O criador de um questionário é responsável por seu conteúdo, finalidade e utilização.
          </p>
          <p className="mb-4">
            Isso inclui, entre outros aspectos, as perguntas apresentadas, as informações solicitadas, a forma de
            divulgação do questionário, a utilização das respostas e a interpretação ou divulgação dos resultados.
          </p>
          <p className="mb-4">
            O fato de um questionário estar disponível no Lumys não significa que seu conteúdo tenha sido analisado,
            aprovado ou validado pela plataforma.
          </p>
          <p className="mb-4">
            O criador também é responsável por garantir que o conteúdo de seu questionário e a forma como as informações
            são coletadas estejam de acordo com as regras e leis aplicáveis.
          </p>

          <h2 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>3. Anonimato das respostas</h2>
          <p className="mb-4">
            O Lumys disponibiliza ao criador a possibilidade de definir se as respostas de um questionário serão anônimas.
          </p>
          <p className="mb-4">
            Por padrão, os questionários são configurados com o anonimato ativado.
          </p>
          <p className="mb-4">
            Quando o anonimato estiver ativado, a identificação dos participantes não será apresentada na lista de
            participantes do questionário, de acordo com o funcionamento da plataforma.
          </p>
          <p className="mb-4">
            O criador poderá optar por desativar o anonimato. Nesse caso, os participantes poderão ser identificados
            conforme as informações e recursos disponibilizados pelo sistema.
          </p>
          <p className="mb-4">
            A configuração escolhida pelo criador é de sua responsabilidade, cabendo a ele informar aos participantes,
            quando necessário, sobre a forma de identificação adotada no questionário.
          </p>

          <h2 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>4. Disponibilidade dos resultados</h2>
          <p className="mb-4">
            O Lumys permite que o criador determine se os resultados de um questionário estarão disponíveis para visualização.
          </p>
          <p className="mb-4">
            Por padrão, os resultados são configurados como disponíveis.
          </p>
          <p className="mb-4">
            O criador poderá alterar essa configuração e restringir o acesso aos resultados.
          </p>
          <p className="mb-4">
            Quando os resultados estiverem disponíveis, a página de resultados e suas respectivas informações poderão
            ser acessadas de acordo com as configurações do questionário.
          </p>
          <p className="mb-4">
            O criador é responsável por decidir se deseja disponibilizar os resultados e pelas informações apresentadas
            aos participantes ou a outras pessoas que tenham acesso ao questionário.
          </p>

          <h2 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>5. Configurações escolhidas pelo criador</h2>
          <p className="mb-4">
            O criador do questionário é responsável pelas configurações aplicadas ao seu questionário, incluindo as
            opções relacionadas ao anonimato das respostas e à disponibilidade dos resultados.
          </p>
          <p className="mb-4">
            O Lumys disponibiliza essas opções como recursos de configuração, mas não determina qual configuração é
            adequada para cada questionário.
          </p>
          <p className="mb-4">
            O criador deve considerar a finalidade de sua pesquisa, a natureza das informações coletadas e as
            expectativas dos participantes ao definir essas configurações.
          </p>

          <h2 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>6. Resultados e sua interpretação</h2>
          <p className="mb-4">
            Os resultados apresentados pelo Lumys são baseados nas respostas fornecidas pelos participantes.
          </p>
          <p className="mb-4">
            A plataforma não garante que os resultados sejam completos, representativos, precisos ou cientificamente válidos.
          </p>
          <p className="mb-4">
            A análise, interpretação, utilização e divulgação dos resultados são de responsabilidade do criador do questionário.
          </p>
          <p className="mb-4">
            O Lumys não se responsabiliza por decisões ou conclusões tomadas pelo criador ou por terceiros com base nos
            resultados apresentados.
          </p>

          <h2 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>7. Visualização e exportação dos dados</h2>
          <p className="mb-4">
            Quando a visualização dos resultados estiver habilitada pelo criador, o Lumys disponibilizará, na página de
            resultados do questionário, os recursos de visualização e exportação das respostas coletadas.
          </p>
          <p className="mb-4">
            Entre esses recursos está a possibilidade de exportar os dados em formato CSV.
          </p>
          <p className="mb-4">
            Quando o anonimato estiver ativado, a identificação dos participantes não será apresentada na lista de
            participantes. Quando o anonimato estiver desativado, o arquivo exportado poderá conter informações que
            permitam a identificação dos participantes, conforme os dados disponibilizados pelo sistema.
          </p>
          <p className="mb-4">
            Quando o criador desativar a visualização dos resultados, a página de resultados e seus respectivos
            recursos, incluindo a exportação em formato CSV, ficarão indisponíveis.
          </p>
          <p className="mb-4">
            O criador é responsável pelo armazenamento, utilização e compartilhamento dos dados após sua exportação,
            bem como pela forma como esses dados serão utilizados.
          </p>

          <h2 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>8. Responsabilidade da plataforma</h2>
          <p className="mb-4">
            O Lumys disponibiliza a infraestrutura e as funcionalidades necessárias para o funcionamento dos questionários.
          </p>
          <p className="mb-4">
            A plataforma não é responsável pelo conteúdo criado pelos usuários, pelas respostas fornecidas pelos
            participantes, pela finalidade da coleta de informações, pela interpretação dos resultados ou pela utilização
            posterior dos dados pelo criador.
          </p>
          <p className="mb-4">
            A plataforma também não garante que um questionário criado por um usuário seja legítimo, correto, apropriado
            ou adequado à finalidade informada pelo seu criador.
          </p>

          <h2 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>9. Uso adequado</h2>
          <p className="mb-4">
            O usuário se compromete a utilizar o Lumys de forma responsável e de acordo com a legislação aplicável.
          </p>
          <p className="mb-4">
            Não devem ser utilizados os recursos da plataforma para criar questionários destinados à prática de
            atividades ilícitas, fraude, obtenção indevida de informações ou violação de direitos de terceiros.
          </p>
          <p className="mb-4">
            Caso seja identificado conteúdo que viole estas condições ou a legislação aplicável, o acesso ao questionário
            poderá ser restringido ou removido, conforme aplicável.
          </p>

          <h2 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>10. Natureza acadêmica</h2>
          <p className="mb-4">
            O Lumys é um projeto desenvolvido como protótipo acadêmico para fins de demonstração e avaliação.
          </p>
          <p className="mb-4">
            Por essa razão, determinadas funcionalidades, limitações e comportamentos do sistema poderão ser modificados
            durante seu desenvolvimento.
          </p>
          <p className="mb-4">
            Este Termo descreve as regras de utilização do protótipo e não constitui uma oferta de serviço comercial.
          </p>

          <h2 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>11. Aceite</h2>
          <p className="mb-4">
            Ao criar ou utilizar um questionário no Lumys, o usuário declara que compreendeu que:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>o criador é responsável pelo conteúdo e pela finalidade de seu questionário;</li>
            <li>o criador é responsável pelas configurações escolhidas para anonimato e disponibilidade dos resultados;</li>
            <li>o criador é responsável pela utilização e interpretação dos resultados obtidos;</li>
            <li>as respostas são fornecidas pelos participantes por sua própria decisão;</li>
            <li>o Lumys fornece a infraestrutura tecnológica para criação, coleta e apresentação dos questionários e resultados.</li>
          </ul>
          <p className="mb-4">
            O uso do Lumys representa a concordância do usuário com este Termo.
          </p>

          <p className="mt-6 font-semibold" style={{ color: 'var(--text-primary)' }}>Lumys — 2026</p>
          <p className="mb-4">Projeto acadêmico desenvolvido por Richard Silva Almeida, no curso de Licenciatura em Computação.</p>
        </div>

        <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          {readonly ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full font-medium rounded-lg px-6 py-3 transition-colors"
              style={{ backgroundColor: 'var(--btn-secondary-bg)', color: 'var(--text-primary)' }}
            >
              Fechar
            </button>
          ) : (
            <>
              {estado?.success && (
                <div className="alert-success mb-3" role="status">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                  Termos aceitos com sucesso!
                </div>
              )}

              {estado?.error && (
                <div className="alert-error mb-3" role="alert">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {estado.error}
                </div>
              )}

              <form action={formAction}>
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full font-medium rounded-lg px-6 py-3 transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                >
                  {pending ? 'Aceitando...' : 'Aceitar o Termo de Compromisso'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
