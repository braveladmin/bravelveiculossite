import { requireManagerOrRedirect } from "@/lib/actions/vehicles"
import { ComandosIaClient } from "@/components/comandos-ia/ComandosIaClient"

export default async function ComandosIaPage() {
  const userInfo = await requireManagerOrRedirect()
  return <ComandosIaClient userInfo={userInfo} />
}
