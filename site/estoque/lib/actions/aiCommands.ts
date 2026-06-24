'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicleAction,
  archiveVehicle,
  markAsSold,
  markAsAvailable,
  requireManagerOrError,
  type VehicleFormInput,
} from '@/lib/actions/vehicles'
import { gerarLegenda, gerarHashtags, formatPrecoSemCentavos } from '@/lib/midias/legenda'
import { ALL_TOOL_DEFINITIONS, DANGEROUS_TOOLS, type DangerousToolName } from '@/lib/ai/tools'
import { SYSTEM_PROMPT } from '@/lib/ai/systemPrompt'
import type { ChatMessage, PendingAction, MediaPreviewParams, RunAiCommandResult, ConfirmAiActionResult } from '@/lib/ai/types'
import type { Vehicle, MediaType } from '@/lib/types'

const MODEL = 'claude-sonnet-4-6'
const MAX_TOOL_ITERATIONS = 5

function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function vehicleLabel(v: Vehicle): string {
  return [v.brand, v.name].filter(Boolean).join(' ')
}

async function findVehicle(vehicleId: string): Promise<Vehicle | null> {
  const { vehicle } = await getVehicleById(vehicleId)
  return vehicle
}

function isDangerousTool(name: string): name is DangerousToolName {
  return (DANGEROUS_TOOLS as readonly string[]).includes(name)
}

// ── Tools seguras (sem efeito colateral) ─────────────────────────────────────

async function execListarVeiculos(input: Record<string, unknown>) {
  const { vehicles } = await getVehicles()
  let filtered = vehicles

  if (typeof input.busca === 'string' && input.busca) {
    const q = input.busca.toLowerCase()
    filtered = filtered.filter((v) => [v.name, v.brand, v.model].some((f) => f?.toLowerCase().includes(q)))
  }
  if (typeof input.marca === 'string' && input.marca) {
    filtered = filtered.filter((v) => v.brand?.toLowerCase() === (input.marca as string).toLowerCase())
  }
  if (typeof input.status === 'string' && input.status) {
    filtered = filtered.filter((v) => v.status === input.status)
  }
  if (typeof input.categoria === 'string' && input.categoria) {
    filtered = filtered.filter((v) => v.category?.toLowerCase() === (input.categoria as string).toLowerCase())
  }
  if (typeof input.precoMin === 'number') filtered = filtered.filter((v) => v.price >= (input.precoMin as number))
  if (typeof input.precoMax === 'number') filtered = filtered.filter((v) => v.price <= (input.precoMax as number))

  return {
    total: filtered.length,
    veiculos: filtered.slice(0, 30).map((v) => ({
      id: v.id,
      nome: vehicleLabel(v),
      ano: v.yearModel ? `${v.year}/${v.yearModel}` : v.year,
      km: v.km,
      preco: v.price,
      status: v.status,
      categoria: v.category,
      premium: v.isPremium,
    })),
  }
}

async function execGerarLegendaInstagram(input: Record<string, unknown>) {
  const vehicleId = String(input.vehicleId ?? '')
  const vehicle = await findVehicle(vehicleId)
  if (!vehicle) return { error: 'Veículo não encontrado' }
  return { caption: gerarLegenda(vehicle), hashtags: gerarHashtags(vehicle) }
}

async function execMediaPreview(
  input: Record<string, unknown>
): Promise<{ mediaPreview: MediaPreviewParams } | { error: string }> {
  const vehicleId = String(input.vehicleId ?? '')
  const vehicle = await findVehicle(vehicleId)
  if (!vehicle) return { error: 'Veículo não encontrado' }

  const mediaType = (typeof input.mediaType === 'string' ? input.mediaType : 'story') as MediaType
  const photos = vehicle.images?.length ? vehicle.images : vehicle.imageUrl ? [vehicle.imageUrl] : []
  if (photos.length === 0) return { error: `O veículo "${vehicleLabel(vehicle)}" não tem fotos cadastradas` }

  const caption = typeof input.caption === 'string' && input.caption ? input.caption : gerarLegenda(vehicle)
  const hashtags = gerarHashtags(vehicle)

  return {
    mediaPreview: { vehicleId: vehicle.id, vehicleLabel: vehicleLabel(vehicle), mediaType, photos, caption, hashtags },
  }
}

async function executeSafeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  if (name === 'listarVeiculos') return execListarVeiculos(input)
  if (name === 'gerarLegendaInstagram') return execGerarLegendaInstagram(input)
  return { error: `Tool desconhecida: ${name}` }
}

// ── Tools perigosas — só validam e devolvem prévia, nunca executam ──────────

async function buildPendingAction(
  toolName: DangerousToolName,
  input: Record<string, unknown>
): Promise<{ pendingAction: PendingAction | null; toolResult: unknown }> {
  switch (toolName) {
    case 'criarVeiculo': {
      const required = ['name', 'brand', 'model', 'year', 'km', 'price']
      const missing = required.filter((f) => input[f] === undefined || input[f] === null || input[f] === '')
      if (missing.length) return { pendingAction: null, toolResult: { status: 'missing_fields', missingFields: missing } }

      const vehicleInput: VehicleFormInput = {
        name: String(input.name),
        brand: String(input.brand),
        model: String(input.model),
        year: Number(input.year),
        yearModel: input.yearModel ? Number(input.yearModel) : undefined,
        km: Number(input.km),
        color: String(input.color ?? ''),
        category: String(input.category ?? ''),
        transmission: String(input.transmission ?? ''),
        fuel: String(input.fuel ?? ''),
        doors: input.doors ? Number(input.doors) : 4,
        motor: String(input.motor ?? ''),
        optionals: Array.isArray(input.optionals) ? input.optionals.map(String) : [],
        isPremium: Boolean(input.isPremium ?? false),
        isNew: Boolean(input.isNew ?? false),
        images: [],
        imageUrl: '',
        price: Number(input.price),
        status: 'disponivel',
        acquiredAt: new Date().toISOString(),
      }
      const summary = `Vou cadastrar o veículo "${vehicleInput.brand} ${vehicleInput.name}" (${vehicleInput.year}, ${formatPrecoSemCentavos(vehicleInput.price)}). Confirmar?`
      return { pendingAction: { tool: 'criarVeiculo', summary, input: vehicleInput }, toolResult: { status: 'proposed' } }
    }

    case 'editarVeiculo': {
      const vehicleId = String(input.vehicleId ?? '')
      const vehicle = await findVehicle(vehicleId)
      if (!vehicle) return { pendingAction: null, toolResult: { status: 'error', message: 'Veículo não encontrado' } }

      const editableFields = [
        'name', 'brand', 'model', 'year', 'yearModel', 'km', 'price',
        'color', 'category', 'transmission', 'fuel', 'doors', 'motor', 'optionals',
      ] as const
      const patch: Partial<VehicleFormInput> = {}
      for (const f of editableFields) {
        if (input[f] !== undefined) (patch as Record<string, unknown>)[f] = input[f]
      }
      if (Object.keys(patch).length === 0) {
        return { pendingAction: null, toolResult: { status: 'missing_fields', missingFields: ['ao menos um campo pra alterar'] } }
      }
      const summary = `Vou atualizar ${Object.keys(patch).length} campo(s) do veículo "${vehicleLabel(vehicle)}". Confirmar?`
      return {
        pendingAction: { tool: 'editarVeiculo', summary, vehicleId, vehicleLabel: vehicleLabel(vehicle), input: patch },
        toolResult: { status: 'proposed' },
      }
    }

    case 'removerVeiculo': {
      const vehicleId = String(input.vehicleId ?? '')
      const vehicle = await findVehicle(vehicleId)
      if (!vehicle) return { pendingAction: null, toolResult: { status: 'error', message: 'Veículo não encontrado' } }
      const summary = `Vou arquivar o veículo "${vehicleLabel(vehicle)}" — ele sai das listagens mas fica guardado, pode ser restaurado depois. Confirmar?`
      return { pendingAction: { tool: 'removerVeiculo', summary, vehicleId, vehicleLabel: vehicleLabel(vehicle) }, toolResult: { status: 'proposed' } }
    }

    case 'marcarComoVendido': {
      const vehicleId = String(input.vehicleId ?? '')
      const vehicle = await findVehicle(vehicleId)
      if (!vehicle) return { pendingAction: null, toolResult: { status: 'error', message: 'Veículo não encontrado' } }
      const summary = `Vou marcar o veículo "${vehicleLabel(vehicle)}" como VENDIDO. Confirmar?`
      return { pendingAction: { tool: 'marcarComoVendido', summary, vehicleId, vehicleLabel: vehicleLabel(vehicle) }, toolResult: { status: 'proposed' } }
    }

    case 'marcarComoDisponivel': {
      const vehicleId = String(input.vehicleId ?? '')
      const vehicle = await findVehicle(vehicleId)
      if (!vehicle) return { pendingAction: null, toolResult: { status: 'error', message: 'Veículo não encontrado' } }
      const summary = `Vou marcar o veículo "${vehicleLabel(vehicle)}" como DISPONÍVEL. Confirmar?`
      return { pendingAction: { tool: 'marcarComoDisponivel', summary, vehicleId, vehicleLabel: vehicleLabel(vehicle) }, toolResult: { status: 'proposed' } }
    }

    case 'definirDestaque': {
      const vehicleId = String(input.vehicleId ?? '')
      const vehicle = await findVehicle(vehicleId)
      if (!vehicle) return { pendingAction: null, toolResult: { status: 'error', message: 'Veículo não encontrado' } }
      const isPremium = Boolean(input.isPremium)
      const summary = `Vou ${isPremium ? 'marcar' : 'remover'} o destaque "Carro premium" do veículo "${vehicleLabel(vehicle)}". Confirmar?`
      return {
        pendingAction: { tool: 'definirDestaque', summary, vehicleId, vehicleLabel: vehicleLabel(vehicle), isPremium },
        toolResult: { status: 'proposed' },
      }
    }
  }
}

// ── Loop principal de tool-calling ───────────────────────────────────────────

export async function runAiCommand(history: ChatMessage[], userMessage: string): Promise<RunAiCommandResult> {
  const { userInfo, error: authError } = await requireManagerOrError()
  if (!userInfo) return { reply: '', pendingAction: null, mediaPreview: null, error: authError }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { reply: '', pendingAction: null, mediaPreview: null, error: 'ANTHROPIC_API_KEY não configurada no servidor.' }
  }

  const anthropic = getAnthropicClient()
  const messages: Anthropic.Messages.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content }) as Anthropic.Messages.MessageParam),
    { role: 'user', content: userMessage },
  ]

  let pendingAction: PendingAction | null = null
  let mediaPreview: MediaPreviewParams | null = null
  let finalText = ''

  try {
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: ALL_TOOL_DEFINITIONS as Anthropic.Tool[],
        messages,
      })

      const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text')
      if (textBlocks.length) finalText = textBlocks.map((b) => b.text).join('\n').trim()

      const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
      if (!toolUse) break

      messages.push({ role: 'assistant', content: response.content })
      const toolInput = (toolUse.input ?? {}) as Record<string, unknown>

      if (toolUse.name === 'gerarPreviewPostInstagram' || toolUse.name === 'publicarInstagram') {
        const result = await execMediaPreview(toolInput)
        if ('mediaPreview' in result) mediaPreview = result.mediaPreview
        else finalText = result.error
        break
      }

      if (isDangerousTool(toolUse.name)) {
        const built = await buildPendingAction(toolUse.name, toolInput)
        if (built.pendingAction) {
          pendingAction = built.pendingAction
          break
        }
        messages.push({
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(built.toolResult) }],
        })
        continue
      }

      const result = await executeSafeTool(toolUse.name, toolInput)
      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) }],
      })
    }
  } catch (err) {
    return {
      reply: '',
      pendingAction: null,
      mediaPreview: null,
      error: err instanceof Error ? err.message : 'Erro ao falar com a IA',
    }
  }

  return {
    reply: finalText || 'Não consegui entender o pedido — pode reformular?',
    pendingAction,
    mediaPreview,
    error: null,
  }
}

// ── Confirmação / cancelamento de ações perigosas ────────────────────────────

export async function confirmAiAction(pendingAction: PendingAction): Promise<ConfirmAiActionResult> {
  const { userInfo, error: authError } = await requireManagerOrError()
  if (!userInfo) return { message: '', error: authError }

  let message = ''
  let resultError: string | null = null

  switch (pendingAction.tool) {
    case 'criarVeiculo': {
      const { vehicle, error } = await createVehicle(pendingAction.input)
      resultError = error
      message = error ? `Erro ao cadastrar: ${error}` : `Veículo "${vehicle ? vehicleLabel(vehicle) : ''}" cadastrado com sucesso.`
      await logAiAction('criarVeiculo', vehicle?.id ?? null, { ...pendingAction.input }, error ? 'error' : 'success', error)
      break
    }
    case 'editarVeiculo': {
      const { error } = await updateVehicleAction(pendingAction.vehicleId, pendingAction.input)
      resultError = error
      message = error ? `Erro ao editar: ${error}` : `Veículo "${pendingAction.vehicleLabel}" atualizado com sucesso.`
      await logAiAction('editarVeiculo', pendingAction.vehicleId, { ...pendingAction.input, vehicleLabel: pendingAction.vehicleLabel }, error ? 'error' : 'success', error)
      break
    }
    case 'removerVeiculo': {
      const { error } = await archiveVehicle(pendingAction.vehicleId)
      resultError = error
      message = error ? `Erro ao remover: ${error}` : `Veículo "${pendingAction.vehicleLabel}" arquivado com sucesso.`
      await logAiAction('removerVeiculo', pendingAction.vehicleId, { vehicleLabel: pendingAction.vehicleLabel }, error ? 'error' : 'success', error)
      break
    }
    case 'marcarComoVendido': {
      const { error } = await markAsSold(pendingAction.vehicleId)
      resultError = error
      message = error ? `Erro: ${error}` : `Veículo "${pendingAction.vehicleLabel}" marcado como vendido.`
      await logAiAction('marcarComoVendido', pendingAction.vehicleId, { vehicleLabel: pendingAction.vehicleLabel }, error ? 'error' : 'success', error)
      break
    }
    case 'marcarComoDisponivel': {
      const { error } = await markAsAvailable(pendingAction.vehicleId)
      resultError = error
      message = error ? `Erro: ${error}` : `Veículo "${pendingAction.vehicleLabel}" marcado como disponível.`
      await logAiAction('marcarComoDisponivel', pendingAction.vehicleId, { vehicleLabel: pendingAction.vehicleLabel }, error ? 'error' : 'success', error)
      break
    }
    case 'definirDestaque': {
      const { error } = await updateVehicleAction(pendingAction.vehicleId, { isPremium: pendingAction.isPremium })
      resultError = error
      message = error ? `Erro: ${error}` : `Destaque do veículo "${pendingAction.vehicleLabel}" atualizado.`
      await logAiAction('definirDestaque', pendingAction.vehicleId, { isPremium: pendingAction.isPremium, vehicleLabel: pendingAction.vehicleLabel }, error ? 'error' : 'success', error)
      break
    }
  }

  return { message, error: resultError }
}

export async function cancelAiAction(pendingAction: PendingAction): Promise<void> {
  const vehicleId = 'vehicleId' in pendingAction ? pendingAction.vehicleId : null
  const label = 'vehicleLabel' in pendingAction ? pendingAction.vehicleLabel : undefined
  await logAiAction(pendingAction.tool, vehicleId, label ? { vehicleLabel: label } : {}, 'cancelled', null)
}

// ── Log de auditoria ──────────────────────────────────────────────────────────

export async function logAiAction(
  action: string,
  vehicleId: string | null,
  params: Record<string, unknown>,
  result: 'success' | 'error' | 'cancelled',
  errorMessage: string | null = null
): Promise<void> {
  const { userInfo } = await requireManagerOrError()
  if (!userInfo) return

  const supabase = createAdminClient()
  await supabase.from('ai_action_logs').insert({
    user_id: userInfo.userId,
    user_name: userInfo.name,
    action,
    vehicle_id: vehicleId,
    params,
    result,
    error_message: errorMessage,
  })
}

