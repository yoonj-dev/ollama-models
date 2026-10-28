import { NextRequest } from 'next/server';
import { OLLAMA_HOST, CUSTOM_MODELFILES_DIR } from '@/lib/constants';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { model, modelfileName, modelfileContent } = await req.json();

    if (!model || typeof model !== 'string') {
      return new Response(JSON.stringify({ error: 'Model name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let finalModelfile = modelfileContent;

    if (!finalModelfile && modelfileName) {
      const safeName = path.basename(modelfileName);
      const filePath = path.join(CUSTOM_MODELFILES_DIR, safeName);
      finalModelfile = await fs.readFile(filePath, 'utf-8');
    }

    if (!finalModelfile) {
      return new Response(JSON.stringify({ error: 'Modelfile content or file name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call Ollama create API
    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: model,
        modelfile: finalModelfile,
        stream: true,
      }),
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text();
      return new Response(JSON.stringify({ error: errText || 'Ollama build failed' }), {
        status: ollamaRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Pipe the stream to client
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
