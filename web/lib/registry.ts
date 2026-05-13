// Fetches .well-known/agent-skills/* endpoints from a publisher's base URL.
// Artifact URLs in index.json are resolved per RFC 3986 §5.2.2 against the index URL.
// https://datatracker.ietf.org/doc/html/rfc3986#section-5.2.2

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

async function get<T>(base: string, path: string): Promise<T> {
  const res = await fetch(`${base}/${path}`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
  return res.json()
}

export const getIndex = (base: string) =>
  get<Index>(base, "index.json")

export const getVersionsIndex = (base: string) =>
  get<VersionsIndex>(base, "versions.json")

export const getVersionedIndex = (base: string, version: string) =>
  get<Index>(base, `v${version}/index.json`)

export const getSkillVersions = (base: string, name: string) =>
  get<SkillVersionsResponse>(base, `${name}/versions.json`)
