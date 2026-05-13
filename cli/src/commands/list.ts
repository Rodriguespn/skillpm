// skillpm list — shows all skills in the registry's latest index

import { loadConfig } from "../lib/config.ts"

export async function list(_args: string[], flags: Record<string, string | boolean>) {
  const config = loadConfig({ registry: flags["registry"] as string })

  const params = new URLSearchParams()
  if (flags["search"]) params.set("search", flags["search"] as string)
  if (flags["deprecated"]) params.set("include_deprecated", "true")

  const base = config.registry.replace(/\/$/, "")
  const query = params.toString()
  const url = `${base}/index.json${query ? `?${query}` : ""}`

  const res = await fetch(url)
  if (!res.ok) {
    console.error(`Failed to fetch index (${res.status})`)
    process.exit(1)
  }

  const index = await res.json()
  const skills = index.skills ?? []

  if (!skills.length) {
    console.log(flags["search"] ? `No skills matching "${flags["search"]}".` : "No skills published yet.")
    return
  }

  const nameW    = Math.max(4, ...skills.map((s: { name: string }) => s.name.length))
  const versionW = Math.max(7, ...skills.map((s: { version?: string }) => (s.version ?? "-").length))
  const statusW  = Math.max(6, ...skills.map((s: { status?: string }) => (s.status ?? "active").length))

  console.log(`${"NAME".padEnd(nameW)}  ${"VERSION".padEnd(versionW)}  ${"STATUS".padEnd(statusW)}  DIGEST`)
  console.log(`${"-".repeat(nameW)}  ${"-".repeat(versionW)}  ${"-".repeat(statusW)}  ${"-".repeat(20)}`)
  for (const s of skills) {
    const status = s.status ?? "active"
    console.log(`${s.name.padEnd(nameW)}  ${(s.version ?? "-").padEnd(versionW)}  ${status.padEnd(statusW)}  ${s.digest}`)
  }
}
