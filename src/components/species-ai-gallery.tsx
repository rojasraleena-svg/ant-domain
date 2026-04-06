"use client";

import { useState, useEffect } from "react";
import { Image as ImageIcon, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";

interface SpeciesAIImage {
  id: number;
  url: string;
  thumbnail_url: string | null;
  style: string | null;
  view_type: string | null;
  caste: string | null;
  is_featured: boolean;
}

const STYLE_MAP: Record<string, string> = {
  scientific: "科学插图",
  macro_photo: "微距摄影",
  watercolor: "手绘水彩",
  realistic: "写实数字画",
};

interface Props {
  speciesId: number;
  nameCn: string;
  nameLat: string;
}

export function SpeciesAIGallery({ speciesId, nameCn, nameLat }: Props) {
  const [images, setImages] = useState<SpeciesAIImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/gallery?speciesId=${speciesId}&pageSize=8`)
      .then((res) => res.json())
      .then((data) => {
        setImages((data.images || []).slice(0, 8) as SpeciesAIImage[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [speciesId]);

  if (loading) return null;

  if (images.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <ImageIcon className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-semibold text-base">AI 插图</h2>
          <span className="text-xs text-muted-foreground">({images.length} 张)</span>
        </div>
        <Link
          href={`/gallery?speciesId=${speciesId}`}
          className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          查看全部
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative rounded-lg overflow-hidden border border-white/[0.06] bg-card aspect-square cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.thumbnail_url || img.url}
              alt={`${nameCn} AI 插图`}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* 精选标记 */}
            {img.is_featured && (
              <div className="absolute top-1 left-1 flex items-center gap-0.5 rounded-full bg-yellow-500/90 px-1 py-0.5 text-[7px] text-yellow-900 font-medium">
                <Sparkles className="w-2 h-2 fill-current" />
              </div>
            )}

            {/* 悬停信息 */}
            <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              {img.style && (
                <p className="text-[7px] text-white truncate px-0.5">
                  {STYLE_MAP[img.style] || img.style}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
