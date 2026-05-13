# skillpm

A registry proof-of-concept for [agent skills](https://agentskills.io), built on Supabase.

It implements the [`.well-known` URI spec](https://github.com/agentskills/agentskills/pull/254) in full, and extends it with a versioning proposal ([draft spec change](https://github.com/agentskills/agentskills/pull/380)) that adds per-skill version history and registry-level release snapshots.

> **Why this exists**: The spec has no versioning story yet. This POC demonstrates one approach — keeping version history under the same `.well-known` origin — and gives the community something concrete to react to. See [the proposal discussion](https://github.com/agentskills/agentskills/pull/254#issuecomment-4441679760).

---

## What it serves

All endpoints follow the spec's URL structure. The base URL depends on how you deploy (see [Hosting](#hosting)):

```
GET /.well-known/agent-skills/index.json                           ← latest index (mutable)
GET /.well-known/agent-skills/versions.json                        ← all release versions (mutable)
GET /.well-known/agent-skills/v{semver}/index.json                 ← release snapshot (immutable)
GET /.well-known/agent-skills/{skill}.tar.gz                       ← latest skill artifact
GET /.well-known/agent-skills/v{semver}/{skill}.tar.gz             ← versioned skill artifact (immutable)
GET /.well-known/agent-skills/{skill}/versions.json                ← per-skill version list (extension)
GET /.well-known/agent-skills/{skill}/v{semver}/{skill}.tar.gz     ← per-skill versioned artifact (extension)
```

`index.json` shape matches the spec exactly:

```json
{
  "$schema": "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
  "skills": [
    {
      "name": "supabase",
      "version": "0.1.1",
      "type": "archive",
      "description": "Use when doing ANY task involving Supabase.",
      "url": "supabase.tar.gz",
      "digest": "sha256:abc123..."
    }
  ]
}
```

`versions.json` (extension — not yet in spec):

```json
{
  "latest": "0.2.0",
  "versions": ["0.1.0", "0.1.1", "0.2.0"]
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client / CLI                          │
└────────────────────────┬────────────────────────────────┘
                         │ /.well-known/agent-skills/*
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Vercel proxy (proxy/vercel.json)            │
│  rewrites /.well-known/agent-skills/* →                 │
│  {supabase-project}.supabase.co/functions/v1/registry/* │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│  registry       │             │  publish        │
│  edge function  │             │  edge function  │
│  (GET only)     │             │  (POST, auth)   │
└────────┬────────┘             └────────┬────────┘
         │                               │
         ▼                               ▼
┌─────────────────────────────────────────────────────────┐
│                   Supabase                              │
│                                                         │
│  PostgreSQL                    Storage                  │
│  ├── skills                    └── artifacts/           │
│  ├── skill_versions                ├── supabase/        │
│  ├── releases                      │   ├── 0.1.1/       │
│  └── release_skills                │   │   └── supabase.tar.gz
│                                    │   └── latest.tar.gz│
└─────────────────────────────────────────────────────────┘
```

**Three Supabase primitives:**

| Primitive | Used for |
|-----------|----------|
| PostgreSQL | Metadata: skill names, versions, digests, release snapshots |
| Storage | Binary tarballs (`artifacts` bucket, public read) |
| Edge Functions | HTTP routing for registry reads and authenticated publish |

**Two edge functions:**

- `registry` — serves all GET requests. Reads from the DB and redirects tarball requests to Storage public URLs.
- `publish` — authenticated POST endpoint. Validates immutability, uploads to Storage, upserts DB rows.

**Vercel proxy** — one `vercel.json` file with a rewrite rule. Solves the `.well-known` path problem: Supabase Edge Functions are mounted at `/functions/v1/{name}`, not `/.well-known/`. The proxy makes the spec-compliant paths work for real.

---

## Local development

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)
- [Node.js](https://nodejs.org) 18+
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)
- [Deno](https://deno.land) (for edge functions — `brew install deno`)

### 1. Start Supabase locally

```bash
cd skillpm
supabase start    # starts local Postgres + Storage + Edge Function runtime
```

This prints your local `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Copy them.

### 2. Apply the schema

```bash
supabase migration up    # local only — no project link required
# or: supabase db reset  # if you want a full reset + replay
```

Creates four tables: `skills`, `skill_versions`, `releases`, `release_skills`. See `supabase/migrations/0001_initial.sql` for the full schema and RLS policies.

### 3. Create the Storage bucket

```bash
# In the Supabase dashboard at http://localhost:54323
# Storage → New bucket → name: "artifacts" → Public: yes
```

Or via the CLI:

```bash
supabase db execute --sql "select storage.create_bucket('artifacts', '{ \"public\": true }');"
```

### 4. Configure environment

```bash
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# Set SKILLPM_TOKEN to your service role key (used by the CLI to authenticate publish)
```

### 5. Serve the edge functions

```bash
supabase functions serve
# Functions available at http://localhost:54321/functions/v1/registry
#                       and http://localhost:54321/functions/v1/publish
```

### 6. Install CLI deps and test

```bash
pnpm install

# Publish the supabase skill from the parent repo as a test
npx tsx cli/src/index.ts publish ../skills/supabase --version 0.1.0 \
  --registry http://localhost:54321/functions/v1/registry \
  --token <your-service-role-key>

# List skills
npx tsx cli/src/index.ts list

# Install the skill
npx tsx cli/src/index.ts install supabase
# → extracts to .claude/skills/supabase/

# Check per-skill versions
npx tsx cli/src/index.ts versions supabase

# Publish a release snapshot
npx tsx cli/src/index.ts publish ../skills/supabase --version 0.1.0 --release \
  --token <key>
# → also creates /.well-known/agent-skills/v0.1.0/index.json
```

---

## Deploying to production

### Step 1 — Create a Supabase project

```bash
# Create a project at https://supabase.com/dashboard
# Then link locally:
supabase link --project-ref <your-project-ref>
```

### Step 2 — Apply schema and create bucket

```bash
supabase db push    # pushes local migrations to the linked remote project
```

Create the `artifacts` bucket in the dashboard (Storage → New bucket → `artifacts`, public).

### Step 3 — Set edge function secrets

```bash
supabase secrets set SKILLPM_TOKEN=<your-service-role-key>
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically
```

### Step 4 — Deploy edge functions

```bash
supabase functions deploy registry
supabase functions deploy publish
```

Smoke test:

```bash
curl https://<ref>.supabase.co/functions/v1/registry/index.json
# → { "$schema": "...", "skills": [] }
```

### Step 5 — Deploy the Vercel proxy

This is what makes `/.well-known/agent-skills/` paths work for real.

```bash
# Edit proxy/vercel.json — replace <YOUR_SUPABASE_PROJECT_REF> with your actual ref
cd proxy
vercel deploy
# Vercel gives you a URL like https://skillpm-proxy.vercel.app
```

Your registry is now accessible at:

```
https://skillpm-proxy.vercel.app/.well-known/agent-skills/index.json
```

If you have a custom domain, add it in the Vercel dashboard and point DNS to Vercel. Then your registry is at:

```
https://yourdomain.com/.well-known/agent-skills/index.json
```

### Step 6 — Configure your CLI

```bash
cat > ~/.skillpmrc << 'EOF'
{
  "registry": "https://skillpm-proxy.vercel.app",
  "token": "<your-supabase-service-role-key>"
}
EOF
```

---

## CLI reference

```
skillpm publish <skill-dir> --version <semver> [--release]
  Build a tarball from <skill-dir>, compute its digest, and publish to the registry.
  --version    Required. Semver string (e.g. 1.0.0)
  --release    Also snapshot a registry-level versioned index.json.
               Clients can then fetch /.well-known/agent-skills/v1.0.0/index.json.
  --registry   Override the registry base URL
  --token      Override the auth token

skillpm install <skill>[@version]
  Fetch, verify (digest), and extract a skill to .claude/skills/<name>/.
  Resolves artifact URLs per RFC 3986 §5.2.2 against the index URL (spec-compliant).
  Without @version: installs from the latest index.
  With @version:    installs from the versioned index snapshot.

skillpm list
  List all skills in the latest index with their current version and digest.

skillpm versions <skill>
  List all published versions of a skill with digests and publish dates.
```

---

## Versioning design

This registry extends the spec with two things the base spec doesn't yet have:

### 1. Registry-level releases (`--release` flag)

When publishing with `--release`, the registry snapshots the current state of all skills into an immutable `releases` DB row. This creates:

```
/.well-known/agent-skills/v1.0.0/index.json   ← frozen snapshot of all skills at this moment
/.well-known/agent-skills/versions.json       ← updated to include "1.0.0"
```

This is analogous to how Cargo publishes a crate version: the versioned path is immutable once created (enforced at the DB level by a `unique(skill_name, version)` constraint and a 409 check in the publish function).

### 2. Per-skill version history

Every publish (with or without `--release`) is recorded in `skill_versions`. This exposes:

```
/.well-known/agent-skills/supabase/versions.json          ← all versions of this skill
/.well-known/agent-skills/supabase/v0.1.1/supabase.tar.gz ← specific skill artifact
```

This allows a client to pin `supabase` independently of the overall registry release version.

### Immutability enforcement

The publish function returns 409 Conflict if a `(skill_name, version)` pair already exists, mirroring how [npm](https://docs.npmjs.com/policies/unpublish) and [Cargo](https://doc.rust-lang.org/cargo/reference/publishing.html#publishing-on-cratesio) prevent re-publishing. The DB's `unique` constraint is the backstop if the application layer is bypassed.

---

## Project structure

```
skillpm/
├── README.md                         this file
├── package.json                      CLI deps + scripts
├── .env.example                      env var template
│
├── supabase/
│   ├── config.toml                   Supabase CLI config (generated by supabase init)
│   ├── migrations/
│   │   └── 0001_initial.sql          DB schema: skills, skill_versions, releases, release_skills
│   └── functions/
│       ├── _shared/
│       │   └── storage.ts            Storage URL helpers shared between functions
│       ├── registry/
│       │   └── index.ts              GET handler for all .well-known paths
│       └── publish/
│           └── index.ts              POST handler for CLI publish
│
├── proxy/
│   └── vercel.json                   Rewrite rule: /.well-known/agent-skills/* → edge function
│
└── cli/
    └── src/
        ├── index.ts                  CLI entrypoint + command dispatch
        ├── commands/
        │   ├── publish.ts            skillpm publish
        │   ├── install.ts            skillpm install
        │   ├── list.ts               skillpm list
        │   └── versions.ts           skillpm versions
        └── lib/
            ├── config.ts             Config resolution (~/.skillpmrc, env, flags)
            ├── digest.ts             sha256 helpers
            └── tarball.ts            Deterministic tarball creation (mirrors build-release.ts)
```

---

## Related

- [agent-skills spec](https://agentskills.io)
- [`.well-known` URI spec PR](https://github.com/agentskills/agentskills/pull/254)
- [Versioning proposal PR](https://github.com/agentskills/agentskills/pull/380) (this POC demonstrates)
- [supabase/agent-skills](https://github.com/supabase/agent-skills) — the skills this registry was tested with
- [Supabase agent-skills PR](https://github.com/supabase/supabase/pull/45641) — how Supabase serves skills via `.well-known`
