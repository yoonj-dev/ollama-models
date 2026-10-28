import path from 'path';
import os from 'os';

function getNormalizedOllamaHost(): string {
  let rawHost = process.env.OLLAMA_HOST || '127.0.0.1:11434';
  rawHost = rawHost.trim();

  if (rawHost === '0.0.0.0') {
    rawHost = '127.0.0.1:11434';
  } else if (rawHost.startsWith('0.0.0.0:')) {
    rawHost = rawHost.replace('0.0.0.0:', '127.0.0.1:');
  }

  if (!rawHost.startsWith('http://') && !rawHost.startsWith('https://')) {
    rawHost = `http://${rawHost}`;
  }

  try {
    const url = new URL(rawHost);
    if (!url.port) {
      url.port = '11434';
      rawHost = url.toString().replace(/\/$/, '');
    }
  } catch {
    rawHost = 'http://127.0.0.1:11434';
  }

  return rawHost;
}

export const OLLAMA_HOST = getNormalizedOllamaHost();
export const OLLAMA_DIR = path.join(os.homedir(), '.ollama');
export const CUSTOM_MODELFILES_DIR = path.join(OLLAMA_DIR, 'custom_modelfiles');
export const CONFIG_PATH = path.join(OLLAMA_DIR, 'config.json');
export const BACKUP_DIR = path.join(OLLAMA_DIR, 'backup');

export const HERMES_DIR = path.join(os.homedir(), '.hermes');
export const HERMES_CONFIG_PATH = path.join(HERMES_DIR, 'config.yaml');
