// skillpm install <skill>[@version]
//
// Fetches the skill from the registry, verifies its SHA-256 digest per the spec,
// and extracts it to ./.claude/skills/<name>/.
//
// URL resolution follows RFC 3986 §5.2.2 using the index URL as the base URI,
// exactly as a spec-compliant client should. See:
// https://datatracker.ietf.org/doc/html/rfc3986#section-5.2.2

import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { extract as extractTar } from "tar"
import { sha256Buffer } from "../lib/digest.ts"
import { loadConfig } from "../lib/config.ts"

export async function install(args: string[], flags: Record<string, string | boolean>) {
  const arg = args[0]
  if (!arg) {
    console.error("Usage: skillpm install <skill>[@version]")
    process.exit(1)
  }

  const [skillName, pinnedVersion] = arg.split("@")
  const config = loadConfig({ registry: flags["registry"] as string })

  // Fetch the appropriate index — versioned or latest
  let indexUrl: string
  if (pinnedVersion) {
    indexUrl = `${config.registry.replace(/\/$/, "")}/v${pinnedVersion}/index.json`
  } else {
    indexUrl = `${config.registry.replace(/\/$/, "")}/index.json`
  }

  console.log(`Fetching index from ${indexUrl}...`)
  const indexRes = await fetch(indexUrl)
  if (!indexRes.ok) {
    console.error(`Failed to fetch index (${indexRes.status})`)
    process.exit(1)
  }
  const index = await indexRes.json()

  const entry = (index.skills ?? []).find((s: { name: string }) => s.name === skillName)
  if (!entry) {
    console.error(`Skill "${skillName}" not found in index`)
    process.exit(1)
  }

  // Resolve artifact URL per RFC 3986 §5.2.2 using the index URL as base URI
  const artifactUrl = new URL(entry.url, indexUrl).href
  console.log(`Downloading ${skillName}@${entry.version ?? "latest"}...`)

  const artifactRes = await fetch(artifactUrl)
  if (!artifactRes.ok) {
    console.error(`Failed to download artifact (${artifactRes.status})`)
    process.exit(1)
  }

  const buf = Buffer.from(await artifactRes.arrayBuffer())

  // Verify digest before writing anything to disk
  const actual = sha256Buffer(buf)
  if (actual !== entry.digest) {
    console.error(`Digest mismatch for ${skillName}: expected ${entry.digest}, got ${actual}`)
    process.exit(1)
  }
  console.log(`  ✓ digest verified`)

  // Extract to .claude/skills/<name>/
  const outDir = join(process.cwd(), ".claude", "skills", skillName)
  mkdirSync(outDir, { recursive: true })

  // Write tarball to a temp path then extract
  const tmp = join(outDir, "__tmp.tar.gz")
  writeFileSync(tmp, buf)
  await extractTar({ file: tmp, cwd: outDir, strip: 0 })
  writeFileSync(tmp, "") // overwrite before unlinking to avoid leaving data on disk
  import("node:fs").then((fs) => fs.unlinkSync(tmp))

  console.log(`✓ Installed ${skillName}@${entry.version ?? "latest"} → .claude/skills/${skillName}`)
}
