import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "skillpm — agent skills registry",
  description: "Registry POC demonstrating the .well-known agent-skills spec with per-publisher versioning",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-xs font-bold text-white font-mono">
                sk
              </span>
              <span className="text-base font-semibold tracking-tight">skillpm</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">POC</span>
            </a>
            <nav className="flex items-center gap-5 text-sm text-zinc-500">
              <a href="https://github.com/agentskills/agentskills/pull/254" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">
                .well-known spec ↗
              </a>
              <a href="https://github.com/agentskills/agentskills/pull/380" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">
                versioning proposal ↗
              </a>
              <a href="https://github.com/Rodriguespn/skillpm" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">
                GitHub ↗
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        <footer className="border-t border-zinc-200 mt-20">
          <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-zinc-400">
            Registry reads from publishers' <code className="font-mono">/.well-known/agent-skills/</code> endpoints — it stores nothing itself.
          </div>
        </footer>
      </body>
    </html>
  )
}
