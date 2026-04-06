"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

export function AuthButton() {
  const [user, setUser] = useState<{ username: string; role?: string } | null>(null);
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
    return <div className="h-6 w-16 text-[10px] font-mono text-white/20 animate-pulse tracking-[0.2em] uppercase">Auth..</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4 lg:gap-6">
        <Link
          href="/login"
          className="text-[10px] sm:text-[11px] font-medium tracking-[0.2em] text-foreground/50 uppercase transition-all duration-500 hover:text-foreground relative group"
        >
          登录
          <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-500 group-hover:w-full"></span>
        </Link>
        <Link
          href="/register"
          className="text-[10px] sm:text-[11px] font-medium tracking-[0.2em] text-black bg-white px-4 py-2 uppercase transition-all duration-500 hover:bg-white/80 hover:scale-[0.98]"
        >
          注册
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 lg:gap-6">
      <div className="flex items-center text-[10px] sm:text-[11px] font-medium tracking-[0.1em] text-foreground/50 uppercase group cursor-default">
        USER/ <span className="font-bold text-foreground ml-1 group-hover:text-primary transition-colors">{user.username}</span>
      </div>
      <div className="w-px h-3 bg-white/20"></div>

      {/* 管理员入口 */}
      {user.role === "admin" && (
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <Shield className="w-3 h-3" />
          管理后台
        </Link>
      )}

      {user.role === "admin" && <div className="w-px h-3 bg-white/20"></div>}

      <Link
        href="/settings"
        className="text-[10px] sm:text-[11px] font-medium tracking-[0.2em] text-foreground/50 uppercase transition-all duration-500 hover:text-foreground relative group"
      >
        设置
        <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-500 group-hover:w-full"></span>
      </Link>
      <form
        className="flex"
        action={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/";
        }}
      >
        <button
          type="submit"
          className="text-[10px] sm:text-[11px] font-medium tracking-[0.2em] text-foreground/50 uppercase transition-all duration-500 hover:text-white hover:opacity-80"
        >
          退出
        </button>
      </form>
    </div>
  );
}
