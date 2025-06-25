import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  const { model, messages, api_key } = await request.json();

  if (model.startsWith('gpt-')) {
    // Forward to OpenAI
    const openaiKey = api_key || process.env.OPENAI_API_KEY;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages
      })
    });
    const data = await response.json();
    return json(data);
  } else if (model === 'llama3' || model === 'mistral') {
    // Forward to LM Studio / Ollama
    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages
      })
    });
    const data = await response.json();
    return json(data);
  }

  return json({ error: 'Unknown model' }, { status: 400 });
} 