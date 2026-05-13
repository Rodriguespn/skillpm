// Registry of known publishers. Each entity serves a .well-known/agent-skills/ endpoint.
// The web app reads from these endpoints — it stores nothing itself.

export interface Entity {
  id: string           // URL slug
  name: string         // display name
  domain: string       // canonical domain (shown in UI)
  wellKnownBase: string // actual URL to fetch .well-known endpoints from
  description: string
  github?: string
}

export const ENTITIES: Entity[] = [
  {
    id: "supabase",
    name: "Supabase",
    domain: "supabase.com",
    // Simulates supabase.com/.well-known/agent-skills/ per the versioning proposal
    // https://github.com/supabase/supabase/pull/45641
    wellKnownBase: "https://evvgbjqrweflsauugoaj.supabase.co/functions/v1/registry",
    description: "Open source Firebase alternative. Database, Auth, Edge Functions, Realtime, and Storage.",
    github: "https://github.com/supabase/agent-skills",
  },
]

export function getEntity(id: string): Entity | undefined {
  return ENTITIES.find((e) => e.id === id)
}
