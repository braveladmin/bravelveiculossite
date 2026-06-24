import { notFound } from "next/navigation"
import { requireManagerOrRedirect } from "@/lib/actions/vehicles"
import { getPendingAction } from "@/lib/actions/pendingActions"
import { RascunhoClient } from "@/components/vehicles/RascunhoClient"

type Props = {
  params: Promise<{ id: string }>
}

export default async function RascunhoPage({ params }: Props) {
  await requireManagerOrRedirect()
  const { id } = await params
  const { pendingAction } = await getPendingAction(id)

  if (!pendingAction) notFound()

  return <RascunhoClient pendingAction={pendingAction} />
}
