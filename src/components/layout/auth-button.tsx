"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AuthButton() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查 cookie 是否存在来判断登录状态
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
        {user.username} · 退出
      </button>
    </form>
  );
}
