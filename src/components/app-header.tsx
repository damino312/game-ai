import Link from "next/link";

export function AppHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="mb-6">
      <div className="rounded-2xl border border-white/10 bg-[rgb(var(--card))]/70 backdrop-blur px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border border-white/10 bg-black/30 grid place-items-center">
              <span className="text-[11px] tracking-widest text-[rgb(var(--accent))]">
                SKY
              </span>
            </div>
            <div>
              <div className="text-sm text-white/70">Skyrim</div>
              <div className="text-lg font-semibold leading-tight">
                Companions
              </div>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-2">
            <Link
              href="/companions"
              className="rounded-lg px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5"
            >
              Компаньоны
            </Link>
            <Link
              href="/chat"
              className="rounded-lg px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5"
            >
              Чат
            </Link>
          </nav>

          <div className="flex items-center gap-2">{right}</div>
        </div>
      </div>
    </header>
  );
}
