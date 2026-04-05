"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SpeciesSearch({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q") as string;
    const params = new URLSearchParams(searchParams.toString());
    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }
    router.push(`/species?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 flex gap-2"
      role="search"
    >
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="搜索物种中文名 / 学名 / 属名..."
        className="flex-1 max-w-md rounded-lg border bg-background px-4 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
      >
        搜索
      </button>
    </form>
  );
}
