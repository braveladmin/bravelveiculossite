# Passo 2 — Análise de concorrência

> Pesquisa via WebSearch + WebFetch (junho/2026) nos top termos do Passo 1.

## Concorrentes locais (Primavera do Leste)

| Concorrente | Endereço | Tipo | Site próprio | Observação |
|---|---|---|---|---|
| **Multi Carros** | Av. Amazonas, 76 — Centro | Revenda multimarca | não identificado | **Vizinho direto** — mesma avenida que a Bravel (Av. Amazonas, 45). Anuncia "0% de entrada, sujeito a aprovação" |
| **Dias Veículos** | Primavera do Leste | Revenda multimarca | diasveiculos.etc.br | Site com Estoque, Venda seu Carro, Consórcio, Financiamento, Seguro, Sobre. Avaliação online do carro |
| **Leste Car Veículos** | Primavera do Leste | Revenda multimarca | lestecar.com | No mercado desde 2005 (~20 anos) — usa isso como diferencial. Comprar/Vender/Financiar/Consignação |
| **ShopCar Seminovos** | Av. Belo Horizonte, 566 — Centro Leste | Revenda multimarca | shopcarseminovos.com (site instável — erro de SSL no fetch) | Presente em Mobiauto e Usado Fácil |
| **Chevrolet Zaher** | R. Rio de Janeiro, 2953 — Cidade Primavera IV | Concessionária autorizada Chevrolet | chevroletzaher.com.br | Vende seminovo + novo + oficina autorizada — força de marca que a Bravel não compete de frente |
| **Vamos Seminovos** | MT-130, km 7 — Distrito Industrial | Rede nacional de seminovos (Vamos) | vamos.com.br | Rede grande, foco em frota/caminhões e seminovos corporativos |
| **Paraná Veículos** | Av. Paraná, 286 | Revenda multimarca | não identificado | Compra/venda/financiamento/troca |
| **Super Auto Veículos** | Primavera do Leste | Revenda multimarca | listado em Usado Fácil, sem site próprio identificado | |

## Marketplaces nacionais (aparecem em quase toda busca local)

Webmotors, Mobiauto, OLX, iCarros, UsadosBR, Usado Fácil, Chaves na Mão, NaPista,
MercadoLivre. A Bravel **já está listada** em UsadosBR, Mobiauto, Facebook e Usado
Fácil — presença de distribuição existe, mas indexação/SEO do site próprio é o que
falta pra capturar a busca direta por marca.

## Análise dos 3 concorrentes com site próprio (WebFetch)

### Dias Veículos
- Páginas: Estoque, Venda seu Carro, Consórcio, Financiamento, Seguro, Sobre
- Mensagem central: "melhores taxas para você" no crédito
- Sem FAQ, sem schema estruturado identificado
- Tem seção "Últimas novidades" com 3 carros em destaque (Saveiro, Toro, Creta)

### Leste Car Veículos
- Páginas: Home, Sobre, Comprar, Vender, Financiar, Contato
- Mensagem central: transparência, profissionalismo, qualidade — **mesmo posicionamento da Bravel** ("Transparência do início ao fim")
- Diferencial deles: 20 anos de mercado (autoridade por tempo) — Bravel não tem esse argumento, precisa compensar com prova social (avaliações Google) e conteúdo
- Sem FAQ, sem schema estruturado, sem blog

### ShopCar Seminovos
- Site fora do ar no momento do fetch (erro SSL) — risco técnico que pode estar afetando o ranking deles agora; vale reverificar em 30 dias

## Gaps identificados (nenhum concorrente local faz bem)

1. **Nenhum concorrente local tem blog ou conteúdo informacional.** Todos são puramente catálogo + formulário. Abre espaço pra Bravel dominar buscas informacionais ("como avaliar carro usado", "documentação pra comprar carro usado") e aparecer em IAs (GEO).
2. **Nenhum tem FAQ ou schema markup (JSON-LD)** — nem LocalBusiness, nem FAQPage, nem Product/Vehicle. Implementar isso é vantagem técnica direta.
3. **Nenhum site local usa páginas por modelo/categoria otimizadas** (ex: "T-Cross usado Primavera do Leste") — todos dependem só do catálogo dinâmico sem SEO de página.
4. **GMB:** nenhum concorrente pesquisado aparece com prova social forte e citada (o achado de avaliações no Facebook da Bravel mostrava "0 reviews" — ponto a corrigir, ver Passo 3).

## Oportunidades

- **Conteúdo + GEO:** ser a primeira revenda da cidade com blog ativo e FAQ estruturado. Baixo esforço relativo, alto potencial de diferenciação (nenhum concorrente faz).
- **Páginas por modelo:** criar página/post otimizado pra cada modelo recorrente no estoque (Onix, Creta, T-Cross, Strada, Toro, Corolla) — captura busca de quem já decidiu o modelo e procura na cidade.
- **Vender/avaliar o carro:** Dias e Leste Car já fazem isso bem — a Bravel tem página `vender.html` com avaliação presencial gratuita, mas precisa de SEO nela pra competir (ver Passo 4).
- **Schema markup:** ganho técnico rápido e gratuito que nenhum concorrente local implementou.

## Ameaças

- **Chevrolet Zaher** — força de marca autorizada, domina busca por "Chevrolet" + cidade. Não competir de frente nesse termo; focar em multimarca e seminovo de outras marcas.
- **Marketplaces nacionais (Webmotors, Mobiauto, OLX)** — dominam termos genéricos de alto volume ("carros usados MT"). Estratégia correta é nichar em cidade + modelo + diferencial, não competir em "carro usado Brasil".
- **Multi Carros** — vizinho direto na mesma avenida, mesma proposta de financiamento fácil. Maior ameaça de canibalização de tráfego local/Maps por proximidade geográfica.

## Benchmark mínimo pra Bravel atingir

- Site com Estoque + Vender/Avaliar + Financiamento + Sobre + Contato (✅ já tem a maioria — falta página dedicada de financiamento com SEO)
- GMB completo com avaliações reais e respondidas
- Indexação correta no Google (sitemap, robots, meta tags por página) — nenhum concorrente faz isso bem, oportunidade de ultrapassar com esforço técnico baixo
