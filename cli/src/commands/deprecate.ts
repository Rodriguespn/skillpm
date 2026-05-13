// skillpm deprecate <skill> [--message <msg>] [--delete]
//
// Updates the lifecycle status of a skill (or all its versions).
// Inspired by `mcp-publisher status` in the MCP registry.
//
// Examples:
//   skillpm deprecate supabase
//   skillpm deprecate supabase --message "Use supabase-v2 instead"
//   skillpm deprecate supabase --delete

import { loadConfig } from "../lib/config.ts"

export async function deprecate(args: string[], flags: Record<string, string | boolean>) {
  const skill = args[0]
  if (!skill) {
    console.error("Usage: skillpm deprecate <skill> [--message <msg>] [--delete]")
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

  const status = flags["delete"] ? "deleted" : "deprecated"
  const message = flags["message"] as string | undefined

  const body: Record<string, string> = { skill, status }
  if (message) body.message = message

  const registryBase = config.registry.replace(/\/$/, "")
  const res = await fetch(`${registryBase}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const responseBody = await res.json()
  if (!res.ok) {
    console.error(`Failed (${res.status}): ${responseBody.error}`)
    process.exit(1)
  }

  console.log(`✓ ${skill} marked as ${status}`)
  if (message) console.log(`  Message: ${message}`)
}
