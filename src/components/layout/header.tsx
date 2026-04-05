import Link from "next/link";
import { AuthButton } from "./auth-button";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/species", label: "资料库" },
  { href: "/lifecycle", label: "生活史" },
  { href: "/colonies", label: "我的蚁群" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">蚁域</span>
        </Link>

        {/* 导航 */}
        <nav className="flex items-center space-x-6 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 右侧：搜索 + 登录 */}
        <div className="ml-auto flex items-center space-x-4">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
