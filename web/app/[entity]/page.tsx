import { notFound } from "next/navigation"
import Link from "next/link"
import { getEntity } from "@/lib/entities"
import { getIndex } from "@/lib/registry"

export const revalidate = 60

interface Props { params: Promise<{ entity: string }> }

export default async function EntityPage({ params }: Props) {
  const { entity: entityId } = await params
  const entity = getEntity(entityId)
  if (!entity) notFound()

  const index = await getIndex(entity.wellKnownBase).catch(() => ({ $schema: "", skills: [] }))

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8">
        <Link href="/" className="hover:text-zinc-600 transition-colors">Registry</Link>
        <span>/</span>
        <span className="text-zinc-700">{entity.name}</span>
      </div>

      {/* Entity header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{entity.name}</h1>
            <code className="font-mono text-sm text-zinc-400">{entity.domain}</code>
          </div>
          <p className="text-zinc-500 text-sm">{entity.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {entity.github && (
            <a href={entity.github} target="_blank" rel="noopener noreferrer"
              className="text-xs text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1.5 hover:border-zinc-400 transition-colors bg-white">
              GitHub ↗
            </a>
          )}
        </div>
      </div>

      {/* Source */}
      <div className="mb-8 flex items-center gap-2 text-xs text-zinc-400 bg-white border border-zinc-200 rounded-lg px-4 py-3">
        <span className="shrink-0">Served from</span>
        <code className="font-mono text-zinc-500 truncate">{entity.wellKnownBase}/index.json</code>
        <a href={`${entity.wellKnownBase}/index.json`} target="_blank" rel="noopener noreferrer"
          className="ml-auto shrink-0 hover:text-zinc-600 transition-colors">↗</a>
      </div>

      {/* Skills */}
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
        {index.skills.length} skill{index.skills.length !== 1 ? "s" : ""}
      </h2>
      {index.skills.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-400">
          No skills found at this endpoint
        </div>
      ) : (
        <div className="space-y-3">
          {index.skills.map((skill) => (
            <Link key={skill.name} href={`/${entityId}/skills/${skill.name}`}
              className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 hover:border-zinc-400 hover:shadow-sm transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="font-mono text-sm font-semibold text-zinc-900">{skill.name}</span>
                  {skill.version && (
                    <span className="font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                      v{skill.version}
                    </span>
                  )}
                  <span className="text-xs bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">{skill.type}</span>
                </div>
                <p className="text-sm text-zinc-500 line-clamp-1">{skill.description}</p>
              </div>
              <div className="flex items-center gap-4 ml-4 shrink-0">
                <span className="font-mono text-xs text-zinc-300 hidden sm:block">{skill.digest.slice(0, 15)}…</span>
                <span className="text-zinc-300 group-hover:text-zinc-500 transition-colors">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
