// CÓDIGO CORRIGIDO E FINAL PARA api/index.js

const express = require('express');
const cors = require('cors');

// Cria um "roteador" do Express. Esta é a forma correta de modularizar rotas.
const router = express.Router();

// Rota de teste. Corresponderá a /api/teste
router.get('/teste', (req, res) => {
  res.status(200).send('A rota de teste da API está funcionando.');
});

// Rota de medicamentos. Corresponderá a /api/medicamentos
router.get('/medicamentos', async (req, res) => {
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

// Cria a aplicação principal do Express
const app = express();

// Habilita o CORS para todas as rotas
app.use(cors());

// Diz ao app para usar o nosso roteador para qualquer caminho que comece com /api
app.use('/api', router);

// Exporta o app principal para a Vercel
module.exports = app;
