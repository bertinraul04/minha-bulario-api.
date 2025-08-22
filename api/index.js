// CÓDIGO FINAL E VALIDADO, ALINHADO COM A DOCUMENTAÇÃO DA VERCEL

// Importa o CORS para permitir chamadas do seu site
const cors = require('cors');

// Cria uma instância do CORS para ser usada como middleware
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Permite qualquer origem
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

// A função principal que a Vercel irá executar
const handler = async (req, res) => {
  // Extrai o parâmetro 'nome' da URL da requisição
  const { nome } = req.query;

  if (!nome) {
    return res.status(400).json({ error: 'O parâmetro "nome" é obrigatório.' });
  }

  const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(nome )}"&limit=10`;

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
    // Adiciona o header de cache para otimizar
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(data);

  } catch (error) {
    console.error("ERRO CRÍTICO NA API:", error);
    const errorMessage = error.message || 'Ocorreu um erro desconhecido.';
    return res.status(500).json({ error: 'Falha ao processar a requisição.', details: errorMessage });
  }
};

// Exporta a função principal, "embrulhada" com o middleware do CORS
module.exports = allowCors(handler);
