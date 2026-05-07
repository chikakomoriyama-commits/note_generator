export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const { apiKey, modelName, systemPrompt } = req.body;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelName || 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: 'あなたはプロのライターです。指示されたフォーマットに厳密に従い、挨拶や解説なしで回答のみを出力してください。',
        messages: [
          {
            role: 'user',
            content: systemPrompt
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("API proxy error:", error);
    return res.status(500).json({ error: { message: error.message || 'Server Error' } });
  }
}
