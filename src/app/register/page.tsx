import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "注册",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/colonies");
  }

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
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            const confirmPassword = formData.get("confirmPassword") as string;
            const supabase = await createClient();

            if (password !== confirmPassword) {
              redirect(
                `/register?message=${encodeURIComponent("两次输入的密码不一致")}`
              );
            }

            if (password.length < 6) {
              redirect(
                `/register?message=${encodeURIComponent("密码至少需要6个字符")}`
              );
            }

            const { error } = await supabase.auth.signUp({
              email,
              password,
            });

            if (error) {
              redirect(`/register?message=${encodeURIComponent(error.message)}`);
            }

            redirect("/login?message=注册成功，请登录");
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1.5"
            >
              邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="your@email.com"
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
              autoComplete="email"
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
