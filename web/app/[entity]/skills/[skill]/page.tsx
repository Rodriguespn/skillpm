import { notFound } from "next/navigation"
import Link from "next/link"
import { getEntity } from "@/lib/entities"
import { getIndex } from "@/lib/registry"

export const revalidate = 60

interface Props { params: Promise<{ entity: string; skill: string }> }

export default async function SkillPage({ params }: Props) {
  const { entity: entityId, skill: skillName } = await params
  const entity = getEntity(entityId)
  if (!entity) notFound()

  const index = await getIndex(entity.wellKnownBase).catch(() => ({ $schema: "", skills: [] }))
  const skill = index.skills.find((s) => s.name === skillName)
  if (!skill) notFound()

  // Resolve artifact URL per RFC 3986 §5.2.2 against the index URL as base URI
  const artifactUrl = new URL(skill.url, `${entity.wellKnownBase}/index.json`).href

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8 flex-wrap">
        <Link href="/" className="hover:text-zinc-600 transition-colors">Registry</Link>
        <span>/</span>
        <Link href={`/${entityId}`} className="hover:text-zinc-600 transition-colors">{entity.name}</Link>
        <span>/</span>
        <span className="text-zinc-700 font-mono">{skillName}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white text-xs font-bold font-mono shrink-0">
                {skillName.slice(0, 2)}
              </div>
              <div>
                <h1 className="text-lg font-semibold font-mono leading-tight">{skillName}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {skill.version && (
                    <span className="font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                      v{skill.version}
                    </span>
                  )}
                  <span className="text-xs bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">{skill.type}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">{skill.description}</p>
          </div>

          {/* How this works */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 space-y-3">
            <p className="font-medium text-zinc-700 text-sm">How integrity works</p>
            <p>
              The tarball can be hosted anywhere — GitHub Releases, a CDN, S3. The <code className="font-mono text-xs bg-zinc-100 px-1 rounded">digest</code> in{" "}
              <code className="font-mono text-xs bg-zinc-100 px-1 rounded">index.json</code> is the trust anchor, not the URL.
              After downloading, a client computes SHA-256 and compares — the same pattern as{" "}
              <a href="https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity" target="_blank" rel="noopener noreferrer" className="text-zinc-700 underline underline-offset-2">SRI on the web</a>.
              Even a compromised CDN can't serve a tampered tarball that passes the check.
            </p>
            <p>
              The <code className="font-mono text-xs bg-zinc-100 px-1 rounded">version</code> field is optional but useful: it makes the digest human-readable.{" "}
              <span className="font-mono text-xs bg-zinc-100 px-1 rounded">supabase@{skill.version}</span> is actionable in an incident report.{" "}
              An opaque hash alone requires retrieving and unpacking the tarball to understand what ran.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Install */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Install</h2>
            <div className="font-mono text-xs bg-zinc-900 text-zinc-100 rounded-lg px-3 py-2.5 select-all mb-2">
              skillpm install {skillName}
            </div>
          </div>

          {/* Integrity */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Integrity</h2>
            {skill.version && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-zinc-400">version</span>
                <span className="font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                  v{skill.version}
                </span>
              </div>
            )}
            <div className="text-xs text-zinc-400 mb-1">SHA-256 digest</div>
            <div className="font-mono text-xs break-all text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-lg p-3">
              {skill.digest}
            </div>
          </div>

          {/* Endpoints */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Endpoints</h2>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-zinc-400 mb-1">Discovery index</p>
                <a href={`${entity.wellKnownBase}/index.json`} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-zinc-600 hover:text-zinc-900 underline underline-offset-2">
                  /.well-known/agent-skills/index.json ↗
                </a>
              </div>
              <div>
                <p className="text-zinc-400 mb-1">Tarball</p>
                <a href={artifactUrl} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-zinc-600 hover:text-zinc-900 break-all underline underline-offset-2">
                  {skill.url.length > 50 ? skill.url.slice(0, 50) + "…" : skill.url} ↗
                </a>
              </div>
              {entity.github && (
                <div>
                  <p className="text-zinc-400 mb-1">Release history</p>
                  <a href={`${entity.github.replace('/agent-skills', '/agent-skills')}/releases`} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-zinc-600 hover:text-zinc-900 underline underline-offset-2">
                    GitHub Releases ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
