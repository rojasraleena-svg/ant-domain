"use client";

import { useRouter } from "next/navigation";

interface DeleteColonyButtonProps {
  colonyId: number;
  colonyName: string;
}

export function DeleteColonyButton({ colonyId, colonyName }: DeleteColonyButtonProps) {
  const router = useRouter();

  async function handleDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!window.confirm(`确定要删除「${colonyName}」吗？\n删除后将无法恢复，所有关联日志也会被清除。`)) {
      return;
    }

    const formData = new FormData();
    formData.append("colonyId", String(colonyId));

    try {
      const res = await fetch("/colonies/delete", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("删除失败，请稍后重试");
      }
    } catch {
      alert("删除失败，请检查网络连接");
    }
  }

  return (
    <form onSubmit={handleDelete} className="absolute top-3 right-3 z-10">
      <button
        type="submit"
        title="删除蚁群"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/8 transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
    </form>
  );
}
