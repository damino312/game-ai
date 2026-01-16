"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const params = useSearchParams();

  const initialMode = (params.get("mode") as Mode) || "login";
  const [mode, setMode] = useState<Mode>(initialMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (mode === "login" ? "Вход" : "Регистрация"),
    [mode]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.split("@")[0],
        });
        if (res.error) throw new Error(res.error.message);

        router.push("/companions");
        router.refresh();
        return;
      }

      const res = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (res.error) throw new Error(res.error.message);

      router.push("/companions");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-3rem)] flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[rgb(var(--card))]/60 backdrop-blur p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-white/60">Skyrim • Companions</div>
            <h1 className="text-2xl font-semibold mt-1">{title}</h1>
            <p className="mt-2 text-sm text-white/70">
              Войди, чтобы компаньоны могли помнить твои факты и заметки.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
            >
              На главную
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={
              "rounded-xl px-3 py-2 text-sm border border-white/10 transition " +
              (mode === "login"
                ? "bg-white/10 text-white"
                : "text-white/80 hover:bg-white/5")
            }
            onClick={() => setMode("login")}
          >
            Вход
          </button>
          <button
            type="button"
            className={
              "rounded-xl px-3 py-2 text-sm border border-white/10 transition " +
              (mode === "register"
                ? "bg-white/10 text-white"
                : "text-white/80 hover:bg-white/5")
            }
            onClick={() => setMode("register")}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-sm font-medium text-white/90">Имя</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/40"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Довакин"
                autoComplete="name"
              />
              <div className="mt-1 text-xs text-white/50">
                Можно оставить пустым — тогда возьмём часть email.
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-white/90">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-white/90">Пароль</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
            />
            <div className="mt-1 text-xs text-white/50">
              Используй пароль, который не жалко для тестового проекта.
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[rgb(var(--accent))] px-4 py-2 text-sm font-semibold text-black hover:brightness-110 active:brightness-95 disabled:opacity-50"
          >
            {loading
              ? "Подождите..."
              : mode === "login"
              ? "Войти"
              : "Создать аккаунт"}
          </button>

          <div className="text-xs text-white/50">
            Нажимая кнопку, ты создаёшь сессию через better-auth и сможешь
            пользоваться чатом и памятью.
          </div>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-white/50">
          <span>© Skyrim Companions</span>
          <Link href="/companions" className="hover:text-white/80">
            Перейти к компаньонам →
          </Link>
        </div>
      </div>
    </main>
  );
}
