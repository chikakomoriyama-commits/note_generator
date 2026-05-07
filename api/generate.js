export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const { apiKey, modelName, systemPrompt } = req.body;

  const modelsToTry = [
    modelName, // User specified or default from UI
    'claude-3-5-sonnet-20241022',
    'claude-3-haiku-20240307',
    'claude-3-sonnet-20240229'
  ];

  let lastData = null;
  let lastStatus = 500;

  for (const model of modelsToTry) {
    if (!model) continue;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model,
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
      
      if (response.ok) {
        return res.status(200).json(data);
      }

      lastData = data;
      lastStatus = response.status;

      // もし「モデルが見つからない」エラーなら、次のモデルでリトライする
      if (data.error && data.error.type === 'not_found_error' && data.error.message.includes('model:')) {
        console.log(`Model ${model} not found. Retrying with next model...`);
        continue;
      } else {
        // その他のエラー（認証エラー、残高不足など）の場合は即座にエラーを返す
        return res.status(response.status).json(data);
      }
    } catch (error) {
      console.error("Fetch error for model:", model, error);
      // 通信エラーなどの場合はループを抜けてエラーを返す
      return res.status(500).json({ error: { type: "server_error", message: error.message || 'Server Error' } });
    }
  }

  // 全てのモデルでnot_foundだった場合
  return res.status(lastStatus).json(lastData);
}
