export type UserRole = 'SUPER_ADMIN' | 'INVENTORY_MANAGER' | 'VENDEDOR'

export const CATEGORIES = ['Hatch', 'Sedan', 'SUV', 'Pickup', 'Van', 'Conversível', 'Coupé', 'Moto', 'Elétrico', 'Outro']

export const STATUS_CFG = {
  disponivel:    { label: 'Disponível',  chipColor: 'success' as const },
  reservado:     { label: 'Reservado',   chipColor: 'warning' as const },
  vendido:       { label: 'Vendido',     chipColor: 'default' as const },
  em_preparacao: { label: 'Em preparo',  chipColor: 'default' as const },
} as const

// ── Central de Mídias ───────────────────────────────────────────────────────

export const MEDIA_TYPE_CFG = {
  story:    { label: 'Story',     chipColor: 'default' as const },
  post:     { label: 'Post',      chipColor: 'default' as const },
  carousel: { label: 'Carrossel', chipColor: 'default' as const },
} as const

export const MEDIA_STATUS_CFG = {
  draft:    { label: 'Rascunho',  chipColor: 'warning' as const },
  saved:    { label: 'Salvo',     chipColor: 'success' as const },
  archived: { label: 'Arquivado', chipColor: 'default' as const },
} as const

// Dados fixos da loja, usados nos previews e legendas geradas
export const STORE_NAME     = 'Bravel Veículos'
export const STORE_CITY     = 'Primavera do Leste, MT'
export const STORE_WHATSAPP = '(66) 9913-5492'

// Vendedores — contato sempre incluído no final das legendas geradas
export const SELLERS = [
  { name: 'Elso Baraldi Jr', phone: '(66) 99640-1560' },
  { name: 'José Longhi',     phone: '(65) 99644-5954' },
] as const
