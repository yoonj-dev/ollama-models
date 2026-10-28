import { NextResponse, NextRequest } from 'next/server';
import { CUSTOM_MODELFILES_DIR } from '@/lib/constants';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    await fs.mkdir(CUSTOM_MODELFILES_DIR, { recursive: true });
    const fileNames = await fs.readdir(CUSTOM_MODELFILES_DIR);

    const modelfiles = await Promise.all(
      fileNames
        .filter((name) => !name.startsWith('.') && !name.endsWith('.bak'))
        .map(async (name) => {
          const filePath = path.join(CUSTOM_MODELFILES_DIR, name);
          try {
            const stat = await fs.stat(filePath);
            if (!stat.isFile()) return null;

            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');

            let fromModel = '';
            let systemPreview = '';
            const parameters: Record<string, string> = {};

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('FROM ')) {
                fromModel = trimmed.replace('FROM ', '').trim();
              } else if (trimmed.startsWith('PARAMETER ')) {
                const parts = trimmed.substring(10).trim().split(/\s+/);
                if (parts.length >= 2) {
                  parameters[parts[0]] = parts.slice(1).join(' ');
                }
              } else if (trimmed.startsWith('SYSTEM """') || trimmed.startsWith('SYSTEM "')) {
                systemPreview = trimmed.replace(/^SYSTEM\s*"""?/, '').slice(0, 80);
              }
            }

            return {
              name,
              path: filePath,
              size: stat.size,
              updatedAt: stat.mtime.toISOString(),
              fromModel: fromModel || 'Unknown',
              parameters,
              systemPreview: systemPreview || '',
              lineCount: lines.length,
            };
          } catch {
            return null;
          }
        })
    );

    const validModelfiles = modelfiles
      .filter(Boolean)
      .sort((a, b) => a!.name.localeCompare(b!.name));

    return NextResponse.json({
      directory: CUSTOM_MODELFILES_DIR,
      modelfiles: validModelfiles,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, content } = await req.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Valid file name is required' }, { status: 400 });
    }

    const safeName = path.basename(name.trim());
    if (!safeName || safeName.startsWith('.')) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
    }

    const filePath = path.join(CUSTOM_MODELFILES_DIR, safeName);

    // Prevent overwriting existing file via 'new' creation endpoint
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    if (exists) {
      return NextResponse.json({ error: `File '${safeName}' already exists` }, { status: 409 });
    }

    await fs.writeFile(filePath, content || '', 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Modelfile '${safeName}' created successfully`,
      name: safeName,
      path: filePath,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
