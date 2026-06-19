// Renderiza cada .slide do carrossel.html em PNG 1080x1350 (formato feed Instagram).
const path = require('path');
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });

  const htmlPath = path.join(__dirname, 'carrossel.html');
  await page.goto('file://' + htmlPath);
  await page.waitForTimeout(800); // garante que as fotos (URLs remotas) carregaram

  const slides = await page.$$('.slide');
  console.log(`Encontrados ${slides.length} slides.`);

  for (let i = 0; i < slides.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    const outPath = path.join(__dirname, 'instagram', `slide-${n}.png`);
    await slides[i].screenshot({ path: outPath });
    console.log(`✓ slide-${n}.png`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error('Falha ao renderizar:', err);
  process.exit(1);
});
