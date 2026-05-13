import Link from "next/link"

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="font-mono text-4xl font-bold text-zinc-200 mb-4">404</p>
      <p className="text-zinc-500 text-sm mb-6">Skill or page not found</p>
      <Link href="/" className="text-sm text-zinc-700 underline underline-offset-2 hover:text-zinc-900">
        Back to registry
      </Link>
    </div>
  )
}
