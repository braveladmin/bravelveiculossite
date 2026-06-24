'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireManagerOrError } from '@/lib/actions/vehicles'
import type { MCPPendingAction } from '@/lib/mcp/types'

function rowToPendingAction(row: Record<string, unknown>): MCPPendingAction {
  return {
    id:        row.id as string,
    kind:      row.kind as MCPPendingAction['kind'],
    vehicleId: (row.vehicle_id as string) || null,
    payload:   (row.payload as Record<string, unknown>) ?? {},
    summary:   row.summary as string,
    createdBy: (row.created_by as string) || null,
    status:    row.status as MCPPendingAction['status'],
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
  }
}

// Usado pela página /estoque/rascunhos/[id] — só managers leem (RLS já
// restringe SELECT a SUPER_ADMIN/INVENTORY_MANAGER, mas confere de novo aqui
// pra dar uma mensagem de erro clara em vez de "rascunho não encontrado").
export async function getPendingAction(
  id: string
): Promise<{ pendingAction: MCPPendingAction | null; error: string | null }> {
  const { userInfo, error: authError } = await requireManagerOrError()
  if (!userInfo) return { pendingAction: null, error: authError }

  const supabase = await createClient()
  const { data, error } = await supabase.from('mcp_pending_actions').select('*').eq('id', id).single()
  if (error || !data) return { pendingAction: null, error: error?.message ?? 'Rascunho não encontrado' }
  return { pendingAction: rowToPendingAction(data), error: null }
}

// Substitui a lista de fotos do rascunho (payload.images) pela lista completa
// vinda do PhotoManager (já reordenada/com remoções aplicadas). Usa o client
// admin porque mcp_pending_actions não tem policy de UPDATE pra authenticated
// — a gravação sempre passa por aqui depois de confirmar a permissão no código.
export async function setDraftImages(id: string, images: string[]): Promise<{ error: string | null }> {
  const { userInfo, error: authError } = await requireManagerOrError()
  if (!userInfo) return { error: authError }

  const supabase = createAdminClient()
  const { data: existing, error: fetchError } = await supabase
    .from('mcp_pending_actions')
    .select('payload, status')
    .eq('id', id)
    .single()

  if (fetchError || !existing) return { error: fetchError?.message ?? 'Rascunho não encontrado' }
  if (existing.status !== 'pending') return { error: 'Esse rascunho não está mais pendente de confirmação' }

  const payload = (existing.payload as Record<string, unknown>) ?? {}
  const { error } = await supabase
    .from('mcp_pending_actions')
    .update({ payload: { ...payload, images } })
    .eq('id', id)

  return { error: error?.message ?? null }
}
