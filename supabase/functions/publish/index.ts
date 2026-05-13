// skillpm publish edge function
// Handles skill publishing from the CLI.
//
// POST /publish
//   Authorization: Bearer {SKILLPM_TOKEN}
//   Body: multipart/form-data
//     skill       — skill name (must match SKILL.md frontmatter `name`)
//     version     — semver string (e.g. "1.0.0")
//     description — skill description (from SKILL.md frontmatter)
//     tarball     — binary .tar.gz file
//     release     — "true" | "false"
//                   if "true", also snapshots a registry-level release entry
//                   combining all current skill versions into a versioned index.json

import { createClient } from "jsr:@supabase/supabase-js@2"
import { storagePathForVersion, storagePathLatest } from "../_shared/storage.ts"

const SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json"

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405)

  // Auth: the CLI sends the service role key as a Bearer token.
  // Service role bypasses RLS so the function can write to all tables.
  const authHeader = req.headers.get("Authorization") ?? ""
  const token = authHeader.replace(/^Bearer /, "")
  if (!token || token !== Deno.env.get("SKILLPM_TOKEN")) {
    return json({ error: "unauthorized" }, 401)
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return json({ error: "invalid multipart body" }, 400)
  }

  const skill       = formData.get("skill")?.toString()
  const version     = formData.get("version")?.toString()
  const description = formData.get("description")?.toString()
  const tarballFile = formData.get("tarball") as File | null
  const isRelease   = formData.get("release")?.toString() === "true"

  if (!skill || !version || !description || !tarballFile) {
    return json({ error: "missing required fields: skill, version, description, tarball" }, 400)
  }

  // Compute sha256 digest of the uploaded bytes
  const bytes  = await tarballFile.arrayBuffer()
  const hash   = await crypto.subtle.digest("SHA-256", bytes)
  const digest = "sha256:" + Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("")

  // Immutability check: reject if this (skill, version) already exists
  const { data: existing } = await supabase
    .from("skill_versions")
    .select("id")
    .eq("skill_name", skill)
    .eq("version", version)
    .single()

  if (existing) {
    return json({ error: `${skill}@${version} already exists and cannot be overwritten` }, 409)
  }

  // Upload versioned artifact to Storage (never overwritten)
  const versionedPath = storagePathForVersion(skill, version)
  const { error: uploadErr } = await supabase.storage
    .from("artifacts")
    .upload(versionedPath, bytes, { contentType: "application/gzip", upsert: false })

  if (uploadErr) return json({ error: `storage upload failed: ${uploadErr.message}` }, 500)

  // Upload (overwrite) latest artifact
  const latestPath = storagePathLatest(skill)
  await supabase.storage
    .from("artifacts")
    .upload(latestPath, bytes, { contentType: "application/gzip", upsert: true })

  // Upsert into skills (latest pointer)
  const { error: skillErr } = await supabase.from("skills").upsert({
    name: skill,
    description,
    current_version: version,
    digest,
    storage_path: versionedPath,
    updated_at: new Date().toISOString(),
  })
  if (skillErr) return json({ error: skillErr.message }, 500)

  // Append to skill_versions (immutable history)
  const { error: versionErr } = await supabase.from("skill_versions").insert({
    skill_name: skill,
    version,
    digest,
    storage_path: versionedPath,
  })
  if (versionErr) return json({ error: versionErr.message }, 500)

  // If --release flag: snapshot current state of all skills into a release entry
  if (isRelease) {
    const { data: allSkills, error: allErr } = await supabase
      .from("skills")
      .select("name, description, current_version, digest")
    if (allErr) return json({ error: allErr.message }, 500)

    const indexJson = {
      $schema: SCHEMA,
      skills: (allSkills ?? []).map((s) => ({
        name: s.name,
        description: s.description,
        version: s.current_version,
        type: "archive",
        url: `${s.name}.tar.gz`,
        digest: s.digest,
      })),
    }

    const { error: releaseErr } = await supabase.from("releases").insert({
      version,
      index_json: indexJson,
    })
    if (releaseErr) return json({ error: `release snapshot failed: ${releaseErr.message}` }, 500)

    // Record which skill versions are in this release
    const releaseSkills = (allSkills ?? []).map((s) => ({
      release_version: version,
      skill_name: s.name,
      skill_version: s.current_version,
    }))
    await supabase.from("release_skills").insert(releaseSkills)
  }

  return json({ ok: true, skill, version, digest, release: isRelease }, 201)
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
