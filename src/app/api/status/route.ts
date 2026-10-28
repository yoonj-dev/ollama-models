import { NextResponse } from 'next/server';
import { OLLAMA_HOST, CUSTOM_MODELFILES_DIR, CONFIG_PATH, HERMES_CONFIG_PATH } from '@/lib/constants';
import fs from 'fs/promises';

export async function GET() {
  try {
    const versionRes = await fetch(`${OLLAMA_HOST}/api/version`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });

    const isOllamaRunning = versionRes.ok;
    const versionData = isOllamaRunning ? await versionRes.json() : null;

    let modelfileCount = 0;
    try {
      const files = await fs.readdir(CUSTOM_MODELFILES_DIR);
      modelfileCount = files.filter(f => !f.startsWith('.')).length;
    } catch {
      modelfileCount = 0;
    }

    let configExists = false;
    try {
      await fs.access(CONFIG_PATH);
      configExists = true;
    } catch {
      configExists = false;
    }

    let hermesExists = false;
    try {
      await fs.access(HERMES_CONFIG_PATH);
      hermesExists = true;
    } catch {
      hermesExists = false;
    }

    return NextResponse.json({
      online: isOllamaRunning,
      version: versionData?.version || 'unknown',
      host: OLLAMA_HOST,
      customModelfilesDir: CUSTOM_MODELFILES_DIR,
      modelfileCount,
      configPath: CONFIG_PATH,
      configExists,
      hermesConfigPath: HERMES_CONFIG_PATH,
      hermesConfigExists: hermesExists,
    });
  } catch (error) {
    return NextResponse.json({
      online: false,
      version: null,
      host: OLLAMA_HOST,
      error: (error as Error).message,
    }, { status: 200 });
  }
}
