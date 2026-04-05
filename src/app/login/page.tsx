import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "登录",
};

export default async function LoginPage({
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
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            const supabase = await createClient();

            const { error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) {
              redirect(`/login?message=${encodeURIComponent(error.message)}`);
            }

            redirect("/colonies");
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
