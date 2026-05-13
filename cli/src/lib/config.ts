// Config resolution order:
// 1. CLI flags (--registry, --token)
// 2. Environment variables (SKILLPM_REGISTRY, SKILLPM_TOKEN)
// 3. ~/.skillpmrc JSON file

import { readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

export interface Config {
  registry: string
  token?: string
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  let file: Partial<Config> = {}
  try {
    const rc = readFileSync(join(homedir(), ".skillpmrc"), "utf8")
    file = JSON.parse(rc)
  } catch {
    // no rc file, that's fine
  }

  const registry =
    overrides.registry ??
    process.env.SKILLPM_REGISTRY ??
    file.registry ??
    "http://localhost:54321/functions/v1/registry"

  const token =
    overrides.token ??
    process.env.SKILLPM_TOKEN ??
    file.token

  return { registry, token }
}
