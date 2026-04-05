import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

function buildSyntheticEmail(userId) {
  return `${userId}@ant-domain.local`;
}

async function ensureAuthMirror(supabase, user) {
  const existing = await supabase.auth.admin.getUserById(user.id);

  if (!existing.error && existing.data.user) {
    return { created: false };
  }

  if (existing.error && existing.error.status && existing.error.status !== 404) {
    throw existing.error;
  }

  const { error } = await supabase.auth.admin.createUser({
    id: user.id,
    email: buildSyntheticEmail(user.id),
    email_confirm: true,
    password_hash: user.password_hash,
    user_metadata: {
      username: user.username,
      source: "public.users",
    },
  });

  if (error) throw error;

  return { created: true };
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables.");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: users, error } = await supabase
    .from("users")
    .select("id,username,password_hash")
    .order("created_at", { ascending: true });

  if (error) throw error;

  let created = 0;
  for (const user of users ?? []) {
    const result = await ensureAuthMirror(supabase, user);
    if (result.created) created += 1;
  }

  console.log(
    JSON.stringify(
      {
        totalUsers: users?.length ?? 0,
        createdAuthUsers: created,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
