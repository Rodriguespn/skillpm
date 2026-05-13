import { notFound } from "next/navigation"
import Link from "next/link"
import { getEntity } from "@/lib/entities"
import { getSkillVersions, getVersionedIndex } from "@/lib/registry"

export const revalidate = 60

interface Props { params: Promise<{ entity: string; skill: string; version: string }> }

export default async function SkillVersionPage({ params }: Props) {
  const { entity: entityId, skill: skillName, version: versionParam } = await params
  const entity = getEntity(entityId)
  if (!entity) notFound()

  // URL uses "v0.1.1" prefix; strip it for API calls that add their own "v"
  const semver = versionParam.replace(/^v/, "")

  const [skillVersions, versionedIndex] = await Promise.all([
    getSkillVersions(entity.wellKnownBase, skillName).catch(() => null),
    getVersionedIndex(entity.wellKnownBase, semver).catch(() => null),
  ])

  const description = versionedIndex?.skills.find((s) => s.name === skillName)?.description

  const version = semver
  const versionEntry = skillVersions?.versions.find((v) => v.version === semver)
  if (!versionEntry) notFound()

  const BASE = entity.wellKnownBase
  const artifactUrl = `${BASE}/v${version}/${skillName}.tar.gz`
  const snapshotUrl  = `${BASE}/v${version}/index.json`
  const versionsUrl  = `${BASE}/${skillName}/versions.json`

  const isLatest = skillVersions?.versions[0]?.version === version

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8 flex-wrap">
        <Link href="/" className="hover:text-zinc-600 transition-colors">Registry</Link>
        <span>/</span>
        <Link href={`/${entityId}`} className="hover:text-zinc-600 transition-colors">{entity.name}</Link>
        <span>/</span>
        <Link href={`/${entityId}/skills/${skillName}`} className="hover:text-zinc-600 transition-colors font-mono">{skillName}</Link>
        <span>/</span>
        <span className="text-zinc-700 font-mono">v{version}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">

          {/* Header */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white text-xs font-bold font-mono shrink-0">
                {skillName.slice(0, 2)}
              </div>
              <div>
                <h1 className="text-lg font-semibold font-mono leading-tight">{skillName}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                    v{version}
                  </span>
                  {isLatest && (
                    <span className="text-xs bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">latest</span>
                  )}
                  <span className="font-mono text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                    immutable
                  </span>
                  {versionEntry && (
                    <span className="text-xs text-zinc-400">
                      Published {new Date(versionEntry.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {description && (
              <p className="text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">{description}</p>
            )}
          </div>

          {/* All versions */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-semibold">All versions</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {(skillVersions?.versions ?? []).map((v, i) => (
                <Link key={v.version} href={`/${entityId}/skills/${skillName}/v${v.version}`}
                  className={`flex items-center justify-between px-6 py-3.5 hover:bg-zinc-50 transition-colors group ${v.version === version ? "bg-zinc-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">v{v.version}</span>
                    {i === 0 && <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">latest</span>}
                    {v.version === version && <span className="text-xs text-zinc-400">← you are here</span>}
                  </div>
                  <time className="text-xs text-zinc-400" dateTime={v.published_at}>
                    {new Date(v.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </time>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Integrity */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Integrity</h2>
            <div className="font-mono text-xs break-all text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-lg p-3">
              {versionEntry.digest}
            </div>
            <p className="text-xs text-zinc-400 mt-2">SHA-256 of the <code className="font-mono">.tar.gz</code> artifact</p>
          </div>

          {/* Published */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Published</h2>
            <time className="text-sm text-zinc-700" dateTime={versionEntry.published_at}>
              {new Date(versionEntry.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </time>
          </div>

          {/* Endpoints */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Endpoints</h2>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-zinc-400 mb-1">Tarball (immutable)</p>
                <a href={artifactUrl} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-zinc-600 hover:text-zinc-900 break-all underline underline-offset-2">
                  v{version}/{skillName}.tar.gz ↗
                </a>
              </div>
              <div>
                <p className="text-zinc-400 mb-1">Release snapshot</p>
                <a href={snapshotUrl} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-zinc-600 hover:text-zinc-900 break-all underline underline-offset-2">
                  v{version}/index.json ↗
                </a>
              </div>
              <div>
                <p className="text-zinc-400 mb-1">Skill versions</p>
                <a href={versionsUrl} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-zinc-600 hover:text-zinc-900 break-all underline underline-offset-2">
                  {skillName}/versions.json ↗
                </a>
              </div>
            </div>
          </div>

          {/* Lockfile */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Lockfile entry</h2>
            <pre className="font-mono text-xs text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
{`{
  "${skillName}": {
    "version": "${version}",
    "digest": "${versionEntry.digest.slice(0, 25)}…",
    "resolvedIndex": "v${version}/index.json"
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
