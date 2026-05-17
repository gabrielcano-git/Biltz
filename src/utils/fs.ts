import { writeFile, rename, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export async function writeAtomic(filePath: string, data: string): Promise<void> {
  const tmp = `${filePath}.tmp`;
  await writeFile(tmp, data, "utf-8");
  await rename(tmp, filePath);
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}
