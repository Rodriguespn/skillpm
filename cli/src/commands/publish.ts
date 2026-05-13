// skillpm publish <skill-dir> --version <semver> [--release] [--registry <url>] [--token <key>]
//
// Reads SKILL.md frontmatter, creates a tarball, computes digest, and POSTs to the registry.
// --release also snapshots a registry-level versioned index.json.

import { mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, basename } from "node:path"
import { readFileSync } from "node:fs"
import matter from "gray-matter"
import { createSkillTarball } from "../lib/tarball.ts"
import { sha256File } from "../lib/digest.ts"
import { loadConfig } from "../lib/config.ts"

export async function publish(args: string[], flags: Record<string, string | boolean>) {
  const skillDir = args[0]
  if (!skillDir) {
    console.error("Usage: skillpm publish <skill-dir> --version <semver> [--release]")
    process.exit(1)
  }

  const version = flags["version"] as string
  if (!version) {
    console.error("--version is required")
    process.exit(1)
  }

  const config = loadConfig({
    registry: flags["registry"] as string,
    token: flags["token"] as string,
  })

  if (!config.token) {
    console.error("No token found. Set SKILLPM_TOKEN, pass --token, or add token to ~/.skillpmrc")
    process.exit(1)
  }

  // Read and validate SKILL.md frontmatter
  const skillMdPath = join(skillDir, "SKILL.md")
  const { data } = matter(readFileSync(skillMdPath, "utf8"))
  const name = data.name as string
  const description = data.description as string

  if (!name || !description) {
    console.error("SKILL.md must have name and description in frontmatter")
    process.exit(1)
  }

  const expectedName = basename(skillDir)
  if (name !== expectedName) {
    console.error(`SKILL.md name "${name}" does not match directory name "${expectedName}"`)
    process.exit(1)
  }

  // Create tarball in a temp dir
  const tmp = join(tmpdir(), `skillpm-${name}-${version}`)
  mkdirSync(tmp, { recursive: true })
  const tarballPath = join(tmp, `${name}.tar.gz`)

  console.log(`Building ${name}@${version}...`)
  await createSkillTarball(skillDir, tarballPath)
  const digest = sha256File(tarballPath)
  console.log(`  digest: ${digest}`)

  // POST to registry
  const form = new FormData()
  form.append("skill", name)
  form.append("version", version)
  form.append("description", description)
  form.append("tarball", new Blob([readFileSync(tarballPath)], { type: "application/gzip" }), `${name}.tar.gz`)
  form.append("release", flags["release"] ? "true" : "false")

  console.log(`Publishing to ${config.registry}...`)
  const res = await fetch(`${config.registry.replace(/\/$/, "")}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}` },
    body: form,
  })

  const body = await res.json()
  if (!res.ok) {
    console.error(`Publish failed (${res.status}): ${body.error}`)
    process.exit(1)
  }

  console.log(`✓ Published ${name}@${version}`)
  if (flags["release"]) console.log(`✓ Release snapshot created for v${version}`)

  // Clean up temp files
  rmSync(tmp, { recursive: true, force: true })
}
