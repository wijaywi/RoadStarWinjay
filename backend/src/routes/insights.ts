import { Router } from 'express';

const router = Router();

router.post('/summary', async (req, res) => {
  const { fleet, loads } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return res.status(500).json({ 
      error: 'Anthropic API Key has not been set in .env (ANTHROPIC_API_KEY)' 
    });
  }

  try {
    const prompt = `
      You are an AI assistant for the "RoadStar Winjay" logistics system.
      Please analyze the following fleet and load data:
      Fleet: ${JSON.stringify(fleet)}
      Loads: ${JSON.stringify(loads)}
      
      Create a professional and concise narrative summary (maximum 3 paragraphs).
      Focus on:
      1. Number of loads at risk of delay (capacity utilization > 80%).
      2. Number of trucks requiring maintenance (mileage >= 100,000 miles).
      3. Brief actionable recommendations.
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
