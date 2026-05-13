// Helpers shared between registry and publish edge functions

export function publicStorageUrl(supabaseUrl: string, storagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/artifacts/${storagePath}`
}

export function storagePathForVersion(skillName: string, version: string): string {
  return `${skillName}/${version}/${skillName}.tar.gz`
}

export function storagePathLatest(skillName: string): string {
  return `${skillName}/latest.tar.gz`
}
