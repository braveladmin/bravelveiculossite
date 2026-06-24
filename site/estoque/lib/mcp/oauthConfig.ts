// URL pública do app, incluindo o basePath "/admin" (next.config.ts) — todas
// as rotas desse projeto, inclusive /.well-known/* e /oauth/*, são servidas
// sob esse prefixo. O issuer do authorization server é esse mesmo caminho
// (convenção OIDC Discovery: metadata fica em "{issuer}/.well-known/X", ou
// seja, o well-known some DEPOIS do path do issuer — é exatamente o que o
// basePath do Next já faz sozinho, sem rewrite especial).
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export const ISSUER_URL = `${SITE_URL}/admin`
export const MCP_RESOURCE_URL = `${ISSUER_URL}/api/mcp`
