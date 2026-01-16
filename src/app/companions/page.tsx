import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SignOutButton } from "@/components/sign-out-button";
import { AppHeader } from "@/components/app-header";

export default async function CompanionsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) redirect("/auth");

  const companions = await prisma.companion.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <main>
      <AppHeader right={<SignOutButton />} />

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Компаньоны</h1>
          <p className="mt-1 text-sm text-white/70">
            Выбери того, с кем пойдёшь по дороге. Каждый — со своим характером.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {companions.map((c) => (
          <div
            key={c.id}
            className="group rounded-2xl border border-white/10 bg-[rgb(var(--card))]/55 backdrop-blur p-5 shadow-sm hover:bg-[rgb(var(--card))]/70 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{c.name}</div>
                <div className="mt-1 text-sm text-white/70">
                  {c.description}
                </div>
              </div>

              <div className="hidden sm:block rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                Persona
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Link
                className="rounded-xl bg-[rgb(var(--accent))] px-4 py-2 text-sm font-semibold text-black hover:brightness-110 active:brightness-95"
                href={`/chat?companionId=${encodeURIComponent(c.id)}`}
              >
                Начать чат
              </Link>
              <Link
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                href={`/chat?companionId=${encodeURIComponent(c.id)}`}
              >
                Подробнее
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
