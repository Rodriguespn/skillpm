import { notFound } from "next/navigation"
import Link from "next/link"
import { getIndex, getSkillVersions } from "@/lib/registry"

export const revalidate = 60

interface Props {
  params: Promise<{ name: string }>
}

export default async function SkillPage({ params }: Props) {
  const { name } = await params

  const [index, skillVersions] = await Promise.all([
    getIndex().catch(() => ({ $schema: "", skills: [] })),
    getSkillVersions(name).catch(() => null),
  ])

  const skill = index.skills.find((s) => s.name === name)
  if (!skill) notFound()

  const BASE = "https://evvgbjqrweflsauugoaj.supabase.co/functions/v1/registry"

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8">
        <Link href="/" className="hover:text-zinc-600 transition-colors">Skills</Link>
        <span>/</span>
        <span className="text-zinc-700 font-mono">{name}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white text-xs font-bold font-mono shrink-0">
                {name.slice(0, 2)}
              </div>
              <div>
                <h1 className="text-lg font-semibold font-mono">{name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                    v{skill.version}
                  </span>
                  <span className="text-xs bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">
                    {skill.type}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">{skill.description}</p>
          </div>

          {/* Version history */}
          <div className="rounded-xl border border-zinc-200 bg-white">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-semibold">Version history</h2>
            </div>
            {!skillVersions || skillVersions.versions.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-zinc-400">No versions found</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {skillVersions.versions.map((v, i) => (
                  <div key={v.version} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium">v{v.version}</span>
                      {i === 0 && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                          latest
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span className="font-mono">{v.digest.slice(0, 19)}…</span>
                      <time dateTime={v.published_at}>
                        {new Date(v.published_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                  </div>
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
            <CodeBlock>{`skillpm install ${name}`}</CodeBlock>
            <CodeBlock>{`skillpm install ${name}@${skill.version}`}</CodeBlock>
          </div>

          {/* Integrity */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Integrity</h2>
            <div className="space-y-2 text-xs font-mono break-all text-zinc-500 bg-zinc-50 rounded-lg p-3 border border-zinc-100">
              {skill.digest}
            </div>
          </div>

          {/* Endpoints */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Endpoints</h2>
            <div className="space-y-2 text-xs">
              <EndpointRow label="Latest" href={`${BASE}/index.json`} />
              <EndpointRow label="Tarball" href={`${BASE}/${name}.tar.gz`} />
              <EndpointRow label="Versions" href={`${BASE}/${name}/versions.json`} />
            </div>
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
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-zinc-600 hover:text-zinc-900 underline underline-offset-2 truncate text-right"
      >
        JSON ↗
      </a>
    </div>
  )
}
