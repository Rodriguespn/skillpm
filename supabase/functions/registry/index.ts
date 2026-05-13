// skillpm registry edge function
// Serves all GET /.well-known/agent-skills/* endpoints per the agent-skills spec
// https://github.com/agentskills/agentskills/pull/254
//
// Route table:
//   /index.json                          → latest index (mutable)
//   /versions.json                       → all release versions (mutable)
//   /v{semver}/index.json                → pinned release snapshot (immutable)
//   /{skill}.tar.gz                      → latest skill artifact (redirect)
//   /v{semver}/{skill}.tar.gz            → versioned skill artifact (redirect, immutable)
//   /{skill}/versions.json               → per-skill version list
//   /{skill}/v{semver}/{skill}.tar.gz    → per-skill versioned artifact (redirect, immutable)

import { createClient } from "jsr:@supabase/supabase-js@2"
import { publicStorageUrl } from "../_shared/storage.ts"

const SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json"

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return json({ error: "method not allowed" }, 405)
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  )

  // Strip the function mount prefix so we can match on the spec paths directly.
  // When served behind the Vercel proxy the path arrives as-is.
  // When called directly it arrives as /registry/{rest}.
  const url = new URL(req.url)
  const raw = url.pathname.replace(/^\/functions\/v1\/registry/, "")
  const path = raw.replace(/^\//, "")

  // GET index.json — latest index, assembled from the skills table
  if (path === "index.json") {
    const { data, error } = await supabase
      .from("skills")
      .select("name, description, current_version, digest, storage_path")

    if (error) return json({ error: error.message }, 500)

    const index = {
      $schema: SCHEMA,
      skills: (data ?? []).map((s) => ({
        name: s.name,
        description: s.description,
        version: s.current_version,
        type: "archive",
        url: `${s.name}.tar.gz`,
        digest: s.digest,
      })),
    }
    return json(index, 200, { "Cache-Control": "public, max-age=60" })
  }

  // GET versions.json — list of all registry-level release versions
  if (path === "versions.json") {
    const { data, error } = await supabase
      .from("releases")
      .select("version, released_at")
      .order("released_at", { ascending: false })

    if (error) return json({ error: error.message }, 500)

    const latest = data?.[0]?.version ?? null
    return json(
      { latest, versions: (data ?? []).map((r) => r.version) },
      200,
      { "Cache-Control": "public, max-age=60" }
    )
  }

  // GET v{semver}/index.json — immutable release snapshot
  const versionedIndex = path.match(/^v([\w.-]+)\/index\.json$/)
  if (versionedIndex) {
    const version = versionedIndex[1]
    const { data, error } = await supabase
      .from("releases")
      .select("index_json")
      .eq("version", version)
      .single()

    if (error || !data) return json({ error: "release not found" }, 404)
    return json(data.index_json, 200, {
      "Cache-Control": "public, max-age=31536000, immutable",
    })
  }

  // GET {skill}.tar.gz — redirect to latest artifact in Storage
  const latestArtifact = path.match(/^([\w-]+)\.tar\.gz$/)
  if (latestArtifact) {
    const skill = latestArtifact[1]
    const { data, error } = await supabase
      .from("skills")
      .select("storage_path")
      .eq("name", skill)
      .single()

    if (error || !data) return json({ error: "skill not found" }, 404)
    return redirect(publicStorageUrl(Deno.env.get("SUPABASE_URL")!, data.storage_path))
  }

  // GET v{semver}/{skill}.tar.gz — redirect to versioned artifact (immutable)
  const versionedArtifact = path.match(/^v([\w.-]+)\/([\w-]+)\.tar\.gz$/)
  if (versionedArtifact) {
    const [, version, skill] = versionedArtifact
    const { data, error } = await supabase
      .from("skill_versions")
      .select("storage_path")
      .eq("skill_name", skill)
      .eq("version", version)
      .single()

    if (error || !data) return json({ error: "skill version not found" }, 404)
    return redirect(publicStorageUrl(Deno.env.get("SUPABASE_URL")!, data.storage_path), {
      "Cache-Control": "public, max-age=31536000, immutable",
    })
  }

  // GET {skill}/versions.json — per-skill version list (versioning extension)
  const skillVersions = path.match(/^([\w-]+)\/versions\.json$/)
  if (skillVersions) {
    const skill = skillVersions[1]
    const { data, error } = await supabase
      .from("skill_versions")
      .select("version, digest, published_at")
      .eq("skill_name", skill)
      .order("published_at", { ascending: false })

    if (error) return json({ error: error.message }, 500)
    if (!data?.length) return json({ error: "skill not found" }, 404)
    return json({ name: skill, versions: data }, 200, {
      "Cache-Control": "public, max-age=60",
    })
  }

  // GET {skill}/v{semver}/{skill}.tar.gz — per-skill versioned artifact (extension)
  const perSkillArtifact = path.match(/^([\w-]+)\/v([\w.-]+)\/([\w-]+)\.tar\.gz$/)
  if (perSkillArtifact) {
    const [, skillDir, version, skill] = perSkillArtifact
    if (skillDir !== skill) return json({ error: "not found" }, 404)
    const { data, error } = await supabase
      .from("skill_versions")
      .select("storage_path")
      .eq("skill_name", skill)
      .eq("version", version)
      .single()

    if (error || !data) return json({ error: "skill version not found" }, 404)
    return redirect(publicStorageUrl(Deno.env.get("SUPABASE_URL")!, data.storage_path), {
      "Cache-Control": "public, max-age=31536000, immutable",
    })
  }

  return json({ error: "not found" }, 404)
})

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })
}

function redirect(location: string, headers: Record<string, string> = {}) {
  return new Response(null, { status: 302, headers: { Location: location, ...headers } })
}
