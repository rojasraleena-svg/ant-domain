"use client";

import { useState, useTransition } from "react";
import { createKeyAction, deleteKeyAction } from "./actions";

type ApiKeyObj = {
  id: string;
  name: string;
  key_hash: string;
  created_at: string;
};

export default function ApiKeySection({ keys }: { keys: ApiKeyObj[] }) {
  const [newKey, setNewKey] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", name);
        const res = await createKeyAction(formData);
        setNewKey(res.rawKey);
        setName("");
        setCopied(false);
      } catch (err: any) {
        alert(err.message || "创建密钥失败");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个密钥吗？删除后所有使用该密钥的应用将失去访问权限。")) return;
    
    setDeletingId(id);
    try {
      await deleteKeyAction(id);
      if (newKey) setNewKey(null);
    } catch (err: any) {
      alert(err.message || "删除密钥失败");
    } finally {
      if (deletingId === id) setDeletingId(null);
    }
  };

  const copyToClipboard = () => {
    if (newKey) {
      const copyText = `蚁域 API Key (请妥善保存):
${newKey}

接入指南 (SKILLS.md 链接):
https://ant.gqy20.top/SKILLS.md`;
      navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {newKey && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 p-4 rounded-lg mb-6 shadow-sm">
          <p className="font-semibold text-sm mb-3">
            ✅ 新的 API 密钥已生成！请立即复制并保存，离开页后将无法再次查看。复制的内容包含了自动接入的 SKILLS.md 链接。
          </p>
          <div className="flex items-center gap-2 bg-background border px-3 py-2 rounded-md text-sm text-foreground relative">
            <code className="break-all font-mono text-xs">{newKey}</code>
            <button
              onClick={copyToClipboard}
              className="ml-auto rounded bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
            >
              {copied ? "已复制配置" : "复制接入参数"}
            </button>
          </div>
        </div>
      )}

      {keys.length > 0 ? (
        <div className="border rounded-lg overflow-hidden bg-background">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">名称</th>
                <th className="px-4 py-3 font-medium w-[200px]">创建时间</th>
                <th className="px-4 py-3 font-medium w-[100px] text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keys.map(k => (
                <tr key={k.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{k.name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(k.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(k.id)}
                      disabled={deletingId === k.id}
                      className="text-destructive/80 hover:text-destructive text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {deletingId === k.id ? '删除中...' : '删除'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20 text-sm">
          暂无 API 密钥
        </div>
      )}

      <form onSubmit={handleCreate} className="mt-8 pt-6 border-t border-border/50">
        <h3 className="text-sm font-medium mb-3 text-foreground">创建新密钥</h3>
        <div className="flex gap-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如: OpenClaw 集成"
            className="flex-1 max-w-sm rounded-lg border bg-background px-4 py-2 text-sm shadow-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            disabled={isPending}
            maxLength={50}
          />
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="rounded-lg bg-primary px-6 py-2 text-sm text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
          >
            {isPending ? (
              <svg className="animate-spin h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : '创建密钥'}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          密钥用于允许第三方应用通过 API 访问你的数据。
        </p>
      </form>
    </div>
  );
}