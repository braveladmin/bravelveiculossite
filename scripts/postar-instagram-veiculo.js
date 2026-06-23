// Publica um post de veículo (foto única ou carrossel) no Instagram via Meta Graph API.
//
// Uso: node --env-file=.env scripts/postar-instagram-veiculo.js <caminho-do-payload.json>
// payload.json: { "images": ["https://...", ...], "caption": "legenda final com hashtags" }
//
// Saída: JSON { "postId": "...", "permalink": "..." } no stdout em caso de sucesso.

const fs = require('fs')

const GRAPH_VERSION = 'v21.0'
const GRAPH_BASE = `https://graph.instagram.com/${GRAPH_VERSION}`

const payloadPath = process.argv[2]
if (!payloadPath) {
  console.error('Uso: node scripts/postar-instagram-veiculo.js <caminho-do-payload.json>')
  process.exit(1)
}

const ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN
const IG_USER_ID = process.env.META_IG_USER_ID

if (!ACCESS_TOKEN || !IG_USER_ID) {
  console.error('Faltam variáveis de ambiente: META_PAGE_ACCESS_TOKEN e/ou META_IG_USER_ID (.env na raiz do projeto).')
  console.error('Veja o guia de setup em marketing/automacao-meta-setup.md')
  process.exit(1)
}

function readPayload(path) {
  const raw = fs.readFileSync(path, 'utf8')
  const data = JSON.parse(raw)
  if (!Array.isArray(data.images) || data.images.length === 0) {
    throw new Error('payload.images deve ser um array com ao menos 1 URL de imagem')
  }
  if (typeof data.caption !== 'string' || !data.caption.trim()) {
    throw new Error('payload.caption é obrigatório')
  }
  return data
}

async function graphPost(path, body) {
  const url = `${GRAPH_BASE}/${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: ACCESS_TOKEN }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) {
    const msg = data.error?.message || `HTTP ${res.status}`
    throw new Error(`Graph API (${path}) falhou: ${msg}`)
  }
  return data
}

async function graphGet(path, params) {
  const qs = new URLSearchParams({ ...params, access_token: ACCESS_TOKEN }).toString()
  const res = await fetch(`${GRAPH_BASE}/${path}?${qs}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) {
    const msg = data.error?.message || `HTTP ${res.status}`
    throw new Error(`Graph API (${path}) falhou: ${msg}`)
  }
  return data
}

async function waitUntilFinished(containerId, timeoutMs = 60_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const { status_code } = await graphGet(containerId, { fields: 'status_code' })
    if (status_code === 'FINISHED') return
    if (status_code === 'ERROR') throw new Error(`Container ${containerId} entrou em estado ERROR`)
    await new Promise((r) => setTimeout(r, 2000))
  }
  throw new Error(`Container ${containerId} não ficou pronto em ${timeoutMs / 1000}s`)
}

async function publishSingleImage(images, caption) {
  const { id: creationId } = await graphPost(`${IG_USER_ID}/media`, {
    image_url: images[0],
    caption,
  })
  await waitUntilFinished(creationId)
  return creationId
}

async function publishCarousel(images, caption) {
  if (images.length > 10) {
    throw new Error('Instagram permite no máximo 10 imagens por carrossel')
  }

  const childIds = []
  for (const imageUrl of images) {
    const { id } = await graphPost(`${IG_USER_ID}/media`, {
      image_url: imageUrl,
      is_carousel_item: true,
    })
    await waitUntilFinished(id)
    childIds.push(id)
  }

  const { id: creationId } = await graphPost(`${IG_USER_ID}/media`, {
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption,
  })
  await waitUntilFinished(creationId)
  return creationId
}

async function main() {
  const { images, caption } = readPayload(payloadPath)

  const creationId = images.length === 1
    ? await publishSingleImage(images, caption)
    : await publishCarousel(images, caption)

  const { id: postId } = await graphPost(`${IG_USER_ID}/media_publish`, { creation_id: creationId })
  const { permalink } = await graphGet(postId, { fields: 'permalink' }).catch(() => ({ permalink: null }))

  console.log(JSON.stringify({ postId, permalink }, null, 2))
}

main().catch((err) => {
  console.error('Falha ao publicar no Instagram:', err.message)
  process.exit(1)
})
