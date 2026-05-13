// skillpm init <skill-dir>
//
// Scaffolds a new skill directory with a SKILL.md template and an empty index.ts.
// Inspired by `mcp-publisher init` which scaffolds server.json.

import { mkdirSync, writeFileSync, existsSync } from "node:fs"
import { join, basename, resolve } from "node:path"

const SKILL_MD_TEMPLATE = (name: string) => `---
name: ${name}
description: A brief description of what this skill does.
version: 0.1.0
---

# ${name}

Describe what this skill does and when Claude should use it.

## Usage

Explain the skill's behavior, inputs, and outputs.
`

const INDEX_TEMPLATE = `// Entry point for the ${`skill`} skill.
// This file is loaded by Claude Code when the skill is installed.
`

export async function init(args: string[], _flags: Record<string, string | boolean>) {
  const skillDir = args[0]
  if (!skillDir) {
    console.error("Usage: skillpm init <skill-dir>")
    process.exit(1)
  }

  const resolved = resolve(skillDir)
  const name = basename(resolved)

  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error(`Invalid skill name "${name}": must be lowercase alphanumeric with hyphens, starting with a letter`)
    process.exit(1)
  }

  if (existsSync(resolved)) {
    console.error(`Directory "${resolved}" already exists`)
    process.exit(1)
  }

  mkdirSync(resolved, { recursive: true })

  writeFileSync(join(resolved, "SKILL.md"), SKILL_MD_TEMPLATE(name), "utf8")
  writeFileSync(join(resolved, "index.ts"), INDEX_TEMPLATE, "utf8")

  console.log(`Created skill scaffold in ${resolved}/`)
  console.log(`  SKILL.md   — metadata and documentation`)
  console.log(`  index.ts   — skill entry point`)
  console.log()
  console.log(`Next steps:`)
  console.log(`  1. Edit SKILL.md with your skill's description`)
  console.log(`  2. Implement index.ts`)
  console.log(`  3. skillpm validate ${skillDir}`)
  console.log(`  4. skillpm publish ${skillDir} --version 0.1.0`)
}
