---
name: postar-veiculo
description: >
  Busca um carro no estoque (mesma base do painel ADM), gera a legenda do post de
  Instagram, mostra a prévia (fotos + legenda + hashtags) e só publica no feed depois
  da sua confirmação. Use quando o usuário disser "poste o <carro> no Instagram",
  "/postar-veiculo <nome>", "quero anunciar o <carro> no Insta", ou pedir pra divulgar
  um veículo específico do estoque nas redes.
---

# /postar-veiculo — Anúncio de veículo no Instagram, direto do estoque

Pipeline: você dá o comando com o nome do carro → eu busco no estoque (Supabase, mesma
base do painel ADM) → escrevo a legenda → te mostro a prévia → só publico se você
confirmar.

## Quando NÃO usar

- Carro não está cadastrado no painel ADM ainda → cadastrar lá primeiro
- Usuário quer postar conteúdo institucional/blog → isso é `/aprovar-post`
- Usuário ainda não decidiu qual carro → listar os disponíveis e perguntar primeiro

## Pré-requisitos

- `.env` na raiz com `SUPABASE_URL` e `SUPABASE_ANON_KEY` (já devem estar preenchidos —
  é o mesmo projeto Supabase do painel ADM em `site/estoque/`)
- Para a publicação de fato (não pra prévia): `META_PAGE_ACCESS_TOKEN` e `META_IG_USER_ID`
  no `.env`. Se faltarem, ainda dá pra gerar a prévia — só avisar antes do passo de
  publicar e apontar pro guia `marketing/automacao-meta-setup.md`.

## Argumento

`/postar-veiculo <termo de busca>` — nome, marca, modelo ou cor do carro.

Exemplos: `/postar-veiculo Onix vermelho`, `/postar-veiculo Tracker`, ou em linguagem
natural: "poste o Civic prata no Instagram".

Se o usuário não informar nenhum termo, perguntar qual carro antes de continuar.

## Workflow

### Passo 1 — Buscar o carro no estoque

```bash
node --env-file=.env scripts/buscar-veiculo.js "<termo>"
```

Isso consulta a view `public_vehicles` no Supabase — a mesma base de dados do painel
ADM, só que filtrada para carros com status "disponível" e não arquivados (não dá pra
anunciar um carro já vendido ou arquivado).

- **0 resultados** → avisar que não achou nenhum carro disponível com esse termo,
  sugerir conferir o nome ou se o carro está marcado como vendido/reservado no painel.
- **1 resultado** → seguir pro passo 2.
- **2+ resultados** → listar (nome, ano, cor, km, preço) numerados e perguntar qual.

### Passo 2 — Validar fotos

Se `images` vier vazio, parar e avisar: "Esse carro não tem fotos cadastradas no painel
ADM. Adicione ao menos uma foto antes de postar."

### Passo 3 — Escrever a legenda

Você (Claude) escreve a legenda diretamente — não precisa chamar nenhuma API de IA
externa, você já é o modelo gerando a resposta. Use **somente** os dados retornados pela
busca. Nunca invente specs, nunca prometa algo que não está nos dados.

Dados disponíveis por carro: `name`, `brand`, `model`, `year`, `year_model`, `km`,
`color`, `category`, `transmission`, `fuel`, `motor`, `optionals`, `images`, `price`.

Dados fixos da loja (usar sempre que precisar de CTA/contato):
- Loja: Bravel Veículos
- Cidade: Primavera do Leste — MT
- WhatsApp: (66) 9913-5492

Regras da legenda:
- Tom comercial, direto e persuasivo, focado em gerar contato pelo WhatsApp.
- Emojis com moderação.
- **Nunca** inventar informação que não veio do banco.
- **Nunca** usar "único dono", "garantia", "aprovado", "sem entrada", "financiamento
  garantido", "menor preço" ou qualquer promessa comercial que não esteja explícita nos
  dados do carro.
- Listar os principais atributos (ano, km, câmbio, combustível, cor, opcionais
  relevantes).
- Incluir uma chamada para ação clara (WhatsApp).
- 5 a 12 hashtags relacionadas (marca, modelo, categoria, cidade, `#bravelveiculos`,
  `#carrosusados` etc).

Monte mentalmente (não precisa ser JSON, é só estrutura de raciocínio):
- `short_title` — nome curto pra identificar o carro
- `cover_text` — texto curto pra capa do carrossel
- `caption` — legenda completa
- `hashtags` — lista
- `missing_fields` — campos importantes que vieram vazios (ex: sem cor, sem km)
- `risk_flags` — qualquer alerta (ex: preço ausente, poucas fotos)

### Passo 4 — Mostrar a prévia e pedir confirmação

Mostrar pro usuário, na conversa:
- Miniaturas/links das fotos (quantas tem)
- Texto da capa
- Legenda completa
- Hashtags
- Campos ausentes / alertas, se houver

Perguntar: **"Confirma publicação no Instagram? (sim / quero editar a legenda / não)"**

- Se o usuário pedir ajuste → editar e mostrar de novo.
- Se "não" → parar, não publicar, não salvar nada.
- Só seguir pro passo 5 com "sim" explícito.

### Passo 5 — Checar credenciais da Meta

Se `META_PAGE_ACCESS_TOKEN` ou `META_IG_USER_ID` não estiverem no `.env`: parar aqui,
avisar que a prévia está pronta mas falta configurar a publicação, e apontar pro guia
`marketing/automacao-meta-setup.md`. Não tentar publicar sem isso.

### Passo 6 — Publicar

1. Escrever o payload em `marketing/veiculos-instagram/.tmp-<slug-do-carro>.json`:
   ```json
   { "images": ["<url1>", "<url2>", ...], "caption": "<legenda final>\n\n<hashtags separadas por espaço>" }
   ```
2. Rodar:
   ```bash
   node --env-file=.env scripts/postar-instagram-veiculo.js marketing/veiculos-instagram/.tmp-<slug-do-carro>.json
   ```
3. Se falhar, mostrar o erro da Meta API tal como veio (geralmente já explica o problema:
   token expirado, imagem inválida, etc) e parar — não tentar de novo automaticamente.
4. Se publicar com sucesso, capturar `postId` e `permalink`.

### Passo 7 — Registrar histórico

Adicionar uma entrada em `marketing/veiculos-instagram/historico.json` (criar o arquivo
com `[]` se não existir):

```json
{
  "vehicleId": "<id do carro>",
  "vehicleName": "<name>",
  "postedAt": "<timestamp ISO>",
  "postId": "<postId>",
  "permalink": "<permalink>",
  "caption": "<legenda final>"
}
```

Apagar o arquivo temporário `.tmp-*.json` usado no passo 6.

### Passo 8 — Resumo final

```
✓ Postado no Instagram: <short_title>
Link: <permalink>
```

## Tratamento de erro

- Busca no Supabase falhou (rede, env faltando) → relatar e parar, não inventar dados.
- Carro sem fotos → parar no passo 2, não gerar legenda.
- Faltam credenciais Meta → gerar e mostrar a prévia mesmo assim, só não publicar.
- Falha na Meta API → relatar o erro exato, não marcar como postado no histórico.

## Princípios

1. **Nunca publicar sem confirmação explícita do usuário.**
2. **Nunca inventar dado do carro.** Se faltar informação, listar em `missing_fields` na
   prévia em vez de supor.
3. **Idempotência mínima:** antes de gerar a prévia, dar uma olhada rápida em
   `marketing/veiculos-instagram/historico.json` — se esse mesmo `vehicleId` já foi
   postado recentemente, avisar o usuário antes de seguir ("esse carro já foi postado em
   DD/MM, quer postar de novo?").
