// CÓDIGO FINAL, SIMPLES E FUNCIONAL PARA api/index.js

const express = require('express');
const cors = require('cors');
const app = express();

// Habilita o CORS para todas as rotas
app.use(cors());

// A Vercel, por padrão, coloca este arquivo sob o prefixo /api.
// Portanto, a rota '/' aqui, será acessível como '/api' no navegador.
app.get('/', (req, res) => {
  res.status(200).send('API está no ar. Use /medicamentos?nome=... para buscar.');
});

// A rota '/medicamentos' aqui, será acessível como '/api/medicamentos'.
app.get('/medicamentos', async (req, res) => {
  const nomeMedicamento = req.query.nome;

  if (!nomeMedicamento) {
    return res.status(400).json({ error: 'O parâmetro "nome" é obrigatório.' });
  }

  const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(nomeMedicamento )}"&limit=10`;

  try {
    const fdaResponse = await fetch(url);

    if (fdaResponse.status === 404) {
      return res.status(200).json({ results: [] });
    }

    if (!fdaResponse.ok) {
      const errorText = await fdaResponse.text();
      throw new Error(`Erro da API da FDA: Status ${fdaResponse.status} - ${errorText}`);
    }

    const data = await fdaResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("ERRO CRÍTICO NA API:", error);
    const errorMessage = error.message || 'Ocorreu um erro desconhecido.';
    return res.status(500).json({ error: 'Falha ao processar a requisição.', details: errorMessage });
  }
});

// Exporta o app para a Vercel.
module.exports = app;
