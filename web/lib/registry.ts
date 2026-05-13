const BASE = process.env.REGISTRY_URL ?? "https://evvgbjqrweflsauugoaj.supabase.co/functions/v1/registry"

export interface SkillEntry {
  name: string
  description: string
  version: string
  type: "archive" | "skill-md"
  url: string
  digest: string
}

export interface Index {
  $schema: string
  skills: SkillEntry[]
}

export interface VersionsIndex {
  latest: string | null
  versions: string[]
}

export interface SkillVersion {
  version: string
  digest: string
  published_at: string
}

export interface SkillVersionsResponse {
  name: string
  versions: SkillVersion[]
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
  return res.json()
}

export const getIndex = () => get<Index>("index.json")
export const getVersionsIndex = () => get<VersionsIndex>("versions.json")
export const getVersionedIndex = (version: string) => get<Index>(`v${version}/index.json`)
export const getSkillVersions = (name: string) => get<SkillVersionsResponse>(`${name}/versions.json`)
