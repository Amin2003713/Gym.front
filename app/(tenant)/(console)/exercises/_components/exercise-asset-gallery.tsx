'use client'

import { useState } from 'react'

import type { ExerciseAsset } from '../_model/exercise-assets'

interface ExerciseAssetGalleryProps {
  assets: ExerciseAsset[]
}

export default function ExerciseAssetGallery({
  assets,
}: ExerciseAssetGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = assets[activeIndex]
  // Main view plays/shows the original (best quality) file directly —
  // no preview covers. The strip below still uses thumbnails for speed.
  const mainSrc = active.originalUrl ?? active.url
  const originalSrc = active.originalUrl ?? active.url

  if (assets.length === 0) {
    return (
      <div className="bg-muted/30 text-muted-foreground flex min-h-48 items-center justify-center rounded-lg border border-dashed p-6 text-sm">
        رسانه‌ای برای این حرکت ثبت نشده است.
      </div>
    )
  }

  return (
    <section className="space-y-3">
      <div className="bg-muted/20 overflow-hidden rounded-lg border">
        {active.kind === 'video' ? (
          <video
            key={originalSrc}
            src={mainSrc}
            controls
            playsInline
            preload="auto"
            className="max-h-[480px] w-full object-contain"
          >
            مرورگر شما از پخش ویدئو پشتیبانی نمی‌کند.
          </video>
        ) : active.kind === 'image' || active.kind === 'animation' ? (
          <a
            key={originalSrc}
            href={originalSrc}
            target="_blank"
            rel="noreferrer"
            title="مشاهده کیفیت اصلی"
            aria-label={`مشاهده کیفیت اصلی ${active.name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mainSrc}
              alt={active.name}
              className="max-h-[480px] w-full object-contain"
            />
          </a>
        ) : (
          <div className="flex min-h-40 items-center justify-center p-6">
            <a
              href={originalSrc}
              target="_blank"
              rel="noreferrer"
              className="text-primary text-sm font-medium underline"
            >
              مشاهده فایل: {active.name}
            </a>
          </div>
        )}
      </div>

      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span className="truncate">{active.name}</span>
        <span className="shrink-0">
          {activeIndex + 1} از {assets.length}
        </span>
      </div>

      {assets.length > 1 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {assets.map((asset, index) => (
            <button
              key={`${asset.id ?? 'asset'}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`نمایش ${asset.name}`}
              aria-pressed={index === activeIndex}
              className={`overflow-hidden rounded-lg border p-1 text-right ${
                index === activeIndex
                  ? 'border-primary ring-primary/20 ring-2'
                  : 'border-border'
              }`}
            >
              {asset.kind === 'video' ? (
                <div className="bg-muted flex aspect-video items-center justify-center text-xs">
                  ویدئو
                </div>
              ) : asset.kind === 'image' || asset.kind === 'animation' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.thumbUrl ?? asset.url}
                  alt={asset.name}
                  className="aspect-video w-full rounded object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="bg-muted flex aspect-video items-center justify-center text-xs">
                  فایل
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
