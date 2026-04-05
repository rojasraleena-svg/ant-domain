"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AuthButton() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // 未登录
      }
      setLoading(false);
    };
    checkAuth();
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
    <div className="flex items-center gap-4">
      <div className="flex items-center text-sm gap-2 text-foreground/60">
        <span className="font-medium text-foreground">{user.username}</span>
      </div>
      <Link href="/settings" className="text-sm text-foreground/60 transition-colors hover:text-foreground">
        设置
      </Link>
      <form
        action={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
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
    </div>
  );
}
