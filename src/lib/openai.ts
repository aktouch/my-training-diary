// src/lib/openai.ts
export async function getGPTSuggestion(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('APIキーが設定されていません');
  
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '提案が取得できませんでした。';
  }
  