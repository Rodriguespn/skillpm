import Link from "next/link"
import { getVersionsIndex, getVersionedIndex } from "@/lib/registry"

export const revalidate = 60

export default async function ReleasesPage() {
  const versionsIndex = await getVersionsIndex().catch(() => ({ latest: null, versions: [] }))

  const releases = await Promise.all(
    versionsIndex.versions.map(async (version) => {
      const index = await getVersionedIndex(version).catch(() => null)
      return { version, index }
    })
  )

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Releases</h1>
        <p className="text-zinc-500 text-sm">
          Immutable registry snapshots. Each release captures the state of all skills at a point in time.{" "}
          <a
            href="https://github.com/agentskills/agentskills/pull/380"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-700 underline underline-offset-2"
          >
            See the versioning proposal →
          </a>
        </p>
      </div>

      {releases.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-sm text-zinc-400 mb-3">No releases yet</p>
          <code className="text-xs font-mono text-zinc-400 bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 inline-block">
            skillpm publish ./my-skill --version 1.0.0 --release
          </code>
        </div>
      ) : (
        <div className="space-y-4">
          {releases.map(({ version, index }, i) => (
            <div key={version} className="rounded-xl border border-zinc-200 bg-white">
              {/* Release header */}
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold">v{version}</span>
                  {i === 0 && (
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                      latest
                    </span>
                  )}
                  <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                    immutable
                  </span>
                </div>
                <a
                  href={`https://evvgbjqrweflsauugoaj.supabase.co/functions/v1/registry/v${version}/index.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  index.json ↗
                </a>
              </div>

              {/* Skills in this release */}
              {!index || index.skills.length === 0 ? (
                <div className="px-6 py-4 text-sm text-zinc-400">No skills in this release</div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {index.skills.map((skill) => (
                    <Link
                      key={skill.name}
                      href={`/skills/${skill.name}`}
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-zinc-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">
                          {skill.name}
                        </span>
                        <span className="font-mono text-xs text-zinc-400">v{skill.version}</span>
                      </div>
                      <span className="font-mono text-xs text-zinc-300 group-hover:text-zinc-400 transition-colors">
                        {skill.digest.slice(0, 15)}…
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Explain the immutability model */}
      <div className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500 space-y-2">
        <p className="font-medium text-zinc-700">How releases work</p>
        <p>
          Each release is a frozen snapshot of <code className="font-mono text-xs bg-white border border-zinc-200 rounded px-1">index.json</code> stored in the registry database.
          Once created, it is served with <code className="font-mono text-xs bg-white border border-zinc-200 rounded px-1">Cache-Control: immutable</code> and cannot be overwritten.
        </p>
        <p>
          A client with a lockfile can pin to a release version and fetch{" "}
          <code className="font-mono text-xs bg-white border border-zinc-200 rounded px-1">v1.0.0/index.json</code>{" "}
          directly, bypassing the mutable latest index entirely.
        </p>
      </div>
    </div>
  )
}
