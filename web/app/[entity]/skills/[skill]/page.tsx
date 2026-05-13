import { notFound } from "next/navigation"
import Link from "next/link"
import { getEntity } from "@/lib/entities"
import { getIndex, getSkillVersions } from "@/lib/registry"

export const revalidate = 60

interface Props { params: Promise<{ entity: string; skill: string }> }

export default async function SkillPage({ params }: Props) {
  const { entity: entityId, skill: skillName } = await params
  const entity = getEntity(entityId)
  if (!entity) notFound()

  const [index, skillVersions] = await Promise.all([
    getIndex(entity.wellKnownBase).catch(() => ({ $schema: "", skills: [] })),
    getSkillVersions(entity.wellKnownBase, skillName).catch(() => null),
  ])

  const skill = index.skills.find((s) => s.name === skillName)
  if (!skill) notFound()

  const artifactUrl = new URL(skill.url, `${entity.wellKnownBase}/index.json`).href

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8">
        <Link href="/" className="hover:text-zinc-600 transition-colors">Registry</Link>
        <span>/</span>
        <Link href={`/${entityId}`} className="hover:text-zinc-600 transition-colors">{entity.name}</Link>
        <span>/</span>
        <span className="text-zinc-700 font-mono">{skillName}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Skill header */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white text-xs font-bold font-mono shrink-0">
                {skillName.slice(0, 2)}
              </div>
              <div>
                <h1 className="text-lg font-semibold font-mono leading-tight">{skillName}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                    v{skill.version}
                  </span>
                  <span className="text-xs bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">{skill.type}</span>
                  <span className="text-xs text-zinc-400">{entity.name}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">{skill.description}</p>
          </div>

          {/* Version history */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Version history</h2>
              <a href={`${entity.wellKnownBase}/${skillName}/versions.json`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors font-mono">
                {skillName}/versions.json ↗
              </a>
            </div>
            {!skillVersions || skillVersions.versions.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-zinc-400">No version history available</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {skillVersions.versions.map((v, i) => (
                  <Link key={v.version} href={`/${entityId}/skills/${skill.name}/v${v.version}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium">v{v.version}</span>
                      {i === 0 && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                          latest
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span className="font-mono hidden sm:block">{v.digest.slice(0, 19)}…</span>
                      <time dateTime={v.published_at}>
                        {new Date(v.published_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </time>
                      <span className="text-zinc-300 group-hover:text-zinc-500 transition-colors">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Install */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Install</h2>
            <CodeBlock>{`skillpm install ${skillName}`}</CodeBlock>
            <CodeBlock>{`skillpm install ${skillName}@${skill.version}`}</CodeBlock>
          </div>

          {/* Digest */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Integrity</h2>
            <div className="font-mono text-xs break-all text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-lg p-3">
              {skill.digest}
            </div>
          </div>

          {/* Endpoints */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Endpoints</h2>
            <div className="space-y-2.5 text-xs">
              <EndpointRow label="Latest tarball" href={artifactUrl} />
              <EndpointRow label="Versions" href={`${entity.wellKnownBase}/${skillName}/versions.json`} />
              <EndpointRow label="Index" href={`${entity.wellKnownBase}/index.json`} />
            </div>
          </div>

          {/* Publisher */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Publisher</h2>
            <Link href={`/${entityId}`} className="flex items-center justify-between text-sm text-zinc-700 hover:text-zinc-900 transition-colors">
              <span>{entity.name}</span>
              <code className="font-mono text-xs text-zinc-400">{entity.domain}</code>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="font-mono text-xs bg-zinc-900 text-zinc-100 rounded-lg px-3 py-2.5 mb-2 select-all">
      {children}
    </div>
  )
}

function EndpointRow({ label, href }: { label: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-zinc-400 shrink-0">{label}</span>
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="text-zinc-500 hover:text-zinc-800 underline underline-offset-2 truncate text-right font-mono text-xs">
        ↗
      </a>
    </div>
  )
}
