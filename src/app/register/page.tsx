import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, hashPassword } from "@/lib/auth";
import { ensureAuthMirror } from "@/lib/auth-admin";
import { db } from "@/lib/db";
import { BrandLogo } from "@/components/layout/header";

const REG_MESSAGES: Record<string, string> = {
  short_username: "用户名至少需要 2 个字符",
  invalid_username: "用户名只能包含字母、数字、下划线和中文",
  short_password: "密码至少需要 6 个字符",
  password_mismatch: "两次输入的密码不一致",
  user_exists: "该用户名已被使用",
  register_failed: "注册失败，请稍后重试",
};

export const metadata = {
  title: "注册",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const user = await getSession();
  if (user) redirect("/colonies");

  const { msg } = await searchParams;
  const message = msg ? REG_MESSAGES[msg] : undefined;
  const isSuccess = msg === "success";

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 relative">
      <div className="absolute top-1/4 -left-1/4 w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-[50%] h-[50%] bg-accent-warm/5 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
      
      <div className="w-full max-w-sm relative z-10">
        <div className="mb-8 text-center flex flex-col items-center">
          <Link
            href="/"
            className="group flex flex-col items-center justify-center gap-3 transition-transform hover:scale-105"
          >
            <BrandLogo className="w-10 h-10 border-white/20" glow={true} />
          </Link>
          <h1 className="text-2xl font-bold mt-6">成为微观记录者</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            创建账号，开始记录你的蚁群成长
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-xl border p-3.5 text-sm animate-[fadeInUp_0.3s_ease-out] ${
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

            const username = (formData.get("username") as string).trim();
            const password = formData.get("password") as string;
            const confirmPassword = formData.get("confirmPassword") as string;

            if (!username || username.length < 2) {
              redirect("/register?msg=short_username");
            }

            if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
              redirect("/register?msg=invalid_username");
            }

            if (password.length < 6) {
              redirect("/register?msg=short_password");
            }

            if (password !== confirmPassword) {
              redirect("/register?msg=password_mismatch");
            }

            const userId = crypto.randomUUID();
            const passwordHash = await hashPassword(password);

            try {
              await ensureAuthMirror({
                id: userId,
                username,
                passwordHash,
              });
            } catch {
              redirect("/register?msg=register_failed");
            }

            const { error } = await db
              .from("users")
              .insert({ id: userId, username, password_hash: passwordHash })
              .select("id")
              .single();

            if (error) {
              if (
                error.code === "23505" ||
                error.message?.includes("unique") ||
                error.message?.includes("duplicate")
              ) {
                redirect("/register?msg=user_exists");
              }

              redirect("/register?msg=register_failed");
            }

            redirect("/login?msg=registered");
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1.5 text-foreground/80"
            >
              用户名
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              placeholder="2-20 位，支持中英文和数字"
              minLength={2}
              maxLength={20}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm input-glow transition-all duration-200"
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1.5 text-foreground/80"
            >
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="至少 6 个字符"
              minLength={6}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm input-glow transition-all duration-200"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-1.5 text-foreground/80"
            >
              确认密码
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              placeholder="再次输入密码"
              minLength={6}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm input-glow transition-all duration-200"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            注册
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          已有账号？{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:text-primary-dark transition-colors"
          >
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
