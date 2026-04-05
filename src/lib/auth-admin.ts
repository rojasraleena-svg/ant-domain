import { db } from "@/lib/db";

export interface AppUserAuthMirrorInput {
  id: string;
  username: string;
  passwordHash: string;
}

function buildSyntheticEmail(userId: string) {
  return `${userId}@ant-domain.local`;
}

export async function ensureAuthMirror(user: AppUserAuthMirrorInput) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to sync auth users.");
  }

  const existing = await db.auth.admin.getUserById(user.id);
  if (!existing.error && existing.data.user) {
    return { created: false as const };
  }

  if (existing.error && existing.error.status && existing.error.status !== 404) {
    throw existing.error;
  }

  const { error } = await db.auth.admin.createUser({
    id: user.id,
    email: buildSyntheticEmail(user.id),
    email_confirm: true,
    password_hash: user.passwordHash,
    user_metadata: {
      username: user.username,
      source: "public.users",
    },
  });

  if (error) {
    throw error;
  }

  return { created: true as const };
}
