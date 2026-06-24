import type { MediaType } from "@/lib/types"
import type { VehicleFormInput } from "@/lib/actions/vehicles"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

// Ações que a IA pode propor mas nunca executa por conta própria — sempre
// precisam de confirmação explícita do usuário (clique em "Confirmar" no card).
export type PendingAction =
  | { tool: "criarVeiculo"; summary: string; input: VehicleFormInput }
  | { tool: "editarVeiculo"; summary: string; vehicleId: string; vehicleLabel: string; input: Partial<VehicleFormInput> }
  | { tool: "removerVeiculo"; summary: string; vehicleId: string; vehicleLabel: string }
  | { tool: "marcarComoVendido"; summary: string; vehicleId: string; vehicleLabel: string }
  | { tool: "marcarComoDisponivel"; summary: string; vehicleId: string; vehicleLabel: string }
  | { tool: "definirDestaque"; summary: string; vehicleId: string; vehicleLabel: string; isPremium: boolean }

// Resultado de gerarPreviewPostInstagram — não é uma PendingAction porque não
// muda nada por si só, só monta os parâmetros pro client renderizar o preview
// real (StoryPreview/PostPreview/CarouselPreview) e oferecer baixar/salvar/postar.
export type MediaPreviewParams = {
  vehicleId: string
  vehicleLabel: string
  mediaType: MediaType
  photos: string[]
  caption: string
  hashtags: string[]
}

export type RunAiCommandResult = {
  reply: string
  pendingAction: PendingAction | null
  mediaPreview: MediaPreviewParams | null
  error: string | null
}

export type ConfirmAiActionResult = {
  message: string
  error: string | null
}
