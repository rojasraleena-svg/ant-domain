import { getSession } from "@/lib/auth";
import { listApiKeys } from "@/lib/apiKey";
import { redirect } from "next/navigation";
import ApiKeySection from "./api-keys-section";

export const metadata = { title: "设置 | 蚁域" };

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const keys = await listApiKeys(user.id);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">账号设置</h1>
      
      <div className="grid gap-8">
        <section className="bg-card rounded-xl border border-border/50 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className="p-6 border-b border-border/50 bg-muted/20">
            <h2 className="text-lg font-semibold text-foreground">API 密钥</h2>
            <p className="text-sm text-foreground/60 mt-1">
              管理你的 API 密钥，用于各种第三方客户端集成，如 OpenClaw 助手等应用。
            </p>
          </div>
          <div className="p-6">
            {/* The ApiKeySection manages the keys data and state on client side */}
            <ApiKeySection keys={keys || []} />
          </div>
        </section>
      </div>
    </div>
  );
}