import { createMcpHandler, withMcpAuth } from "mcp-handler"
import { registerMcpTools } from "@/lib/mcp/tools"
import { verifyAccessToken } from "@/lib/mcp/oauthStore"
import { createAdminClient } from "@/lib/supabase/admin"

const baseHandler = createMcpHandler(
  (server) => {
    registerMcpTools(server)
  },
  {
    serverInfo: { name: "bravel-estoque", version: "1.0.0" },
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: true,
    disableSse: true,
  }
)

const handler = withMcpAuth(
  baseHandler,
  async (_req, bearerToken) => {
    if (!bearerToken) return undefined
    const verified = await verifyAccessToken(bearerToken)
    if (!verified) return undefined

    const supabase = createAdminClient()
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, name, active")
      .eq("id", verified.userId)
      .single()

    if (!profile || !profile.active || profile.role === "VENDEDOR") return undefined

    return {
      token: bearerToken,
      clientId: verified.clientId,
      scopes: verified.scope ? verified.scope.split(" ") : ["estoque"],
      extra: { userId: verified.userId, role: profile.role, name: profile.name },
    }
  },
  { required: true }
)

export { handler as GET, handler as POST, handler as DELETE }
