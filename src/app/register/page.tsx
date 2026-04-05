import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const metadata = {
  title: "注册",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await getSession();
  if (user) redirect("/colonies");

  const { message } = await searchParams;

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">注册蚁域</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            创建账号，开始记录你的蚁群成长
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {message}
          </div>
        )}

        <form
          action={async (formData) => {
            "use server";
            const username = (formData.get("username") as string).trim();
            const password = formData.get("password") as string;
            const confirmPassword = formData.get("confirmPassword") as string;

            // 校验用户名
            if (!username || username.length < 2) {
              return redirect(
                `/register?message=${encodeURIComponent("用户名至少需要2个字符")}`
              );
            }
            if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
              return redirect(
                `/register?message=${encodeURIComponent("用户名只能包含字母、数字、下划线和中文")}`
              );
            }

            // 校验密码
            if (password.length < 6) {
              return redirect(
                `/register?message=${encodeURIComponent("密码至少需要6个字符")}`
              );
            }
            if (password !== confirmPassword) {
              return redirect(
                `/register?message=${encodeURIComponent("两次输入的密码不一致")}`
              );
            }

            // 检查用户名是否已存在
            const { data: existing } = await db
              .from("users")
              .select("id")
              .eq("username", username)
              .single();

            if (existing) {
              return redirect(
                `/register?message=${encodeURIComponent("该用户名已被使用")}`
              );
            }

            // 创建用户
            const passwordHash = await hashPassword(password);
            const { error } = await db.from("users").insert({
              username,
              password_hash: passwordHash,
            });

            if (error) {
              return redirect(
                `/register?message=${encodeURIComponent("注册失败，请稍后重试")}`
              );
            }

            redirect("/login?message=注册成功，请登录");
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1.5"
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
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1.5"
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
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-1.5"
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
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            注册
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          已有账号？{" "}
          <Link href="/login" className="text-primary hover:underline">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
