# Setup da Meta Graph API — publicar no Instagram via Claude

Configuração feita uma vez só. Depois disso, `/postar-veiculo` e `/aprovar-post`
publicam direto, sem passar pelo app do Instagram.

## O que você precisa ter

- Conta Instagram **Business** ou **Creator** (não funciona com conta pessoal)
- Essa conta Instagram conectada a uma **Página do Facebook**
- Acesso de administrador a essa Página

## Passo 1 — Criar o app na Meta

1. Acesse [developers.facebook.com/apps](https://developers.facebook.com/apps) e crie um app
   tipo **Business**.
2. No painel do app, adicione o produto **Instagram Graph API** (ou "Instagram" conforme
   o nome aparecer no momento).

## Passo 2 — Conseguir o Page Access Token

1. Vá em **Ferramentas > Graph API Explorer** (dentro do app criado).
2. Selecione o app, depois selecione a **Página do Facebook** conectada à conta Instagram.
3. Peça as permissões: `instagram_basic`, `instagram_content_publish`, `pages_show_list`,
   `pages_read_engagement`.
4. Gere o token. Esse token de "User Token" expira rápido — troque por um de longa duração:

```bash
curl -s "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=<APP_ID>&client_secret=<APP_SECRET>&fb_exchange_token=<TOKEN_CURTO>"
```

5. Com o token de longa duração (User Token, dura ~60 dias), busque o **Page Access Token**
   (esse não expira enquanto a Página existir e o app continuar com permissão):

```bash
curl -s "https://graph.facebook.com/v21.0/me/accounts?access_token=<USER_TOKEN_LONGO>"
```

Isso retorna a lista de Páginas e o `access_token` de cada uma — é esse valor que vai em
`META_PAGE_ACCESS_TOKEN`.

## Passo 3 — Achar o ID da conta Instagram Business

```bash
curl -s "https://graph.facebook.com/v21.0/<PAGE_ID>?fields=instagram_business_account&access_token=<PAGE_ACCESS_TOKEN>"
```

O `id` retornado dentro de `instagram_business_account` é o `META_IG_USER_ID`.

## Passo 4 — Preencher o `.env`

Na raiz do projeto, edite o arquivo `.env` (já existe com `SUPABASE_URL`/`SUPABASE_ANON_KEY`
preenchidos) e complete:

```bash
META_PAGE_ACCESS_TOKEN=cole_o_token_aqui
META_IG_USER_ID=cole_o_id_aqui
```

Esse arquivo nunca é commitado (está no `.gitignore`).

## Testando

Peça pro Claude rodar `/postar-veiculo <nome de um carro>` — ele busca o carro, gera a
prévia e só publica de fato depois que você confirmar.

## Problemas comuns

- **"Invalid OAuth access token"** — token expirou ou não tem as permissões certas. Repita
  o passo 2.
- **"Media type is not supported"** — confira que a imagem é JPEG/PNG publicamente acessível
  (as fotos do estoque já são, vêm do Supabase Storage).
- **Token expira de novo depois de uns dias** — Page Access Token gerado a partir de um User
  Token de 60 dias não expira sozinho, mas se o usuário trocar a senha ou revogar o app, é
  preciso gerar tudo de novo.
