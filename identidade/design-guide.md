# Identidade visual

> Como a marca aparece em tudo que o MazyOS gera.
> As skills de conteúdo, carrossel e post leem esse arquivo antes de criar qualquer visual.
> Edite quando a marca evoluir.

---

## Cores

- **Fundo principal:** `#0a0a0a` (preto profundo; `#141414` no wrapper externo de stories)
- **Cor de destaque / CTA:** `#cc1111` (vermelho Bravel)
- **Texto principal:** `#ffffff` sobre fundo escuro
- **Fundo alternativo / cards:** `rgba(255,255,255,0.06)` translúcido sobre o fundo escuro, ou `#F5ECD7` (cream) como fundo claro alternado entre slides
- **Texto secundário:** `#909090` / `#a0a0a0` (subtítulos), `#555` (labels/eyebrows pequenos sobre escuro)
- **Cor proibida:** gradiente arco-íris, cores neon/saturadas fora da paleta, qualquer azul/verde genérico de template de IA

---

## Tipografia

- **Títulos e destaques (nome do carro, números grandes):** `Bebas Neue` — condensada, maiúscula, usada só pra 1-2 palavras de impacto (ex: nome do modelo, preço)
- **Corpo, subtítulos, specs, preço e botões:** `Montserrat` (weights 500/600/700/800/900)
- **Labels pequenos, legendas, rodapé:** `Inter` (weights 300-600)
- **Peso do título:** Bebas Neue já é display por natureza; quando usar Montserrat pra título, peso 900

Google Fonts: `Bebas+Neue`, `Montserrat:wght@400;500;600;700;800;900`, `Inter:wght@300;400;500;600`

Kerning: títulos grandes com letter-spacing apertado (`-2px` a `3px` positivo controlado), eyebrows/labels com letter-spacing aberto (`2.5px` a `4px`) e uppercase.

---

## Estilo geral

Editorial automotivo, dark e premium. Foto do carro sempre como protagonista (hero,
full-bleed, com fade/gradient pra garantir legibilidade do texto). Sem clip-art, sem
emoji decorativo em excesso, sem template genérico de IA. Alto contraste entre fundo e
texto. Um respiro generoso (padding 64-100px nas laterais).

---

## Elementos-chave

- **Bordas:** `rgba(255,255,255,0.1)` finas, usadas como divisores entre specs
- **Border-radius dos cards:** `100px` (pill) pra tags de opcionais; `4-6px` pra badges e botão CTA
- **Botões:** CTA sólido vermelho (`#cc1111`), texto branco uppercase, ícone de WhatsApp, padding generoso (`30px 54px`)
- **Sombras:** `drop-shadow` sutil no logo quando sobre foto (`0 2px 16px rgba(0,0,0,0.9)`)
- **Badge "Novo no estoque" / "Disponível":** fundo vermelho sólido, texto branco uppercase, `border-radius: 4px`
- **Régua/divider:** linha fina (3px altura, 64px largura) na cor de destaque, separando eyebrow do conteúdo principal

---

## O que NUNCA fazer

- Inventar especificação, preço ou opcional que não veio do cadastro do veículo no painel ADM
- Usar "único dono", "garantia", "aprovado", "sem entrada", "financiamento garantido" ou "menor preço" sem confirmação explícita de que isso é verdade pro carro específico
- Gradiente arco-íris ou paleta de cores fora da paleta acima
- Foto de pessoa/rosto identificável gerado por IA
- Repetir o mesmo layout em slides consecutivos

---

## Logo

- **Arquivo:** `site/bravel-logo.png`
- **Versão pra fundo escuro:** não tem versão separada — o arquivo atual já funciona bem sobre fundo escuro
- **Onde usar:** topo-esquerda em todo slide (header), slide final de CTA (centralizado)
- **Tamanho sugerido:** 110-130px de largura no header; pode crescer no slide de CTA final

---

## Observações adicionais

Esse guia foi preenchido a partir do padrão já usado nos exemplos em `saidas/story-onix-vermelho.html`
e `saidas/story-creta-ultimate.html` — qualquer carrossel novo (veículos ou institucional)
deve seguir essa mesma linguagem visual pra manter consistência no feed.
