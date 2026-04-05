import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, setAuthCookie, signToken, verifyPassword } from "@/lib/auth";
import { ensureAuthMirror } from "@/lib/auth-admin";
import { db } from "@/lib/db";
import { BrandLogo } from "@/components/layout/header";

const LOGIN_MESSAGES: Record<string, string> = {
  empty_fields: "请填写用户名和密码",
  invalid_credentials: "用户名或密码错误",
  registered: "注册成功，请登录",
  login_failed: "登录失败，请稍后重试",
};

export const metadata = {
  title: "登录",
};

function AntDecorative() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <BrandLogo className="w-10 h-10 border-white/20" glow={true} />
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const user = await getSession();
  if (user) redirect("/colonies");

  const { msg } = await searchParams;
  const message = msg ? LOGIN_MESSAGES[msg] : undefined;
  const isSuccess = msg === "registered";

  return (
    <div className="min-h-[calc(100vh-3.75rem)] flex items-center justify-center px-4 relative overflow-hidden bg-gradient-warm pattern-dots">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 -left-20 w-60 h-60 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/3 -right-10 w-40 h-40 rounded-full bg-accent-warm/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2">
          <AntDecorative />
        </div>
      </div>

      <div className="relative w-full max-w-sm animate-[scaleIn_0.4s_ease-out]">
        <div className="glass rounded-2xl p-8 sm:p-10 shadow-xl shadow-earth-brown/5">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/8 text-primary mb-4">
              <svg className="w-7 h-7 text-primary" viewBox="0 0 32 32" fill="none">
                <ellipse cx="16" cy="22" rx="8" ry="4.5" fill="currentColor" opacity="0.9" />
                <circle cx="16" cy="12" r="5.5" fill="currentColor" opacity="0.9" />
                <circle cx="14.5" cy="10.5" r="1.5" fill="white" opacity="0.25" />
                <path
                  d="M13 7.5 Q10 2.5 7.5 4.5 M19 7.5 Q22 2.5 24.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
                <path
                  d="M9 20 L4.5 25.5 M9.5 21.5 L4 24 M10 23 L5.5 27.5 M23 20 L27.5 25.5 M22.5 21.5 L28 24 M22 23 L26.5 27.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">欢迎回来</h1>
            <p className="mt-1 text-sm text-muted-foreground">登录蚁域，管理你的蚂蚁世界</p>
          </div>

          {message && (
            <div
              className={`mb-6 rounded-xl border p-4 text-sm animate-[fadeInUp_0.3s_ease-out] ${
                isSuccess
                  ? "bg-primary/8 border-primary/20 text-primary"
                  : "bg-destructive/8 border-destructive/15 text-destructive"
              }`}
            >
              {message}
            </div>
          )}

          <form
            action={async (formData) => {
              "use server";

              const username = formData.get("username") as string;
              const password = formData.get("password") as string;

              if (!username || !password) {
                redirect("/login?msg=empty_fields");
              }

              const { data: user, error } = await db
                .from("users")
                .select("id, username, password_hash")
                .eq("username", username)
                .single();

              if (error || !user) {
                redirect("/login?msg=invalid_credentials");
              }

              const valid = await verifyPassword(password, user.password_hash);
              if (!valid) {
                redirect("/login?msg=invalid_credentials");
              }

              try {
                await ensureAuthMirror({
                  id: user.id,
                  username: user.username,
                  passwordHash: user.password_hash,
                });
              } catch {
                redirect("/login?msg=login_failed");
              }

              const token = await signToken({ id: user.id, username: user.username });
              await setAuthCookie(token);
              redirect("/colonies");
            }}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-2 text-foreground/80"
              >
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="输入用户名"
                autoComplete="username"
                className="w-full rounded-xl border bg-background/70 px-4 py-2.5 text-sm input-glow transition-all duration-200"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2 text-foreground/80"
              >
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="输入密码"
                autoComplete="current-password"
                className="w-full rounded-xl border bg-background/70 px-4 py-2.5 text-sm input-glow transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
            >
              登录
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            还没有账号？{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:text-primary-dark transition-colors"
            >
              注册账号
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
