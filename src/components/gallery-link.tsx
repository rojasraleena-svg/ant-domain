"use client";

export function GalleryLink({ speciesId }: { speciesId: number }) {
  return (
    <span
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") window.location.href = `/gallery?speciesId=${speciesId}`;
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        window.location.href = `/gallery?speciesId=${speciesId}`;
      }}
      className="bg-primary/8 backdrop-blur-md px-2 py-1 rounded-md border border-primary/20 text-primary hover:bg-primary/15 hover:border-primary/30 transition-colors cursor-pointer select-none"
    >
      AI 插图
    </span>
  );
}
