import { createMcpHandler } from "mcp-handler"
import { registerMcpTools } from "@/lib/mcp/tools"

// FASE 1: sem autenticação ainda — só pra validar a lógica das tools
// localmente com o MCP Inspector. NUNCA expor esse endpoint em produção
// sem o OAuth da Fase 2 (withMcpAuth) envolvendo esse handler.
const handler = createMcpHandler(
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

export { handler as GET, handler as POST, handler as DELETE }
