# Passo 4 — Otimização on-page

## Estado atual do site (verificado em código)

| Página | Title atual | Meta description atual | H1/H2 |
|---|---|---|---|
| `index.html` | "Bravel Veículos \| Primavera do Leste - MT" | "Bravel Veículos — Sua loja de carros seminovos em Primavera do Leste MT. Financiamento fácil, troca garantida e os melhores preços da região." | H1 no hero, H2 em estoque/sobre/avaliações/serviços/contato |
| `estoque.html` | "Estoque Completo \| Bravel Veículos" | "Estoque completo de seminovos na Bravel Veículos — Primavera do Leste MT..." | — |
| `veiculo.html` | dinâmico via JS, mas começa como "Carregando... \| Bravel Veículos" | dinâmico via JS (`id="metaDesc"`) | — |
| `vender.html` | "Vender meu veículo \| Bravel Veículos" | "Venda seu veículo com segurança. Agende uma avaliação presencial gratuita..." | — |

**Faltam em todo o site:** schema markup (JSON-LD), sitemap.xml, robots.txt, canonical tags, Open Graph/Twitter Card. Nenhum concorrente local tem isso (Passo 2) — é a maior vantagem técnica disponível agora.

## Mapeamento de palavras-chave por página

| Página | Keyword principal | Keywords secundárias |
|---|---|---|
| Home (`index.html`) | seminovos Primavera do Leste | carros usados Primavera do Leste, loja de carros MT |
| Estoque (`estoque.html`) | estoque de seminovos Primavera do Leste | carros usados à venda Primavera do Leste, SUV/picape/sedan usado |
| Ficha do veículo (`veiculo.html`) | `[marca] [modelo] usado Primavera do Leste` | `[modelo] [ano] preço`, `[modelo] usado MT` |
| Vender (`vender.html`) | vender meu carro Primavera do Leste | avaliação de carro usado, troca de carro usado |

## Meta tags otimizadas (propostas)

### Home
- **Title (56 car.):** `Bravel Veículos — Seminovos em Primavera do Leste MT`
- **Description (155 car.):** `Seminovos revisados com transparência em Primavera do Leste - MT. Financiamento, troca e avaliação grátis. Confira o estoque e fale no WhatsApp.`
- **H1 atual:** revisar texto pra incluir "seminovos" ou "Primavera do Leste" se ainda não estiver explícito no copy do hero

### Estoque
- **Title:** `Estoque de Seminovos à Venda em Primavera do Leste | Bravel Veículos`
- **Description:** `Veja todo o estoque atualizado de carros e motos seminovos da Bravel, em Primavera do Leste - MT. SUVs, picapes, sedans e hatches revisados.`

### Ficha do veículo (gerar dinamicamente, já há infraestrutura JS pra isso)
- **Title:** `[Marca] [Modelo] [Ano] usado em Primavera do Leste - MT | Bravel Veículos`
- **Description:** `[Marca] [Modelo] [versão] [ano], [km] km, R$ [preço]. Revisado e à venda na Bravel Veículos, Primavera do Leste - MT. Fale agora no WhatsApp.`
- Title/description devem puxar do mesmo objeto Supabase já usado em `vehicles.js` (`row.brand`, `row.model`, `row.year`, `row.price`) — não precisa de dado novo, só popular a tag dinamicamente como já é feito com `id="metaDesc"`

### Vender
- **Title:** `Venda ou Troque seu Carro em Primavera do Leste | Bravel Veículos`
- **Description:** `Avaliação presencial gratuita pro seu carro usado em Primavera do Leste - MT. Receba uma proposta na hora. Agende pelo WhatsApp.`

## Schema Markup (JSON-LD)

### LocalBusiness — incluir em todas as páginas (idealmente injetado uma vez no template/partial comum)

```json
{
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  "name": "Bravel Veículos",
  "image": "https://SEU-DOMINIO/site/fachada-bravel-completa.png",
  "url": "https://SEU-DOMINIO/",
  "telephone": "+5566999135492",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Av. Amazonas, 45 — CONFIRMAR BAIRRO",
    "addressLocality": "Primavera do Leste",
    "addressRegion": "MT",
    "postalCode": "78850-000",
    "addressCountry": "BR"
  },
  "sameAs": [
    "https://www.instagram.com/bravelveiculos/",
    "https://www.facebook.com/p/Bravel-Veiculos-100093341565830/"
  ]
}
```

> Confirmar bairro exato (ver inconsistência apontada no Passo 3) antes de publicar — schema com endereço errado é pior que não ter schema.

### Product/Vehicle — na ficha do veículo (`veiculo.html`), populado dinamicamente a partir dos mesmos dados do Supabase

```json
{
  "@context": "https://schema.org",
  "@type": "Vehicle",
  "name": "[Marca] [Modelo] [Versão]",
  "vehicleModelDate": "[Ano]",
  "mileageFromOdometer": { "@type": "QuantitativeValue", "value": "[KM]", "unitCode": "KMT" },
  "fuelType": "[Combustível]",
  "vehicleTransmission": "[Transmissão]",
  "offers": {
    "@type": "Offer",
    "price": "[Preço]",
    "priceCurrency": "BRL",
    "availability": "https://schema.org/InStock",
    "seller": { "@type": "AutoDealer", "name": "Bravel Veículos" }
  }
}
```

### FAQPage — ver Passo 8 (GEO), reaproveitar no on-page também

## Checklist técnico

| Item | Status | Ação |
|---|---|---|
| URLs amigáveis | ✅ (`/veiculo.html?id=...` — aceitável, mas avaliar slugs por nome se migrar de stack) | manter |
| Alt text em imagens | ⚠️ parcial — `index.html` tem alt em logo/fachada; conferir alt descritivo em todas as fotos de veículo (`alt="Marca Modelo Ano"` em vez de genérico) | ajustar |
| Mobile-friendly | ✅ (site já tem nav mobile, `mobile-whatsapp`, `mobile-location`) | manter |
| Sitemap.xml | ❌ não existe | criar e listar index, estoque, vender + fichas de veículo (gerar dinamicamente se possível) |
| Robots.txt | ❌ não existe | criar permitindo crawl total, apontando pro sitemap |
| Canonical tags | ❌ não existe | adicionar `<link rel="canonical">` em cada página |
| Open Graph / Twitter Card | ❌ não existe | adicionar `og:title`, `og:description`, `og:image` (usar foto de fachada ou do veículo), `og:type` |
| Velocidade de carregamento | não medido nesta pesquisa — recomendar rodar PageSpeed Insights após publicar mudanças | medir |
| Schema JSON-LD | ❌ não existe | implementar conforme acima |

## Internal linking sugerido

- Home → Estoque (já existe via CTA) → Ficha do veículo → WhatsApp
- Home → Vender (já existe?) — confirmar link visível no menu principal
- Ficha do veículo → "Veja outros [categoria] em estoque" (link pra estoque filtrado) — ainda não existe, é ganho de SEO e de conversão
- Futuro blog (Passo 5) → linkar pra fichas de veículo relevantes e pra `vender.html`
