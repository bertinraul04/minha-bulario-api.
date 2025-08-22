// CÓDIGO FINAL E AUTOCONTIDO PARA api/index.js

const express = require('express');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const app = express();

// Rota de teste para garantir que o servidor está no ar
app.get('/', (req, res) => {
  res.status(200).send('API Bulario está no ar. Use /medicamentos?nome=... para buscar.');
});

app.get('/medicamentos', async (req, res) => {
  const nomeMedicamento = req.query.nome;
  if (!nomeMedicamento) {
    return res.status(400).json({ error: 'O parâmetro "nome" é obrigatório.' });
  }

  let browser = null;
  try {
    // Força o download de uma versão do Chromium que inclui todas as dependências.
    await chromium.font('https://raw.githack.com/googlei18n/noto-cjk/main/NotoSansCJK-Regular.ttc' );

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    const url = `https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=${encodeURIComponent(nomeMedicamento )}`;
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.card-medicamento-container .ng-scope', { timeout: 30000 });

    const medicamentos = await page.evaluate(() => {
      const resultados = [];
      document.querySelectorAll('.card-medicamento-container .ng-scope').forEach(item => {
        const nome = item.querySelector('h3.font-weight-bold')?.innerText.trim();
        const empresa = item.querySelector('p.ng-binding:nth-of-type(1)')?.innerText.trim();
        const principioAtivo = item.querySelector('p.ng-binding:nth-of-type(2)')?.innerText.trim();
        const linkElement = item.querySelector('a[ng-click*="abrirBula"]');
        const clickAttr = linkElement ? linkElement.getAttribute('ng-click') : '';
        const match = clickAttr.match(/'([^']+)'/);
        const bulaId = match ? match[1] : null;
        const bulaUrl = bulaId ? `https://consultas.anvisa.gov.br/api/consulta/medicamentos/arquivo/bula/parecer-publico/${bulaId}/?Authorization=` : null;
        if (nome ) {
          resultados.push({ nome, empresa, principioAtivo, bula: bulaUrl });
        }
      });
      return resultados;
    });
    return res.status(200).json(medicamentos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Falha ao buscar dados.', details: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

module.exports = app;
