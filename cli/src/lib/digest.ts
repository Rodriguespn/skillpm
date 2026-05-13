import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"

export function sha256File(filePath: string): string {
  const hash = createHash("sha256").update(readFileSync(filePath)).digest("hex")
  return `sha256:${hash}`
}

export function sha256Buffer(buf: Buffer): string {
  return "sha256:" + createHash("sha256").update(buf).digest("hex")
}
