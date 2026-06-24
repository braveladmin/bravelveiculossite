import type { UserInfo } from '@/lib/actions/vehicles'

// FASE 1 (sem OAuth ainda): identidade fixa só pra validar a lógica das
// tools localmente via MCP Inspector, sem depender do handshake OAuth real.
//
// FASE 2 troca isso por uma leitura de extra.authInfo (preenchido por
// withMcpAuth a partir do token Bearer, resolvido contra a tabela
// mcp_tokens) — NUNCA deve ir pra produção com esse stub.
export function resolveMcpUser(): UserInfo {
  return { userId: 'mcp-dev', role: 'SUPER_ADMIN', name: 'Conector MCP (dev)' }
}
