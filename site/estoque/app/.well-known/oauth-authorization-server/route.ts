import { NextResponse } from "next/server"
import { ISSUER_URL } from "@/lib/mcp/oauthConfig"

export async function GET() {
  return NextResponse.json({
    issuer: ISSUER_URL,
    authorization_endpoint: `${ISSUER_URL}/oauth/authorize`,
    token_endpoint: `${ISSUER_URL}/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "none"],
    scopes_supported: ["estoque"],
  })
}
