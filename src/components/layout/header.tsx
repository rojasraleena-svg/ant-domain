"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AuthButton } from "./auth-button";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/species", label: "资料库" },
  { href: "/gallery", label: "插画馆" },
  { href: "/lifecycle", label: "生活史" },
  { href: "/colonies", label: "我的蚁群" },
];

/* 几何版极简徽标 (用于各处复用) */
export function BrandLogo({ className = "w-6 h-6", glow = true }: { className?: string, glow?: boolean }) {
  return (
    <div className={`relative flex items-center justify-center rounded-full border border-white/20 transition-all duration-500 scale-100 ${className}`}>
      {/* 核心“宇宙/单点”隐喻 */}
      <div className={`w-1.5 h-1.5 rounded-full bg-primary ${glow ? 'shadow-[0_0_10px_#ff6432]' : ''} absolute top-1.5 right-1.5`} />
      <div className="w-0.5 h-0.5 rounded-full bg-white/50 absolute bottom-2 left-2" />
    </div>
  );
}

function MenuIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-background/40 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/20 transition-all duration-300">
      <div className="container mx-auto flex h-16 items-center px-4 lg:px-8">
        {/* Logo - 重构为极简几何风格 */}
        <Link href="/" className="mr-12 flex items-center gap-3 group">
          <div className="group-hover:border-white/60 group-hover:rotate-90 transition-all duration-500">
             <BrandLogo className="w-6 h-6 border-white/20" glow={true} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-[0.3em] uppercase text-foreground/90 leading-none">
              ANT<span className="font-light text-foreground/50">DOMAIN</span>
            </span>
          </div>
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center space-x-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link relative px-4 py-2 text-[11px] font-medium tracking-[0.15em] transition-all duration-300 ${
                isActive(item.href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
              {isActive(item.href) && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_currentColor]" />
              )}
            </Link>
          ))}
        </nav>

        {/* 右侧 */}
        <div className="ml-auto flex items-center space-x-3">
          <AuthButton />

          {/* 移动端菜单按钮 */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="菜单"
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* 移动端下拉菜单 */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl animate-[fadeInUp_0.2s_ease-out]">
          <nav className="container mx-auto px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary/8 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
