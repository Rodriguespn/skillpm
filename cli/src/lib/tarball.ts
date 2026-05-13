// Tarball creation — mirrors scripts/build-release.ts from supabase/agent-skills.
// deterministic: portable=true, mtime=new Date(0), sorted file list.

import { readdirSync } from "node:fs"
import { join } from "node:path"
import { create as createTar } from "tar"

export function listFiles(dir: string, prefix = ""): string[] {
  const entries: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      entries.push(...listFiles(join(dir, entry.name), rel))
    } else {
      entries.push(rel)
    }
  }
  return entries.sort()
}

export async function createSkillTarball(skillDir: string, destPath: string): Promise<void> {
  const files = listFiles(skillDir)
  await createTar(
    { gzip: true, file: destPath, cwd: skillDir, portable: true, mtime: new Date(0) },
    files
  )
}
