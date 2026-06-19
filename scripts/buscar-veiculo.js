// Busca veículos no estoque (mesma base de dados do painel ADM) pelo nome, marca ou modelo.
// Lê da view pública `public_vehicles` (Supabase) — só traz carros com status "disponivel"
// e não arquivados, e só colunas seguras (sem status interno, datas de aquisição, etc).
//
// Uso: node --env-file=.env scripts/buscar-veiculo.js "<termo de busca>"
// Saída: JSON array no stdout — cada item é um veículo correspondente.

const termo = process.argv[2]

if (!termo || !termo.trim()) {
  console.error('Uso: node scripts/buscar-veiculo.js "<termo de busca>"')
  process.exit(1)
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltam variáveis de ambiente: SUPABASE_URL e/ou SUPABASE_ANON_KEY (.env na raiz do projeto).')
  process.exit(1)
}

async function main() {
  const like = `*${termo.trim()}*`
  const filter = `or=(name.ilike.${like},brand.ilike.${like},model.ilike.${like})`
  const url = `${SUPABASE_URL}/rest/v1/public_vehicles?select=*&${filter}&order=created_at.desc&limit=10`

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error(`Erro ao consultar Supabase (${res.status}): ${detail.slice(0, 300)}`)
    process.exit(1)
  }

  const rows = await res.json()
  console.log(JSON.stringify(rows, null, 2))
}

main().catch((err) => {
  console.error('Falha inesperada na busca:', err.message)
  process.exit(1)
})
