"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AuthButton } from "./auth-button";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/species", label: "资料库" },
  { href: "/lifecycle", label: "生活史" },
  { href: "/colonies", label: "我的蚁群" },
];

/* 蚂蚁 Logo SVG — 填充版 */
function AntLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      {/* 身体填充 */}
      <ellipse cx="16" cy="22" rx="8" ry="4.5" fill="currentColor" opacity="0.9" />
      <circle cx="16" cy="12" r="5.5" fill="currentColor" opacity="0.9" />
      {/* 头部高光 */}
      <circle cx="14.5" cy="10.5" r="1.5" fill="white" opacity="0.25" />
      {/* 触角 */}
      <path d="M13 7.5 Q10 2.5 7.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d="M19 7.5 Q22 2.5 24.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      {/* 腿 — 左侧 */}
      <path d="M9 20 L4.5 25.5 M9.5 21.5 L4 24 M10 23 L5.5 27.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* 腿 — 右侧 */}
      <path d="M23 20 L27.5 25.5 M22.5 21.5 L28 24 M22 23 L26.5 27.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto flex h-15 items-center px-4">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center gap-2 group">
          <AntLogo className="w-7 h-7 text-primary transition-transform duration-300 group-hover:scale-110" />
          <span className="text-lg font-bold tracking-tight">
            蚁<span className="text-primary">域</span>
          </span>
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link relative px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive(item.href)
                  ? "text-foreground active"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
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
