import { Router } from 'express';

const router = Router();

router.post('/summary', async (req, res) => {
  const { fleet, loads } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return res.status(500).json({ 
      error: 'API Key Anthropic belum di-set di file .env (ANTHROPIC_API_KEY)' 
    });
  }

  try {
    const prompt = `
      Anda adalah asisten AI sistem logistik "RoadStar Winjay".
      Tolong analisis data armada dan pengiriman berikut:
      Armada: ${JSON.stringify(fleet)}
      Pengiriman: ${JSON.stringify(loads)}
      
      Buatlah ringkasan naratif dalam Bahasa Indonesia yang profesional dan singkat (maksimal 3 paragraf).
      Fokus pada:
      1. Jumlah pengiriman yang berisiko delay (utilisasi kapasitas > 80%).
      2. Jumlah truk yang butuh maintenance (mileage >= 100.000).
      3. Rekomendasi tindakan singkat.
    `;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6', // Model sesuai request
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    res.json({ summary: data.content[0].text });
  } catch (error: any) {
    console.error('AI Insight Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
