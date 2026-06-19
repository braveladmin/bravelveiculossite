import { getVehicles } from '@/lib/actions/vehicles'
import { NovaMidiaWizard } from '@/components/midias/NovaMidiaWizard'

export default async function NovaMidiaPage() {
  const { vehicles } = await getVehicles()
  // Não faz sentido gerar mídia comercial pra um carro já vendido ou reservado.
  const disponiveis = vehicles.filter((v) => v.status === 'disponivel')
  return <NovaMidiaWizard vehicles={disponiveis} />
}
