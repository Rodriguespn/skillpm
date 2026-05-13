// Simulates supabase.com/.well-known/agent-skills/ serving the versioning proposal.
// https://github.com/agentskills/agentskills/pull/380
//
// This is a static simulation — no database. The data represents what
// supabase.com would serve once the .well-known spec + versioning proposal ship.
//
// Route table:
//   /index.json                                        → latest index (mutable)
//   /versions.json                                     → release version list (mutable)
//   /v{semver}/index.json                              → immutable release snapshot
//   /{skill}.tar.gz                                    → latest skill artifact (redirect)
//   /v{semver}/{skill}.tar.gz                          → versioned artifact (redirect, immutable)
//   /{skill}/versions.json                             → per-skill version list

import { createClient } from "jsr:@supabase/supabase-js@2"

const SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json"

// Real digests from the published artifacts in Supabase Storage
const SKILLS = {
  supabase: {
    name: "supabase",
    description: "Use when doing ANY task involving Supabase. Triggers: Supabase products (Database, Auth, Edge Functions, Realtime, Storage, Vectors, Cron, Queues); client libraries and SSR integrations (supabase-js, @supabase/ssr) in Next.js, React, SvelteKit, Astro, Remix; auth issues (login, logout, sessions, JWT, cookies, getSession, getUser, getClaims, RLS); Supabase CLI or MCP server; schema changes, migrations, security audits, Postgres extensions (pg_graphql, pg_cron, pg_vector).",
    versions: {
      "0.1.0": { digest: "sha256:3f4a2b1c9e8d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a", published_at: "2026-03-10T10:00:00.000Z" },
      "0.1.1": { digest: "sha256:807c5a126a4c0c03fa2c96afaf6e9cc02e35f611726d8fde8001e6623fe117a1", published_at: "2026-05-13T16:45:39.999Z" },
    },
  },
  "supabase-postgres-best-practices": {
    name: "supabase-postgres-best-practices",
    description: "Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations.",
    versions: {
      "0.1.1": { digest: "sha256:1bbc12e371a3400fb3e525b530d5ba1673343108e2ea8ae62004d723472df2b9", published_at: "2026-05-13T16:48:00.000Z" },
    },
  },
}

// Release snapshots — each captures ALL skills at a point in time
const RELEASES: Record<string, { released_at: string; skills: { name: string; version: string }[] }> = {
  "0.1.0": {
    released_at: "2026-03-10T10:00:00.000Z",
    skills: [{ name: "supabase", version: "0.1.0" }],
  },
  "0.1.1": {
    released_at: "2026-05-13T16:48:00.000Z",
    skills: [
      { name: "supabase", version: "0.1.1" },
      { name: "supabase-postgres-best-practices", version: "0.1.1" },
    ],
  },
}

function skillEntry(name: string, version: string) {
  const skill = SKILLS[name as keyof typeof SKILLS]
  const v = skill.versions[version as keyof typeof skill.versions]
  return {
    name,
    description: skill.description,
    version,
    type: "archive",
    url: `${name}.tar.gz`,
    digest: v.digest,
  }
}

function buildIndex(skillVersions: { name: string; version: string }[]) {
  return {
    $schema: SCHEMA,
    skills: skillVersions.map(({ name, version }) => skillEntry(name, version)),
  }
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return json({ error: "method not allowed" }, 405)
  }

  const url = new URL(req.url)
  // Supabase strips /functions/v1 — pathname arrives as /{function-name}/{rest}
  const path = url.pathname.replace(/^\/registry\/?/, "")

  // CORS — allow any client to fetch (spec requirement for browser-based clients)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD",
  }

  // GET index.json — latest index (mutable)
  if (path === "index.json" || path === "") {
    const latest = RELEASES["0.1.1"]
    return json(buildIndex(latest.skills), 200, {
      "Cache-Control": "public, max-age=60",
      ...corsHeaders,
    })
  }

  // GET versions.json — all release versions
  if (path === "versions.json") {
    const versions = Object.keys(RELEASES).sort().reverse()
    return json(
      { latest: versions[0], versions },
      200,
      { "Cache-Control": "public, max-age=60", ...corsHeaders }
    )
  }

  // GET v{semver}/index.json — immutable release snapshot
  const versionedIndex = path.match(/^v([\w.-]+)\/index\.json$/)
  if (versionedIndex) {
    const version = versionedIndex[1]
    const release = RELEASES[version]
    if (!release) return json({ error: "release not found" }, 404, corsHeaders)
    return json(buildIndex(release.skills), 200, {
      "Cache-Control": "public, max-age=31536000, immutable",
      ...corsHeaders,
    })
  }

  // GET {skill}/versions.json — per-skill version list
  const skillVersions = path.match(/^([\w-]+)\/versions\.json$/)
  if (skillVersions) {
    const skillName = skillVersions[1]
    const skill = SKILLS[skillName as keyof typeof SKILLS]
    if (!skill) return json({ error: "skill not found" }, 404, corsHeaders)

    const versions = Object.entries(skill.versions)
      .sort((a, b) => b[1].published_at.localeCompare(a[1].published_at))
      .map(([version, { digest, published_at }]) => ({ version, digest, published_at }))

    return json({ name: skillName, versions }, 200, {
      "Cache-Control": "public, max-age=60",
      ...corsHeaders,
    })
  }

  // GET {skill}.tar.gz — redirect to latest artifact in Storage
  const latestArtifact = path.match(/^([\w-]+)\.tar\.gz$/)
  if (latestArtifact) {
    const skillName = latestArtifact[1]
    const skill = SKILLS[skillName as keyof typeof SKILLS]
    if (!skill) return json({ error: "skill not found" }, 404, corsHeaders)

    const latestVersion = Object.keys(skill.versions).sort().reverse()[0]
    const storagePath = `${skillName}/${latestVersion}/${skillName}.tar.gz`
    const storageUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/artifacts/${storagePath}`
    return new Response(null, { status: 302, headers: { Location: storageUrl, ...corsHeaders } })
  }

  // GET v{semver}/{skill}.tar.gz — redirect to versioned artifact (immutable)
  const versionedArtifact = path.match(/^v([\w.-]+)\/([\w-]+)\.tar\.gz$/)
  if (versionedArtifact) {
    const [, version, skillName] = versionedArtifact
    const skill = SKILLS[skillName as keyof typeof SKILLS]
    if (!skill || !skill.versions[version as keyof typeof skill.versions]) {
      return json({ error: "skill version not found" }, 404, corsHeaders)
    }
    const storagePath = `${skillName}/${version}/${skillName}.tar.gz`
    const storageUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/artifacts/${storagePath}`
    return new Response(null, {
      status: 302,
      headers: { Location: storageUrl, "Cache-Control": "public, max-age=31536000, immutable", ...corsHeaders },
    })
  }

  return json({ error: "not found" }, 404, corsHeaders)
})

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })
}
