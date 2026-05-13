// skillpm validate <skill-dir>
//
// Dry-run validation without publishing. Checks:
//   1. SKILL.md exists and has valid frontmatter (name, description)
//   2. Skill name matches the directory name
//   3. name is lowercase alphanumeric with hyphens
//   4. description is non-empty
//   5. index.ts (or index.js) exists
//
// Inspired by `mcp-publisher validate` (POST /v0/validate dry-run in MCP registry).

import { existsSync, readFileSync } from "node:fs"
import { join, basename, resolve } from "node:path"
import matter from "gray-matter"

interface ValidationError {
  field: string
  message: string
}

export async function validate(args: string[], _flags: Record<string, string | boolean>) {
  const skillDir = args[0]
  if (!skillDir) {
    console.error("Usage: skillpm validate <skill-dir>")
    process.exit(1)
  }

  const resolved = resolve(skillDir)
  const dirName = basename(resolved)
  const errors: ValidationError[] = []

  if (!existsSync(resolved)) {
    console.error(`Directory not found: ${resolved}`)
    process.exit(1)
  }

  // Check SKILL.md exists
  const skillMdPath = join(resolved, "SKILL.md")
  if (!existsSync(skillMdPath)) {
    errors.push({ field: "SKILL.md", message: "SKILL.md not found" })
  } else {
    let parsed: matter.GrayMatterFile<string>
    try {
      parsed = matter(readFileSync(skillMdPath, "utf8"))
    } catch (e) {
      errors.push({ field: "SKILL.md", message: `Failed to parse frontmatter: ${(e as Error).message}` })
      reportAndExit(errors)
      return
    }

    const { name, description } = parsed.data

    if (!name) {
      errors.push({ field: "name", message: "Missing required frontmatter field: name" })
    } else {
      if (typeof name !== "string") {
        errors.push({ field: "name", message: "name must be a string" })
      } else if (!/^[a-z][a-z0-9-]*$/.test(name)) {
        errors.push({ field: "name", message: `name "${name}" must be lowercase alphanumeric with hyphens, starting with a letter` })
      } else if (name !== dirName) {
        errors.push({ field: "name", message: `name "${name}" does not match directory name "${dirName}"` })
      }
    }

    if (!description) {
      errors.push({ field: "description", message: "Missing required frontmatter field: description" })
    } else if (typeof description !== "string" || description.trim().length === 0) {
      errors.push({ field: "description", message: "description must be a non-empty string" })
    }

    if (parsed.content.trim().length === 0) {
      errors.push({ field: "SKILL.md", message: "SKILL.md body (documentation) is empty" })
    }
  }

  // Check entry point exists
  const hasEntry = existsSync(join(resolved, "index.ts")) || existsSync(join(resolved, "index.js"))
  if (!hasEntry) {
    errors.push({ field: "entry point", message: "No index.ts or index.js found" })
  }

  reportAndExit(errors)
}

function reportAndExit(errors: ValidationError[]) {
  if (errors.length === 0) {
    console.log("✓ Validation passed")
    return
  }

  console.error(`Validation failed with ${errors.length} error(s):`)
  for (const e of errors) {
    console.error(`  [${e.field}] ${e.message}`)
  }
  process.exit(1)
}
