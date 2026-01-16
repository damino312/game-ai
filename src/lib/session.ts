import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function requireUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return { userId: session.user.id, user: session.user };
}
