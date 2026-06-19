export type VehicleStatus = "disponivel" | "vendido" | "reservado" | "em_preparacao"

export type Vehicle = {
  id: string
  name: string
  brand: string
  model: string
  year: number
  yearModel?: number
  km: number
  color: string
  category: string
  transmission: string
  fuel: string
  doors: number
  motor: string
  optionals: string[]
  isPremium: boolean
  images: string[]
  imageUrl: string
  price: number
  status: VehicleStatus
  createdAt: string
  acquiredAt: string
  soldAt?: string
  archivedAt?: string
}

// ── Central de Mídias ───────────────────────────────────────────────────────

export type MediaType = "story" | "post" | "carousel"
export type MediaStatus = "draft" | "saved" | "archived"

export type MediaDimensions = {
  width: number
  height: number
  aspectRatio: string
  slideCount?: number
}

export type MediaFolder = {
  id: string
  vehicleId: string
  folderName: string
  createdAt: string
  updatedAt: string
}

export type GeneratedMedia = {
  id: string
  vehicleId: string
  folderId: string
  mediaType: MediaType
  title: string
  previewData: Record<string, unknown>
  caption: string
  hashtags: string[]
  dimensions: MediaDimensions
  aspectRatio: string
  status: MediaStatus
  createdAt: string
  updatedAt: string
}

export type GeneratedMediaWithRelations = GeneratedMedia & {
  vehicleName: string
  folderName: string
}
