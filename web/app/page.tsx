import Link from "next/link"
import { ENTITIES } from "@/lib/entities"
import { getIndex } from "@/lib/registry"

export const revalidate = 60

export default async function HomePage() {
  const entities = await Promise.all(
    ENTITIES.map(async (entity) => {
      const index = await getIndex(entity.wellKnownBase).catch(() => ({ $schema: "", skills: [] }))
      return { entity, index }
    })
  )

  return (
    <div>
      {/* Hero */}
      <div className="mb-10 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-3">Agent Skills Registry</h1>
        <p className="text-zinc-500 text-sm leading-relaxed">
          A proof-of-concept registry showing the{" "}
          <a href="https://github.com/agentskills/agentskills/pull/254" target="_blank" rel="noopener noreferrer" className="text-zinc-700 underline underline-offset-2">
            .well-known agent-skills spec
          </a>{" "}
          and{" "}
          <a href="https://github.com/agentskills/agentskills/pull/380" target="_blank" rel="noopener noreferrer" className="text-zinc-700 underline underline-offset-2">
            versioning proposal
          </a>{" "}
          in action. The registry reads from each publisher's{" "}
          <code className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded">/.well-known/agent-skills/</code>{" "}
          endpoint — it stores nothing itself.
        </p>
      </div>

      {/* How it works */}
      <div className="mb-10 rounded-xl border border-zinc-200 bg-white p-5 text-sm">
        <p className="font-medium text-zinc-700 mb-3">How this works</p>
        <div className="flex flex-col gap-2 text-zinc-500">
          <Row n="1" text="A publisher serves" code="index.json" suffix=" at their well-known endpoint — just a list of available skills" />
          <Row n="2" text="Each skill's tarball can live anywhere: a CDN, GitHub Releases, S3. The URL is just a hint." />
          <Row n="3" text="The" code="digest" suffix=" is the trust anchor — clients verify SHA-256 after download, same as SRI on the web" />
          <Row n="4" text="The optional" code="version" suffix=' field makes the digest readable: "supabase@0.1.1 ran" vs an opaque hash' />
        </div>
      </div>

      {/* Publisher list */}
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Publishers</h2>
      <div className="space-y-4">
        {entities.map(({ entity, index }) => (
          <Link
            key={entity.id}
            href={`/${entity.id}`}
            className="group block rounded-xl border border-zinc-200 bg-white p-6 hover:border-zinc-400 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="font-semibold text-zinc-900">{entity.name}</span>
                  <code className="font-mono text-xs text-zinc-400">{entity.domain}</code>
                  {index.skills[0]?.version && (
                    <span className="font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                      v{index.skills[0].version}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">{entity.description}</p>
              </div>
              <span className="text-zinc-300 group-hover:text-zinc-500 transition-colors text-lg shrink-0 mt-0.5">→</span>
            </div>

            <div className="mt-4 flex items-center gap-5 text-xs text-zinc-400 border-t border-zinc-50 pt-4">
              <span><strong className="text-zinc-600">{index.skills.length}</strong> skills</span>
              <code className="font-mono text-zinc-300 ml-auto truncate">{entity.wellKnownBase}/index.json</code>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Row({ n, text, code, suffix }: { n: string; text: string; code?: string; suffix?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 text-xs shrink-0 font-mono">{n}</span>
      <span>{text}{code && <> <code className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded text-zinc-600">{code}</code></>}{suffix}</span>
    </div>
  )
}
