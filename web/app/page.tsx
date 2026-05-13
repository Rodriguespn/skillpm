import Link from "next/link"
import { getIndex, getVersionsIndex } from "@/lib/registry"

export const revalidate = 60

export default async function HomePage() {
  const [index, versionsIndex] = await Promise.all([
    getIndex().catch(() => ({ $schema: "", skills: [] })),
    getVersionsIndex().catch(() => ({ latest: null, versions: [] })),
  ])

  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Agent Skills Registry</h1>
        <p className="text-zinc-500 text-sm max-w-xl">
          A proof-of-concept registry implementing the{" "}
          <a href="https://github.com/agentskills/agentskills/pull/254" target="_blank" rel="noopener noreferrer" className="text-zinc-700 underline underline-offset-2">
            .well-known agent-skills spec
          </a>{" "}
          with per-skill versioning.{" "}
          <a href="https://github.com/agentskills/agentskills/pull/380" target="_blank" rel="noopener noreferrer" className="text-zinc-700 underline underline-offset-2">
            See the versioning proposal →
          </a>
        </p>
      </div>

      {/* Stats bar */}
      <div className="mb-8 flex gap-6 text-sm">
        <Stat label="Skills" value={String(index.skills.length)} />
        <Stat label="Releases" value={String(versionsIndex.versions.length)} />
        <Stat label="Latest release" value={versionsIndex.latest ?? "—"} mono />
      </div>

      {/* Skill list */}
      {index.skills.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {index.skills.map((skill) => (
            <Link
              key={skill.name}
              href={`/skills/${skill.name}`}
              className="group block rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-mono text-sm font-semibold text-zinc-900">{skill.name}</span>
                    <VersionBadge version={skill.version} />
                    <TypeBadge type={skill.type} />
                  </div>
                  <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">{skill.description}</p>
                </div>
                <span className="text-zinc-300 group-hover:text-zinc-500 transition-colors text-lg leading-none mt-0.5 shrink-0">→</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="font-mono text-xs text-zinc-400">{skill.digest.slice(0, 19)}…</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Registry API section */}
      <div className="mt-12 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Registry endpoints</h2>
        <div className="space-y-2">
          {[
            ["Latest index", "index.json"],
            ["Release versions", "versions.json"],
            ["Versioned snapshot", "v0.1.1/index.json"],
            ["Per-skill versions", "{skill}/versions.json"],
            ["Skill artifact", "{skill}.tar.gz"],
          ].map(([label, path]) => (
            <div key={path} className="flex items-center gap-3 text-sm">
              <span className="text-zinc-400 w-36 shrink-0">{label}</span>
              <code className="font-mono text-xs bg-zinc-50 border border-zinc-200 rounded px-2 py-0.5 text-zinc-600">
                {path}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className={`text-lg font-semibold ${mono ? "font-mono" : ""}`}>{value}</div>
      <div className="text-xs text-zinc-400 mt-0.5">{label}</div>
    </div>
  )
}

function VersionBadge({ version }: { version: string }) {
  return (
    <span className="font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
      v{version}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="text-xs bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">
      {type}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center">
      <p className="text-sm text-zinc-400 mb-3">No skills published yet</p>
      <code className="text-xs font-mono text-zinc-400 bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 inline-block">
        skillpm publish ./my-skill --version 1.0.0
      </code>
    </div>
  )
}
