import { NextRequest } from 'next/server';
import { OLLAMA_HOST } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const { model, messages, options } = await req.json();

    if (!model) {
      return new Response(JSON.stringify({ error: 'Model name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages || [{ role: 'user', content: 'Hello!' }],
        stream: true,
        options: options || {},
      }),
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text();
      return new Response(JSON.stringify({ error: errText || 'Chat request failed' }), {
        status: ollamaRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaRes.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (err) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: (err as Error).message })));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
