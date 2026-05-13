import { notFound } from "next/navigation"
import Link from "next/link"
import { getEntity } from "@/lib/entities"
import { getVersionsIndex, getVersionedIndex } from "@/lib/registry"

export const revalidate = 60

interface Props { params: Promise<{ entity: string }> }

export default async function ReleasesPage({ params }: Props) {
  const { entity: entityId } = await params
  const entity = getEntity(entityId)
  if (!entity) notFound()

  const versionsIndex = await getVersionsIndex(entity.wellKnownBase)
    .catch(() => ({ latest: null, versions: [] }))

  const releases = await Promise.all(
    versionsIndex.versions.map(async (version) => {
      const index = await getVersionedIndex(entity.wellKnownBase, version).catch(() => null)
      return { version, index }
    })
  )

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8">
        <Link href="/" className="hover:text-zinc-600 transition-colors">Registry</Link>
        <span>/</span>
        <Link href={`/${entityId}`} className="hover:text-zinc-600 transition-colors">{entity.name}</Link>
        <span>/</span>
        <span className="text-zinc-700">Releases</span>
      </div>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1.5">Releases</h1>
          <p className="text-sm text-zinc-500">
            Immutable snapshots of all {entity.name} skills at a point in time.
            Each lives at a versioned path and is served with{" "}
            <code className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded">Cache-Control: immutable</code>.
          </p>
        </div>
        <a href={`${entity.wellKnownBase}/versions.json`} target="_blank" rel="noopener noreferrer"
          className="shrink-0 text-xs text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1.5 hover:border-zinc-400 transition-colors bg-white font-mono">
          versions.json ↗
        </a>
      </div>

      {releases.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-400">
          No releases found
        </div>
      ) : (
        <div className="space-y-4">
          {releases.map(({ version, index }, i) => (
            <div key={version} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
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
                <a href={`${entity.wellKnownBase}/v${version}/index.json`}
                  target="_blank" rel="noopener noreferrer"
                  className="font-mono text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                  v{version}/index.json ↗
                </a>
              </div>

              {!index || index.skills.length === 0 ? (
                <div className="px-6 py-4 text-sm text-zinc-400">No skills in this release</div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {index.skills.map((skill) => (
                    <Link key={skill.name} href={`/${entityId}/skills/${skill.name}`}
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-zinc-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">
                          {skill.name}
                        </span>
                        <span className="font-mono text-xs text-zinc-400">v{skill.version}</span>
                      </div>
                      <span className="font-mono text-xs text-zinc-300 group-hover:text-zinc-400 transition-colors hidden sm:block">
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

      {/* Explanation */}
      <div className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500 space-y-2">
        <p className="font-medium text-zinc-700">Client lockfile pattern</p>
        <p>
          A client storing <code className="font-mono text-xs bg-white border border-zinc-200 rounded px-1">version + digest + resolvedIndex</code> can
          pin to an exact release. On a locked install, it fetches the versioned index directly —
          bypassing the mutable <code className="font-mono text-xs bg-white border border-zinc-200 rounded px-1">index.json</code> entirely — and re-verifies the digest.
        </p>
        <p className="font-mono text-xs bg-white border border-zinc-200 rounded p-3 text-zinc-400 mt-2">
          {`{ "supabase": { "version": "0.1.1", "digest": "sha256:807c…", "resolvedIndex": "${entity.wellKnownBase}/v0.1.1/index.json" } }`}
        </p>
      </div>
    </div>
  )
}
