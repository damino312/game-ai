import { AppHeader } from "@/components/app-header";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <AppHeader />

      <section className="rounded-3xl border border-white/10 bg-[rgb(var(--card))]/60 backdrop-blur p-7 shadow-sm">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))]" />
            Chroma Cloud memory • Skyrim personas
          </div>

          <h1 className="mt-4 text-3xl font-semibold leading-tight">
            Skyrim Companions Chat
          </h1>

          <p className="mt-3 text-sm text-white/70">
            Выбирай компаньона, общайся и сохраняй “память”, чтобы персонаж
            помнил твои факты и предпочтения.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-xl bg-[rgb(var(--accent))] px-4 py-2 text-sm font-semibold text-black hover:brightness-110 active:brightness-95"
              href="/companions"
            >
              Выбрать компаньона
            </Link>
            <Link
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
              href="/auth"
            >
              Войти / Регистрация
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Память",
            text: "Сохраняй заметки и факты — retrieval по смыслу через Chroma.",
          },
          {
            title: "Персоны",
            text: "Каждый компаньон имеет свой стиль и правила общения.",
          },
          {
            title: "История",
            text: "Сообщения сохраняются в Postgres (Prisma).",
          },
        ].map((x) => (
          <div
            key={x.title}
            className="rounded-2xl border border-white/10 bg-[rgb(var(--card))]/50 backdrop-blur p-5 shadow-sm"
          >
            <div className="text-sm font-semibold">{x.title}</div>
            <div className="mt-2 text-sm text-white/70">{x.text}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
