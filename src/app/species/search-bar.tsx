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
      className="flex gap-3 justify-center w-full max-w-2xl mx-auto relative group"
      role="search"
    >
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-focus-within:bg-primary/40 transition-colors duration-500 opacity-50" />
      <div className="relative flex w-full bg-card/40 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all duration-300">
        <div className="flex items-center pl-6 text-muted-foreground/60 w-10">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="search"
          name="q"
          autoComplete="off"
          defaultValue={defaultValue}
          placeholder="检索生命档案：属名 / 学名 / 俗称..."
          className="flex-1 bg-transparent px-4 py-4 text-base font-medium placeholder:text-muted-foreground/50 focus:outline-none text-foreground"
        />
        <button
          type="submit"
          className="px-8 py-4 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary-dark transition-colors duration-300 tracking-widest uppercase flex items-center gap-2"
        >
          探索 <span className="opacity-60 text-xs text-primary-foreground/70">↵</span>
        </button>
      </div>
    </form>
  );
}
