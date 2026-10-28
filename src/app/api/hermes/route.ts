import { NextResponse } from 'next/server';
import { HERMES_CONFIG_PATH } from '@/lib/constants';
import fs from 'fs/promises';
import { load as yamlLoad } from 'js-yaml';

export async function GET() {
  try {
    const exists = await fs.access(HERMES_CONFIG_PATH).then(() => true).catch(() => false);
    if (!exists) {
      return NextResponse.json({
        exists: false,
        path: HERMES_CONFIG_PATH,
        config: null,
        raw: '',
      });
    }

    const raw = await fs.readFile(HERMES_CONFIG_PATH, 'utf-8');
    let parsed: any = null;
    try {
      parsed = yamlLoad(raw);
    } catch {
      parsed = null;
    }

    // Extract model specific mappings
    const defaultModel = parsed?.model?.default || null;
    const provider = parsed?.model?.provider || null;
    const contextLength = parsed?.model?.context_length || parsed?.model?.ollama_num_ctx || null;

    const ollamaLaunch = parsed?.providers?.['ollama-launch'] || null;
    const registeredModels = ollamaLaunch?.models || [];

    const delegationOptions = parsed?.delegation?.backends?.model_map?.options || [];
    const delegationDefault = parsed?.delegation?.backends?.model_map?.default || null;

    return NextResponse.json({
      exists: true,
      path: HERMES_CONFIG_PATH,
      modelSummary: {
        defaultModel,
        provider,
        contextLength,
        registeredModels,
        delegationDefault,
        delegationOptions,
      },
      config: parsed,
      raw,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
