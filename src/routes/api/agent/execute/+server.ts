import { json } from '@sveltejs/kit';
import { getAgent } from '$lib/agents/api';

export async function POST({ request }) {
  const { agentId, input, messages } = await request.json();
  const agent = await getAgent(agentId);

  const fullMessages = [
    { role: 'system', content: agent.prompt },
    ...messages
  ];

  try {
    const response = await fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: agent.model, messages: fullMessages })
    });

    const result = await response.json();
    console.log('Wrapper response:', result);

    if (!result?.content) {
      console.error('No output received from local model', result);
      return json({ error: 'No output received from local model' }, { status: 500 });
    }

    return json({
      id: result.id ?? 'local-' + Date.now(),
      content: result.content,
      model: agent.model,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error calling local model wrapper:', err);
    return json({ error: String(err) }, { status: 500 });
  }
} 