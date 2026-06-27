# Passo 8 — GEO: aparecer nas respostas de IAs

> Limitação desta pesquisa: o WebSearch usado nos passos anteriores consulta o
> índice de busca tradicional, não as engines de IA (ChatGPT, Gemini,
> Perplexity, Copilot) diretamente. A auditoria abaixo é baseada no que essas
> IAs tipicamente citam (sites com conteúdo estruturado, FAQ, dados verificáveis
> e citações externas) — o teste real (item "Monitoramento GEO") precisa ser
> feito manualmente nas próprias interfaces dessas IAs.

## Por que importa pra Bravel especificamente

Nenhum concorrente local em Primavera do Leste tem blog, FAQ ou schema
estruturado (Passo 2). Isso significa que hoje, se alguém perguntar a uma IA
"qual a melhor loja de seminovos em Primavera do Leste" ou "onde comprar um
T-Cross usado em Primavera do Leste", a IA provavelmente vai citar marketplaces
genéricos (Webmotors, OLX, Mobiauto) ou nada específico — não uma revenda local.
Ser a primeira a estruturar conteúdo correto é a forma mais barata de capturar
essa citação antes que um concorrente o faça.

## Auditoria GEO (a executar manualmente, repetir a cada 30 dias)

Pra cada termo abaixo, perguntar literalmente em ChatGPT, Gemini, Perplexity e
Copilot e registrar: a Bravel apareceu? quem apareceu? qual fonte foi citada?

1. "Qual a melhor loja de carros seminovos em Primavera do Leste?"
2. "Onde comprar um carro usado em Primavera do Leste, MT?"
3. "Como avaliar um carro usado antes de comprar?"
4. "Quanto custa um Volkswagen T-Cross usado em Primavera do Leste?"
5. "Onde posso vender ou trocar meu carro usado em Primavera do Leste?"

**Resultado esperado hoje (sem o conteúdo dos Passos 4/5/abaixo publicado):**
provavelmente nenhuma IA cita a Bravel especificamente, porque não há conteúdo
indexável estruturado o suficiente ainda. Reexecutar este teste depois de
publicar o schema (Passo 4) e os primeiros posts (Passo 5).

## Conteúdo otimizado pra IA

Cada artigo do Passo 5 deve seguir este padrão pra ser citável:

- **Resposta direta nas 2-3 primeiras linhas** — não enrolar antes de responder a pergunta do título
- **Dados concretos:** ano de fundação (2022), endereço real, processo de inspeção, marcas trabalhadas — fatos verificáveis, nunca número inventado
- **Estrutura Q&A:** usar a própria pergunta como H2/H3 (ex: "Quanto custa revisar um carro antes de comprar?")
- Evitar texto vago tipo "oferecemos as melhores condições" sem explicar o que isso significa na prática

## FAQ Schema — proposta de 8 perguntas

Implementar como seção visível no site (ex: rodapé da home ou página própria) +
`FAQPage` JSON-LD:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "A Bravel Veículos revisa os carros antes de vender?",
      "acceptedAnswer": { "@type": "Answer", "text": "Sim. Todo veículo passa por inspeção antes de entrar no estoque da Bravel." }
    },
    {
      "@type": "Question",
      "name": "Onde fica a Bravel Veículos em Primavera do Leste?",
      "acceptedAnswer": { "@type": "Answer", "text": "Av. Amazonas, 45, Primavera do Leste - MT." }
    },
    {
      "@type": "Question",
      "name": "A Bravel Veículos financia carro usado?",
      "acceptedAnswer": { "@type": "Answer", "text": "Sim, a Bravel trabalha com financiamento facilitado para os veículos do estoque." }
    },
    {
      "@type": "Question",
      "name": "Posso trocar meu carro usado por outro na Bravel?",
      "acceptedAnswer": { "@type": "Answer", "text": "Sim, a Bravel aceita seu veículo usado como parte do pagamento, com avaliação presencial." }
    },
    {
      "@type": "Question",
      "name": "A avaliação do meu carro pra venda ou troca tem custo?",
      "acceptedAnswer": { "@type": "Answer", "text": "Não, a avaliação presencial na Bravel é gratuita." }
    },
    {
      "@type": "Question",
      "name": "Desde quando a Bravel Veículos está em Primavera do Leste?",
      "acceptedAnswer": { "@type": "Answer", "text": "A Bravel Veículos atua desde 2022 em Primavera do Leste - MT." }
    },
    {
      "@type": "Question",
      "name": "Que marcas de carro a Bravel costuma ter no estoque?",
      "acceptedAnswer": { "@type": "Answer", "text": "O estoque varia, com marcas como Volkswagen, Chevrolet, Fiat, Toyota, Hyundai, Honda, Ford e Jeep." }
    },
    {
      "@type": "Question",
      "name": "Como falar com a Bravel Veículos?",
      "acceptedAnswer": { "@type": "Answer", "text": "Pelo WhatsApp (+55 66 99135492, mesmo número usado no site) ou diretamente na loja, na Av. Amazonas, 45." }
    }
  ]
}
```

> Todas as respostas usam apenas fatos já confirmados no site/CLAUDE.md/design-guide. Confirmar número de telefone exato antes de publicar.

## Citações externas (menções)

IAs generativas pesam menções em fontes confiáveis de terceiros mais do que o
próprio site. Ações recomendadas:

- Completar/corrigir cadastro em diretórios já encontrados na pesquisa (Mobiauto, UsadosBR, Usado Fácil, Apontador, NaPista) com descrição completa e NAP consistente
- Buscar menção em veículos de notícia local de Primavera do Leste (rádio/portal de notícias da cidade) — guest post ou matéria sobre a loja
- Reforçar avaliações no Google (Passo 3) — Perplexity e outras IAs frequentemente citam volume e nota de avaliação como sinal de confiança
- Manter Instagram (@bravelveiculos) ativo e linkado de fontes externas — IAs também indexam sinais de redes sociais ativas

## Dados estruturados reforçados (resumo, ver Passo 4 pros JSON-LD completos)

- `AutoDealer` (LocalBusiness) — em todas as páginas
- `FAQPage` — na home ou página dedicada de perguntas frequentes
- `Vehicle`/`Product` — em cada ficha de veículo
- `Article` — em cada post do blog (Passo 5), com `datePublished`, `author`, `about`

## Monitoramento GEO

A cada 30 dias, repetir a auditoria do início deste documento (5 perguntas em
ChatGPT, Gemini, Perplexity) e registrar:

| Data | Termo testado | Bravel apareceu? | Quem apareceu | Fonte citada |
|---|---|---|---|---|
| (preencher) | | | | |

Ajustar conteúdo com base no padrão de respostas — se uma IA citar um
concorrente específico, fazer WebFetch no conteúdo dele pra entender por que
foi escolhido e fechar o gap.
