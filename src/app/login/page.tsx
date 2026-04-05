import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";

export const metadata = {
  title: "登录",
};

export default async function LoginPage({
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
          <h1 className="text-2xl font-bold">登录蚁域</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            登录后即可创建和管理你的蚁群
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
            const username = formData.get("username") as string;
            const password = formData.get("password") as string;

            if (!username || !password) {
              return redirect(`/login?message=${encodeURIComponent("请填写用户名和密码")}`);
            }

            // 查找用户
            const { data: user, error } = await db
              .from("users")
              .select("id, username, password_hash")
              .eq("username", username)
              .single();

            if (error || !user) {
              return redirect(`/login?message=${encodeURIComponent("用户名或密码错误")}`);
            }

            // 验证密码
            const valid = await verifyPassword(password, user.password_hash);
            if (!valid) {
              return redirect(`/login?message=${encodeURIComponent("用户名或密码错误")}`);
            }

            // 签发 token 并设置 cookie
            const token = await signToken({ id: user.id, username: user.username });
            await setAuthCookie(token);

            redirect("/colonies");
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
              placeholder="输入用户名"
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
              placeholder="输入密码"
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            登录
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          还没有账号？{" "}
          <Link href="/register" className="text-primary hover:underline">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
