// skillpm versions <skill> — lists all published versions of a skill

import { loadConfig } from "../lib/config.ts"

export async function versions(args: string[], flags: Record<string, string | boolean>) {
  const skillName = args[0]
  if (!skillName) {
    console.error("Usage: skillpm versions <skill>")
    process.exit(1)
  }

  const config = loadConfig({ registry: flags["registry"] as string })
  const url = `${config.registry.replace(/\/$/, "")}/${skillName}/versions.json`

  const res = await fetch(url)
  if (!res.ok) {
    console.error(`Skill "${skillName}" not found (${res.status})`)
    process.exit(1)
  }

  const data = await res.json()
  const vers = data.versions ?? []

  if (!vers.length) {
    console.log(`No versions found for ${skillName}.`)
    return
  }

  console.log(`Versions for ${skillName}:`)
  console.log(`${"VERSION".padEnd(12)}  ${"PUBLISHED".padEnd(25)}  DIGEST`)
  console.log(`${"-".repeat(12)}  ${"-".repeat(25)}  ${"-".repeat(20)}`)
  for (const v of vers) {
    const published = v.published_at ? new Date(v.published_at).toISOString() : "-"
    console.log(`${v.version.padEnd(12)}  ${published.padEnd(25)}  ${v.digest}`)
  }
}
