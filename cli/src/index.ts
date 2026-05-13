#!/usr/bin/env node
// skillpm — agent skills registry CLI

import { parseArgs } from "node:util"
import { publish    } from "./commands/publish.ts"
import { install    } from "./commands/install.ts"
import { list       } from "./commands/list.ts"
import { versions   } from "./commands/versions.ts"
import { init       } from "./commands/init.ts"
import { validate   } from "./commands/validate.ts"
import { deprecate  } from "./commands/deprecate.ts"

const HELP = `
skillpm — agent skills registry CLI

Commands:
  init <skill-dir>      Scaffold a new skill directory with SKILL.md template

  validate <skill-dir>  Validate a skill without publishing (dry-run)

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
    --search <query>    Filter skills by name substring

  versions <skill>      List all published versions of a skill
    --registry <url>

  deprecate <skill>     Mark a skill as deprecated (or deleted)
    --message <msg>     Optional deprecation message
    --delete            Mark as deleted instead of deprecated
    --registry <url>
    --token <key>

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
    message:  { type: "string" },
    delete:   { type: "boolean" },
    search:   { type: "string" },
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
  case "init":       await init(rest, flags);       break
  case "validate":   await validate(rest, flags);   break
  case "publish":    await publish(rest, flags);     break
  case "install":    await install(rest, flags);     break
  case "list":       await list(rest, flags);        break
  case "versions":   await versions(rest, flags);    break
  case "deprecate":  await deprecate(rest, flags);   break
  default:
    console.error(`Unknown command: ${command}\n`)
    console.log(HELP)
    process.exit(1)
}
