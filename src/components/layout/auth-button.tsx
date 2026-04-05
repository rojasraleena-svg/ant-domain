"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function AuthButton() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="h-8 w-16 animate-pulse rounded bg-muted" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-sm text-foreground/60 transition-colors hover:text-foreground"
        >
          登录
        </Link>
        <Link
          href="/register"
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
        >
          注册
        </Link>
      </div>
    );
  }

  return (
    <form
      action={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/";
      }}
    >
      <button
        type="submit"
        className="text-sm text-foreground/60 transition-colors hover:text-foreground"
      >
        退出
      </button>
    </form>
  );
}
