"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type ChatMsg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

export default function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ companionId?: string }>;
}) {
  const { companionId = "lydia" } = use(searchParams) as {
    companionId?: string;
  };

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const listRef = useRef<HTMLDivElement>(null);

  const title = useMemo(() => `Чат с ${companionId}`, [companionId]);

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior });
    });
  }

  // 1) Load history on enter / companion change
  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setIsLoadingHistory(true);
      try {
        const res = await fetch(
          `/api/chat/history?companionId=${encodeURIComponent(companionId)}`,
          { method: "GET" }
        );

        const data = await res.json();

        if (cancelled) return;

        if (data?.conversationId) setConversationId(data.conversationId);
        if (Array.isArray(data?.messages)) setMsgs(data.messages);
        requestAnimationFrame(() => scrollToBottom("auto"));
      } catch {
        // optional: show a soft error message in UI
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companionId]);

  async function send() {
    const text = input.trim();
    if (!text || isSending) return;

    // optimistic
    const optimistic: ChatMsg = { role: "user", content: text };
    setMsgs((m) => [...m, optimistic]);
    setInput("");
    setIsSending(true);
    scrollToBottom("smooth");

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          companionId,
          message: text,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Ошибка отправки сообщения");
      }

      if (data?.conversationId) setConversationId(data.conversationId);

      const answer: ChatMsg = {
        role: "assistant",
        content: data.answer ?? "…",
      };

      setMsgs((m) => [...m, answer]);
      scrollToBottom("smooth");
    } catch (e: any) {
      // roll back optimistic by appending error message
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "⚠️ Не получилось отправить сообщение. Проверь сервер/ключи/БД и попробуй снова.\n" +
            (e?.message ? `\n${e.message}` : ""),
        },
      ]);
      scrollToBottom("smooth");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-3rem)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-white/60">Skyrim • Companion</div>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
            href="/companions"
          >
            Компаньоны
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[rgb(var(--card))]/55 backdrop-blur shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-sm text-white/70">
            История: <span className="text-[rgb(var(--accent))]">Postgres</span>{" "}
            • Память: <span className="text-[rgb(var(--accent))]">Chroma</span>
          </div>
          <div className="text-xs text-white/50">
            {conversationId ? `#${conversationId.slice(0, 8)}` : "new"}
          </div>
        </div>

        <div
          ref={listRef}
          className="h-[60vh] overflow-y-auto px-4 py-4 space-y-3"
        >
          {isLoadingHistory && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Загружаю историю…
            </div>
          )}

          {!isLoadingHistory && msgs.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Напиши что-нибудь — компаньон ответит в своём стиле.
              <div className="mt-2 text-xs text-white/50">
                “Запомнить” сохраняет последнюю реплику пользователя в Chroma.
              </div>
            </div>
          )}

          {msgs.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id ?? idx}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm shadow-sm",
                    isUser
                      ? "bg-[rgb(var(--accent))] text-black"
                      : "border border-white/10 bg-black/20 text-white",
                  ].join(" ")}
                >
                  {m.content}
                  {m.createdAt && (
                    <div className="mt-2 text-[11px] opacity-60">
                      {new Date(m.createdAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/40"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напиши сообщение..."
              onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
            />
            <button
              className="rounded-xl bg-[rgb(var(--accent))] px-5 py-2 text-sm font-semibold text-black hover:brightness-110 active:brightness-95 disabled:opacity-50"
              onClick={send}
              disabled={isSending}
            >
              {isSending ? "…" : "Отправить"}
            </button>
          </div>

          <div className="mt-2 text-xs text-white/50">
            История берётся из Postgres при открытии страницы.
          </div>
        </div>
      </div>
    </main>
  );
}
