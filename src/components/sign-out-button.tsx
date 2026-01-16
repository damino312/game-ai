"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      className="rounded-md border px-3 py-2 text-sm"
      onClick={async () => {
        await authClient.signOut();
        router.push("/auth");
        router.refresh();
      }}
    >
      Выйти
    </button>
  );
}
