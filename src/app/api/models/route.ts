import { NextResponse, NextRequest } from 'next/server';
import { OLLAMA_HOST } from '@/lib/constants';

export async function GET() {
  try {
    const [tagsRes, psRes] = await Promise.all([
      fetch(`${OLLAMA_HOST}/api/tags`, { cache: 'no-store' }),
      fetch(`${OLLAMA_HOST}/api/ps`, { cache: 'no-store' }).catch(() => null),
    ]);

    if (!tagsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch tags from Ollama' }, { status: tagsRes.status });
    }

    const tagsData = await tagsRes.json();
    const runningData = psRes && psRes.ok ? await psRes.json() : { models: [] };

    const runningMap = new Map();
    if (Array.isArray(runningData.models)) {
      runningData.models.forEach((m: { name?: string; model?: string; size_vram?: number }) => {
        const key = m.name || m.model;
        if (key) runningMap.set(key, m);
      });
    }

    const models = (tagsData.models || []).map((m: { name: string; model?: string; size: number; modified_at: string; details?: unknown; digest: string }) => {
      const isRunning = runningMap.has(m.name) || (m.model && runningMap.has(m.model));
      const runningInfo = runningMap.get(m.name) || (m.model ? runningMap.get(m.model) : null);
      return {
        ...m,
        isRunning: !!isRunning,
        runningInfo,
      };
    });

    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
    }

    const res = await fetch(`${OLLAMA_HOST}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText || 'Failed to delete model' }, { status: res.status });
    }

    return NextResponse.json({ success: true, message: `Model ${name} deleted successfully` });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { source, destination } = await req.json();
    if (!source || !destination) {
      return NextResponse.json({ error: 'Both source and destination are required' }, { status: 400 });
    }

    const res = await fetch(`${OLLAMA_HOST}/api/copy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, destination }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText || 'Failed to copy model' }, { status: res.status });
    }

    return NextResponse.json({ success: true, message: `Copied ${source} to ${destination}` });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
