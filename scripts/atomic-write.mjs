import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// Readers see either the previous complete file or the complete replacement.
// A same-directory temporary file keeps rename on the destination filesystem.
export async function atomicWriteFile(destination, content) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const temporary = path.join(path.dirname(destination), `.${path.basename(destination)}.${randomUUID()}.tmp`);
  try {
    await fs.writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
    await fs.rename(temporary, destination);
  } catch (error) {
    try {
      await fs.unlink(temporary);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        throw new AggregateError([error, cleanupError], `Atomic write and temporary-file cleanup failed: ${destination}`);
      }
    }
    throw error;
  }
}
