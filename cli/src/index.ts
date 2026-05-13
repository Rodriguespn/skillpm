#!/usr/bin/env node
// skillpm — agent skills registry CLI
// Usage: skillpm <command> [args] [flags]
//
// Commands:
//   publish <skill-dir> --version <semver> [--release]   publish a skill
//   install <skill>[@version]                             install a skill
//   list                                                  list all skills in the registry
//   versions <skill>                                      list versions of a skill

import { parseArgs } from "node:util"
import { publish  } from "./commands/publish.ts"
import { install  } from "./commands/install.ts"
import { list     } from "./commands/list.ts"
import { versions } from "./commands/versions.ts"

const HELP = `
skillpm — agent skills registry CLI

Commands:
  publish <skill-dir>   Publish a skill to the registry
    --version <semver>  Required. Version to publish (e.g. 1.0.0)
    --release           Also create a registry-level versioned release snapshot
    --registry <url>    Registry base URL (overrides SKILLPM_REGISTRY / ~/.skillpmrc)
    --token <key>       Auth token (overrides SKILLPM_TOKEN / ~/.skillpmrc)

  install <skill>       Install a skill from the registry
    install supabase           installs latest
    install supabase@1.0.0     installs pinned version
    --registry <url>    Registry base URL

  list                  List all skills in the registry
    --registry <url>

  versions <skill>      List all published versions of a skill
    --registry <url>

Config (~/.skillpmrc):
  { "registry": "https://your-registry.com", "token": "your-service-role-key" }

Environment variables:
  SKILLPM_REGISTRY, SKILLPM_TOKEN
`.trim()

const { positionals, values } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    version:  { type: "string" },
    release:  { type: "boolean" },
    registry: { type: "string" },
    token:    { type: "string" },
    help:     { type: "boolean", short: "h" },
  },
})

if (values.help || positionals.length === 0) {
  console.log(HELP)
  process.exit(0)
}

const [command, ...rest] = positionals

const flags = values as Record<string, string | boolean>

switch (command) {
  case "publish":  await publish(rest, flags);  break
  case "install":  await install(rest, flags);  break
  case "list":     await list(rest, flags);     break
  case "versions": await versions(rest, flags); break
  default:
    console.error(`Unknown command: ${command}\n`)
    console.log(HELP)
    process.exit(1)
}
