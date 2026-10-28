import fs from 'fs/promises';
import path from 'path';
import { BACKUP_DIR } from './constants';

/**
 * Creates a timestamped backup before modifying any configuration or modelfile.
 * Existing pattern in ~/.ollama/backup/: config.json.<epoch_timestamp>
 */
export async function createBackup(filePath: string, subfolder = ''): Promise<string | null> {
  try {
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!exists) return null;

    const targetDir = subfolder ? path.join(BACKUP_DIR, subfolder) : BACKUP_DIR;
    await fs.mkdir(targetDir, { recursive: true });

    const baseName = path.basename(filePath);
    const timestamp = Math.floor(Date.now() / 1000);
    const backupFileName = `${baseName}.${timestamp}`;
    const backupFilePath = path.join(targetDir, backupFileName);

    await fs.copyFile(filePath, backupFilePath);
    return backupFilePath;
  } catch (err) {
    console.error(`Failed to create backup for ${filePath}:`, err);
    throw new Error(`Backup creation failed: ${(err as Error).message}`);
  }
}
