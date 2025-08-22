const express = require('express');
const chromium = require('@sparticuz/chromium');
// Usar puppeteer-extra para o modo stealth
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Ativar o plugin stealth
puppeteer.use(StealthPlugin());

const app = express();

app.get('/medicamentos', async (req, res) => {
  const nomeMedicamento = req.query.nome;
  if (!nomeMedicamento) {
    return res.status(400).json({ error: 'O parâmetro "nome" é obrigatório.' });
  }

  let browser = null;
  try {
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

    // Espera por um seletor genérico que deve existir na página
    await page.waitForSelector('body', { timeout: 15000 });

    // Tenta encontrar os resultados
    const medicamentos = await page.evaluate(() => {
      const resultados = [];
      const itens = document.querySelectorAll('.card-medicamento-container .ng-scope');
      if (itens.length === 0) {
        return null; // Retorna null se o container estiver vazio
      }
      
      itens.forEach(item => {
        const nome = item.querySelector('h3.font-weight-bold')?.innerText.trim();
        const empresa = item.querySelector('p.ng-binding:nth-of-type(1)')?.innerText.trim();
        const principioAtivo = item.querySelector('p.ng-binding:nth-of-type(2)')?.innerText.trim();
        const linkElement = item.querySelector('a[ng-click*="abrirBula"]');
        const clickAttr = linkElement ? linkElement.getAttribute('ng-click') : '';
        const match = clickAttr.match(/'([^']+)'/);
        const bulaId = match ? match[1] : null;
        const bulaUrl = bulaId ? `https://consultas.anvisa.gov.br/api/consulta/medicamentos/arquivo/bula/parecer-publico/${bulaId}/?Authorization=` : null;
        if (nome ) {
          resultados.push({
