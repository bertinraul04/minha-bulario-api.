const express = require('express');
const app = express();

// Importa e habilita o CORS para permitir chamadas de outros domínios
const cors = require('cors');
app.use(cors());

// Rota principal da API
app.get('/medicamentos', async (req, res) => {
  const nomeMedicamento = req.query.nome;

  // Validação para garantir que o parâmetro 'nome' foi enviado
  if (!nomeMedicamento) {
    return res.status(400).json({ error: 'O parâmetro "nome" é obrigatório.' });
  }

  // Constrói a URL para a API oficial da OpenFDA
  const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(nomeMedicamento )}"&limit=10`;

  try {
    // Faz a chamada para a API da OpenFDA
    const fdaResponse = await fetch(url);
    
    // A OpenFDA retorna 404 se não encontrar nada. Tratamos isso como um sucesso com zero resultados.
    if (fdaResponse.status === 404) {
      return res.status(200).json({ results: [] });
    }

    // Se a resposta não for OK (ex: erro 500 da FDA), lança um erro.
    if (!fdaResponse.ok) {
      throw new Error(`A API da OpenFDA retornou um erro: ${fdaResponse.status}`);
    }

    // Converte a resposta para JSON e a envia de volta para o seu site.
    const data = await fdaResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Erro ao chamar a OpenFDA:', error);
    return res.status(500).json({ error: 'Falha ao se comunicar com a API da OpenFDA.', details: error.message });
  }
});

// Rota raiz para teste
app.get('/', (req, res) => {
  res.status(200).send('API está no ar. Use o endpoint /medicamentos?nome=... para buscar.');
});

// Exporta o app para a Vercel
module.exports = app;
