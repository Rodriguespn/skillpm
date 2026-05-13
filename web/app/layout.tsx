import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "skillpm",
  description: "Agent skills registry — .well-known spec POC",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-xs font-bold text-white">
                sk
              </span>
              <span className="text-base font-semibold tracking-tight">skillpm</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">POC</span>
            </a>
            <nav className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="/" className="hover:text-zinc-900 transition-colors">Skills</a>
              <a href="/releases" className="hover:text-zinc-900 transition-colors">Releases</a>
              <a
                href="https://github.com/agentskills/agentskills/pull/254"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-900 transition-colors"
              >
                Spec ↗
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        <footer className="border-t border-zinc-200 mt-20">
          <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between text-xs text-zinc-400">
            <span>skillpm — agent skills registry POC</span>
            <div className="flex gap-4">
              <a href="https://github.com/agentskills/agentskills/pull/380" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600">
                versioning proposal ↗
              </a>
              <a href="https://agentskills.io" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600">
                agentskills.io ↗
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
