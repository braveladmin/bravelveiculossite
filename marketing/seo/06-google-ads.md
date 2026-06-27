# Passo 6 — Google Ads

> CPC, CPA e orçamento exatos **não foram estimados** — exigem acesso à conta de
> Google Ads (Keyword Planner) ou histórico real de campanha, que não estava
> disponível nesta pesquisa. A estrutura abaixo está pronta pra rodar; o valor
> de orçamento e lance deve ser definido com dado real assim que houver acesso
> à conta, ou validado com um teste piloto pequeno.

## Objetivo das campanhas

Geração de leads via WhatsApp (clique-pra-conversar) como ação primária. Visitas
ao site como métrica intermediária (já que o WhatsApp flutuante e os CTAs do
site convertem o visitante).

## Estrutura — Campanha Search

### Grupo de anúncios 1 — Genérico local
**Palavras-chave (10-15):**
- [seminovos primavera do leste]
- "carros usados primavera do leste"
- carros usados primavera do leste mt
- "loja de carros primavera do leste"
- seminovos mt
- comprar carro usado primavera do leste
- revenda de carros primavera do leste
- carro usado barato primavera do leste

**Negativas (nível campanha):** novo, aluguel, peças, oficina, mecânica, simulador grátis sem compromisso (filtrar curioso de simulação sem intenção de compra), moto entrega (se não vender delivery), trabalho, emprego, vaga

### Grupo de anúncios 2 — Por categoria de veículo
**Palavras-chave:**
- [suv usado primavera do leste]
- [picape usada primavera do leste]
- sedan usado primavera do leste
- hatch usado primavera do leste
- "caminhonete usada" primavera do leste

**Negativas adicionais:** caminhão, ônibus, trator

### Grupo de anúncios 3 — Por modelo em estoque (atualizar conforme estoque mudar)
**Palavras-chave (baseado no estoque atual real):**
- chevrolet onix usado primavera do leste
- hyundai creta usado primavera do leste
- volkswagen t-cross usado mt
- fiat strada usada primavera do leste
- fiat toro usada mt
- toyota corolla usado primavera do leste
- volkswagen amarok usada mt

**Observação:** este grupo precisa de manutenção recorrente — ajustar palavras-chave conforme o estoque do painel ADM mudar (ver Passo 7, item semanal/mensal).

### Grupo de anúncios 4 — Vender/Avaliar (capta quem quer trocar, não comprar)
**Palavras-chave:**
- vender meu carro primavera do leste
- avaliação de carro usado primavera do leste
- troca de carro usado primavera do leste
- "quanto vale meu carro" primavera do leste

**Negativas adicionais:** peça, sucata, leilão

## Extensões recomendadas

- Extensão de chamada (telefone/WhatsApp Business se configurado pro Ads)
- Extensão de local (sincronizar com o GMB do Passo 3)
- Sitelinks: Estoque, Vender meu carro, Financiamento, Contato
- Extensão de frase de destaque: "Inspeção antes da venda", "Financiamento facilitado", "Avaliação grátis"

## Segmentação

- **Geográfica:** Primavera do Leste + raio de 50-80km (Campo Verde, Poxoréu, e parte de Rondonópolis) — ajustar conforme área real de atendimento confirmada
- **Estratégia de lance inicial:** Maximizar cliques com CPC máximo definido manualmente (fase de aprendizado) até acumular conversões suficientes pra migrar pra CPA desejado/ROAS
- **Orçamento diário:** definir com base em verba real disponível — não estimado aqui por falta de dado de custo de clique real do mercado local

## Copies dos anúncios (RSA — Responsive Search Ads)

### 15 Headlines
1. Seminovos em Primavera do Leste
2. Bravel Veículos — Seminovos com Transparência
3. Carro Revisado Antes da Venda
4. Financiamento Facilitado pra Seu Carro
5. Troque seu Carro Usado Aqui
6. Avaliação Gratuita do Seu Veículo
7. SUVs, Picapes e Sedans Seminovos
8. Estoque Atualizado Toda Semana
9. Compre com Segurança em Primavera do Leste
10. Inspeção Completa Antes de Comprar
11. Fale Agora no WhatsApp
12. Seu Próximo Carro Está Aqui
13. Carros Usados Direto na Av. Amazonas
14. Bravel Veículos — MT
15. Venda ou Troque Seu Carro Hoje

### 4 Descriptions
1. Cada veículo passa por inspeção antes de entrar no estoque. Transparência do início ao fim. Confira agora.
2. Financiamento facilitado, troca e avaliação presencial gratuita. Fale com a Bravel pelo WhatsApp.
3. SUVs, picapes, sedans e hatches seminovos em Primavera do Leste - MT. Estoque sempre atualizado.
4. Quer vender ou trocar seu carro? Avaliação gratuita e proposta na hora. Agende já.

> Copies seguem `_memoria/preferencias.md` (a preencher) e a regra do design-guide
> de não prometer "garantia", "aprovado" ou "sem entrada" sem confirmação real.

## Local (Google Maps Ads)

Recomendado ativar campanha Performance Max ou extensão de local vinculada ao
GMB (Passo 3) pra aparecer em buscas "perto de mim" — alto encaixe pra revenda
física com endereço fixo.

## Display/Remarketing (opcional, fase 2)

- Público de remarketing: visitantes de `estoque.html` e `veiculo.html` que não converteram
- Formato: banner com foto do veículo visto + CTA de WhatsApp
- Só recomendado depois que a campanha Search tiver volume de dado suficiente pra definir público

## Landing page

O site atual (`estoque.html` e fichas de `veiculo.html`) serve como landing page —
não há necessidade de página dedicada agora. Prioridade: implementar o on-page
do Passo 4 (meta tags, schema) antes de escalar investimento em Ads, pra não
desperdiçar clique pago em página sem otimização de conversão/SEO.
