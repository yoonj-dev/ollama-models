import { NextResponse, NextRequest } from 'next/server';
import { CONFIG_PATH, BACKUP_DIR } from '@/lib/constants';
import { createBackup } from '@/lib/fileHelper';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const exists = await fs.access(CONFIG_PATH).then(() => true).catch(() => false);
    if (!exists) {
      return NextResponse.json({
        exists: false,
        path: CONFIG_PATH,
        config: null,
        raw: '',
        backups: [],
      });
    }

    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    let config: unknown = null;
    try {
      config = JSON.parse(raw);
    } catch {
      config = null;
    }

    // List recent backups
    let backups: string[] = [];
    try {
      const backupFiles = await fs.readdir(BACKUP_DIR);
      backups = backupFiles
        .filter((f) => f.startsWith('config.json.'))
        .sort()
        .reverse()
        .slice(0, 10);
    } catch {
      backups = [];
    }

    return NextResponse.json({
      exists: true,
      path: CONFIG_PATH,
      config,
      raw,
      backups,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { content, format } = await req.json();

    let textToWrite = '';
    if (format === 'json' || typeof content === 'object') {
      try {
        textToWrite = JSON.stringify(content, null, 2);
      } catch (err) {
        return NextResponse.json({ error: `Invalid JSON object: ${(err as Error).message}` }, { status: 400 });
      }
    } else if (typeof content === 'string') {
      // Validate JSON syntax
      try {
        JSON.parse(content);
        textToWrite = content;
      } catch (err) {
        return NextResponse.json({ error: `JSON Syntax Error: ${(err as Error).message}` }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid content format' }, { status: 400 });
    }

    // Crucial safety check: backup existing config.json before write
    const backupPath = await createBackup(CONFIG_PATH);

    await fs.writeFile(CONFIG_PATH, textToWrite, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Config saved successfully',
      backupPath,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
