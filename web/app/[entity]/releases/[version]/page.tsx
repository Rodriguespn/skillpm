import { notFound } from "next/navigation"
import Link from "next/link"
import { getEntity } from "@/lib/entities"
import { getVersionedIndex, getVersionsIndex } from "@/lib/registry"

export const revalidate = 60

interface Props { params: Promise<{ entity: string; version: string }> }

export default async function ReleaseVersionPage({ params }: Props) {
  const { entity: entityId, version: versionParam } = await params
  const entity = getEntity(entityId)
  if (!entity) notFound()

  // URL uses "v0.1.1" prefix; strip it for API calls that add their own "v"
  const version = versionParam.replace(/^v/, "")

  const [index, versionsIndex] = await Promise.all([
    getVersionedIndex(entity.wellKnownBase, version).catch(() => null),
    getVersionsIndex(entity.wellKnownBase).catch(() => ({ latest: null, versions: [] })),
  ])

  if (!index) notFound()

  const BASE = entity.wellKnownBase
  const snapshotUrl = `${BASE}/v${version}/index.json`
  const isLatest = versionsIndex.latest === version  // both without "v" prefix
  const allVersions = versionsIndex.versions

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8 flex-wrap">
        <Link href="/" className="hover:text-zinc-600 transition-colors">Registry</Link>
        <span>/</span>
        <Link href={`/${entityId}`} className="hover:text-zinc-600 transition-colors">{entity.name}</Link>
        <span>/</span>
        <Link href={`/${entityId}/releases`} className="hover:text-zinc-600 transition-colors">Releases</Link>
        <span>/</span>
        <span className="text-zinc-700 font-mono">v{version}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">

          {/* Header */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h1 className="text-xl font-semibold font-mono">Release v{version}</h1>
                <p className="text-sm text-zinc-500 mt-1">{entity.name} — {index.skills.length} skill{index.skills.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {isLatest && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">latest</span>
                )}
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">immutable</span>
              </div>
            </div>
          </div>

          {/* Skills in this release */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Skills in this release</h2>
              <a href={snapshotUrl} target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                v{version}/index.json ↗
              </a>
            </div>
            <div className="divide-y divide-zinc-50">
              {index.skills.map((skill) => (
                <Link key={skill.name} href={`/${entityId}/skills/${skill.name}/v${skill.version}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="font-mono text-sm font-semibold text-zinc-900 group-hover:text-zinc-700">{skill.name}</span>
                      <span className="font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                        v{skill.version}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1">{skill.description}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="font-mono text-xs text-zinc-300 hidden sm:block">{skill.digest.slice(0, 15)}…</span>
                    <a href={`${BASE}/v${version}/${skill.name}.tar.gz`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-zinc-400 hover:text-zinc-700 border border-zinc-200 rounded px-2 py-0.5 hover:border-zinc-400 transition-colors bg-white">
                      .tar.gz ↗
                    </a>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* All releases nav */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-semibold">All releases</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {allVersions.map((v, i) => (
                <Link key={v} href={`/${entityId}/releases/v${v}`}
                  className={`flex items-center justify-between px-6 py-3.5 hover:bg-zinc-50 transition-colors group ${v === version ? "bg-zinc-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">v{v}</span>
                    {i === 0 && <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">latest</span>}
                    {v === version && <span className="text-xs text-zinc-400">← you are here</span>}
                  </div>
                  <span className="text-zinc-300 group-hover:text-zinc-500 transition-colors text-sm">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Endpoints */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Endpoints</h2>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-zinc-400 mb-1">Release index (immutable)</p>
                <a href={snapshotUrl} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-zinc-600 hover:text-zinc-900 break-all underline underline-offset-2">
                  v{version}/index.json ↗
                </a>
              </div>
              {index.skills.map((skill) => (
                <div key={skill.name}>
                  <p className="text-zinc-400 mb-1">{skill.name} tarball</p>
                  <a href={`${BASE}/v${version}/${skill.name}.tar.gz`}
                    target="_blank" rel="noopener noreferrer"
                    className="font-mono text-zinc-600 hover:text-zinc-900 break-all underline underline-offset-2">
                    v{version}/{skill.name}.tar.gz ↗
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Spec note */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-xs text-zinc-500 space-y-2">
            <p className="font-medium text-zinc-700">Why immutable?</p>
            <p>
              Once published, this snapshot cannot change. A client lockfile can
              pin <code className="font-mono bg-white border border-zinc-200 rounded px-1">v{version}/index.json</code> and
              always get the same skills and digests — bypassing the mutable <code className="font-mono bg-white border border-zinc-200 rounded px-1">index.json</code> entirely.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
