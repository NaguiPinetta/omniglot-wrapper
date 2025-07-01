import { json } from '@sveltejs/kit';
import { z } from 'zod';

// Zod schema for chat API validation
const ChatRequestSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  messages: z.array(z.object({
    role: z.string(),
    content: z.string()
  })),
  api_key: z.string().optional(),
  glossary: z.array(z.object({
    term: z.string(),
    translation: z.string(),
    language: z.string().nullable().optional(),
    context: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    description: z.string().nullable().optional()
  })).optional()
});

export async function POST({ request }) {
  const rawData = await request.json();
  
  // Validate the request
  const validation = ChatRequestSchema.safeParse(rawData);
  if (!validation.success) {
    return json({ error: 'Invalid request data', details: validation.error.flatten() }, { status: 400 });
  }
  
  const { model, messages, api_key, glossary } = validation.data;

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