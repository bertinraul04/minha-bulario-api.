const express = require('express');
const cors = require('cors');
const app = express();

// Habilita o CORS para todas as rotas
app.use(cors());

// Rota de teste para verificar se a API está online
app.get('/api', (req, res) => {
  res.status(200).send('API está no ar.');
});

// Rota principal para buscar medicamentos
app.get('/api/medicamentos', async (req, res) => {
  const nomeMedicamento = req.query.nome;

  if (!nomeMedicamento) {
    return res.status(400).json({ error: 'O parâmetro "nome" é obrigatório.' });
  }

  const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(nomeMedicamento )}"&limit=10`;

  try {
    const fdaResponse = await fetch(url);

    // Se a resposta da FDA não for OK, captura o texto do erro para depuração
    if (!fdaResponse.ok) {
      const errorText = await fdaResponse.text();
      // O erro 404 da FDA é normal (não encontrado), então o tratamos como sucesso com zero resultados.
      if (fdaResponse.status === 404) {
        return res.status(200).json({ results: [] });
      }
      // Para todos os outros erros, retornamos uma mensagem clara.
      throw new Error(`Erro da API da FDA: Status ${fdaResponse.status} - ${errorText}`);
    }

    const data = await fdaResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    // Tratamento de erro robusto que captura qualquer falha (rede, DNS, etc.)
    console.error("ERRO CRÍTICO NA API:", error);
    // Garante que sempre haverá uma propriedade 'message'
    const errorMessage = error.message || 'Ocorreu um erro desconhecido.';
    return res.status(500).json({ error: 'Falha ao processar a requisição.', details: errorMessage });
  }
});

// Exporta o app para a Vercel
module.exports = app;
