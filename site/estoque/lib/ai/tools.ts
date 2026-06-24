// Definições de tool no formato esperado pela API da Anthropic (tool-use).
// Isso é a única superfície de ação que o Claude tem nessa feature — não existe
// (e nunca deve existir) uma tool de SQL livre ou execução de código. Cada tool
// daqui mapeia 1:1 pra uma função de backend já existente (ver lib/actions/aiCommands.ts).

export type ToolDefinition = {
  name: string
  description: string
  input_schema: {
    type: "object"
    properties: Record<string, unknown>
    required?: string[]
  }
}

// Tools que não mudam nada — executam direto e o resultado volta pro Claude
// formular a resposta em linguagem natural.
export const SAFE_TOOLS = [
  "listarVeiculos",
  "gerarLegendaInstagram",
  "gerarPreviewPostInstagram",
  "publicarInstagram",
] as const

// Tools que alteram o estoque de verdade — NUNCA executadas direto. A wrapper
// só valida e devolve uma prévia estruturada; a execução real só acontece depois
// que o usuário clica em "Confirmar" no card (ver confirmAiAction).
export const DANGEROUS_TOOLS = [
  "criarVeiculo",
  "editarVeiculo",
  "removerVeiculo",
  "marcarComoVendido",
  "marcarComoDisponivel",
  "definirDestaque",
] as const

export type SafeToolName = typeof SAFE_TOOLS[number]
export type DangerousToolName = typeof DANGEROUS_TOOLS[number]

export const ALL_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "listarVeiculos",
    description:
      "Lista veículos do estoque (não arquivados), com filtros opcionais. Use pra responder perguntas como 'quais carros eu tenho', 'tem algum Civic disponível', 'quanto custa o T-Cross'.",
    input_schema: {
      type: "object",
      properties: {
        busca: { type: "string", description: "Texto livre pra buscar no nome/marca/modelo do veículo" },
        marca: { type: "string", description: "Filtra por marca exata, ex: Volkswagen" },
        status: { type: "string", enum: ["disponivel", "vendido", "reservado"], description: "Filtra por status" },
        categoria: { type: "string", description: "Filtra por categoria, ex: SUV, Hatch" },
        precoMin: { type: "number", description: "Preço mínimo em reais" },
        precoMax: { type: "number", description: "Preço máximo em reais" },
      },
    },
  },
  {
    name: "gerarLegendaInstagram",
    description:
      "Gera a legenda padrão (texto comercial + hashtags) pra um veículo, usando o template já calibrado da loja. Não cria nem salva nada, só devolve o texto.",
    input_schema: {
      type: "object",
      properties: {
        vehicleId: { type: "string", description: "ID do veículo" },
      },
      required: ["vehicleId"],
    },
  },
  {
    name: "gerarPreviewPostInstagram",
    description:
      "Monta os parâmetros de uma arte (Story, Post ou Carrossel) pra um veículo, pra o usuário ver a prévia visual real antes de decidir baixar, salvar ou postar. Não publica nada, não gera nenhuma imagem ainda — isso só acontece depois que o usuário interage com a prévia mostrada na tela.",
    input_schema: {
      type: "object",
      properties: {
        vehicleId: { type: "string", description: "ID do veículo" },
        mediaType: { type: "string", enum: ["story", "post", "carousel"], description: "Formato da arte" },
        caption: { type: "string", description: "Legenda customizada. Se omitido, usa a legenda padrão gerada automaticamente." },
      },
      required: ["vehicleId", "mediaType"],
    },
  },
  {
    name: "publicarInstagram",
    description:
      "Use quando o usuário já pediu explicitamente pra PUBLICAR (não só ver a prévia) um Story ou Carrossel de um veículo no Instagram da loja. Mesmo assim, o sistema sempre mostra a prévia de novo e exige um clique de confirmação final do usuário antes de publicar de fato — essa tool nunca publica por conta própria.",
    input_schema: {
      type: "object",
      properties: {
        vehicleId: { type: "string", description: "ID do veículo" },
        mediaType: { type: "string", enum: ["story", "carousel"], description: "O Instagram só aceita publicação automática de Story ou Carrossel, não Post" },
        caption: { type: "string", description: "Legenda customizada. Se omitido, usa a legenda padrão gerada automaticamente." },
      },
      required: ["vehicleId", "mediaType"],
    },
  },
  {
    name: "criarVeiculo",
    description:
      "Propõe o cadastro de um veículo novo no estoque. NUNCA chame essa tool sem ter pelo menos nome, marca, modelo, ano, quilometragem e preço — se faltar algum desses, pergunte ao usuário antes de chamar a tool. Não inventa nem assume valores pra esses campos.",
    input_schema: {
      type: "object",
      properties: {
        name:         { type: "string", description: "Nome/versão completo, ex: 'T-Cross Comfortline'" },
        brand:        { type: "string", description: "Marca, ex: Volkswagen" },
        model:        { type: "string", description: "Modelo, ex: T-Cross" },
        year:         { type: "number", description: "Ano de fabricação" },
        yearModel:    { type: "number", description: "Ano modelo, se diferente do ano de fabricação" },
        km:           { type: "number", description: "Quilometragem atual" },
        price:        { type: "number", description: "Preço em reais" },
        color:        { type: "string" },
        category:     { type: "string", description: "Ex: SUV, Hatch, Sedan, Pickup" },
        transmission: { type: "string", description: "Ex: Manual, Automático" },
        fuel:         { type: "string", description: "Ex: Flex, Diesel" },
        doors:        { type: "number" },
        motor:        { type: "string", description: "Ex: '1.0 TSI'" },
        optionals:    { type: "array", items: { type: "string" }, description: "Lista de opcionais/equipamentos" },
        isPremium:    { type: "boolean", description: "Marca como carro premium/destaque" },
        isNew:        { type: "boolean", description: "Marca selo de novidade no estoque" },
      },
      required: ["name", "brand", "model", "year", "km", "price"],
    },
  },
  {
    name: "editarVeiculo",
    description: "Propõe alterar um ou mais campos de um veículo já cadastrado.",
    input_schema: {
      type: "object",
      properties: {
        vehicleId:    { type: "string", description: "ID do veículo a editar" },
        name:         { type: "string" },
        brand:        { type: "string" },
        model:        { type: "string" },
        year:         { type: "number" },
        yearModel:    { type: "number" },
        km:           { type: "number" },
        price:        { type: "number" },
        color:        { type: "string" },
        category:     { type: "string" },
        transmission: { type: "string" },
        fuel:         { type: "string" },
        doors:        { type: "number" },
        motor:        { type: "string" },
        optionals:    { type: "array", items: { type: "string" } },
      },
      required: ["vehicleId"],
    },
  },
  {
    name: "removerVeiculo",
    description:
      "Propõe arquivar (remover das listagens) um veículo. É reversível — o veículo só fica arquivado, não é apagado de verdade do banco.",
    input_schema: {
      type: "object",
      properties: {
        vehicleId: { type: "string", description: "ID do veículo a remover" },
      },
      required: ["vehicleId"],
    },
  },
  {
    name: "marcarComoVendido",
    description: "Propõe marcar um veículo como VENDIDO.",
    input_schema: {
      type: "object",
      properties: {
        vehicleId: { type: "string", description: "ID do veículo" },
      },
      required: ["vehicleId"],
    },
  },
  {
    name: "marcarComoDisponivel",
    description: "Propõe marcar um veículo como DISPONÍVEL novamente (ex: desfazer uma venda registrada por engano).",
    input_schema: {
      type: "object",
      properties: {
        vehicleId: { type: "string", description: "ID do veículo" },
      },
      required: ["vehicleId"],
    },
  },
  {
    name: "definirDestaque",
    description:
      "Propõe marcar ou desmarcar o selo 'Carro premium / Destaque especial no estoque' de um veículo. Não afeta o selo separado de 'Novidade no estoque'.",
    input_schema: {
      type: "object",
      properties: {
        vehicleId:  { type: "string", description: "ID do veículo" },
        isPremium:  { type: "boolean", description: "true pra destacar, false pra remover o destaque" },
      },
      required: ["vehicleId", "isPremium"],
    },
  },
]
