// skillpm list — shows all skills in the registry's latest index

import { loadConfig } from "../lib/config.ts"

export async function list(_args: string[], flags: Record<string, string | boolean>) {
  const config = loadConfig({ registry: flags["registry"] as string })
  const url = `${config.registry.replace(/\/$/, "")}/index.json`

  const res = await fetch(url)
  if (!res.ok) {
    console.error(`Failed to fetch index (${res.status})`)
    process.exit(1)
  }

  const index = await res.json()
  const skills = index.skills ?? []

  if (!skills.length) {
    console.log("No skills published yet.")
    return
  }

  const nameW    = Math.max(4, ...skills.map((s: { name: string }) => s.name.length))
  const versionW = Math.max(7, ...skills.map((s: { version?: string }) => (s.version ?? "-").length))

  console.log(`${"NAME".padEnd(nameW)}  ${"VERSION".padEnd(versionW)}  DIGEST`)
  console.log(`${"-".repeat(nameW)}  ${"-".repeat(versionW)}  ${"-".repeat(20)}`)
  for (const s of skills) {
    console.log(`${s.name.padEnd(nameW)}  ${(s.version ?? "-").padEnd(versionW)}  ${s.digest}`)
  }
}
