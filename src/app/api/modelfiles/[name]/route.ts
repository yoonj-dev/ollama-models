import { NextResponse, NextRequest } from 'next/server';
import { CUSTOM_MODELFILES_DIR } from '@/lib/constants';
import { createBackup } from '@/lib/fileHelper';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const safeName = path.basename(name);
    const filePath = path.join(CUSTOM_MODELFILES_DIR, safeName);

    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!exists) {
      return NextResponse.json({ error: `File '${safeName}' not found` }, { status: 404 });
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const stat = await fs.stat(filePath);

    return NextResponse.json({
      name: safeName,
      path: filePath,
      content,
      size: stat.size,
      updatedAt: stat.mtime.toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const { content } = await req.json();

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content string is required' }, { status: 400 });
    }

    const safeName = path.basename(name);
    const filePath = path.join(CUSTOM_MODELFILES_DIR, safeName);

    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!exists) {
      return NextResponse.json({ error: `File '${safeName}' not found` }, { status: 404 });
    }

    // Safety: create backup before updating existing file
    const backupPath = await createBackup(filePath, 'custom_modelfiles');

    await fs.writeFile(filePath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Modelfile '${safeName}' updated successfully`,
      backupPath,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const safeName = path.basename(name);
    const filePath = path.join(CUSTOM_MODELFILES_DIR, safeName);

    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!exists) {
      return NextResponse.json({ error: `File '${safeName}' not found` }, { status: 404 });
    }

    // Safety: backup before deletion
    const backupPath = await createBackup(filePath, 'custom_modelfiles');

    await fs.unlink(filePath);

    return NextResponse.json({
      success: true,
      message: `Modelfile '${safeName}' deleted`,
      backupPath,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
