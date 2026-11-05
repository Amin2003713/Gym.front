'use client'

import { Dumbbell } from '@/components/icons'
import { useMemo, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import {
  exerciseMediaSources,
  isAnimatedSource,
  type ExerciseMediaLike,
} from '@/lib/exercise-media'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type Props = {
  /** One media row or the list from an exercise detail/list payload. */
  media: ExerciseMediaLike[] | ExerciseMediaLike | null | undefined
  /** Exercise name, used as the image's alternative text. */
  name: string
  className?: string
  imgClassName?: string
  /** `card` keeps the browser lazy-loading; `detail` loads immediately for the open step. */
  loading?: 'lazy' | 'eager'
  showBadge?: boolean
}

type FrameProps = Omit<Props, 'media'> & {
  sources: string[]
}

/**
 * One frame of the media stack. Mounted with a `key` made from the source list, so a new exercise
 * starts at the first source with a fresh index without a reset effect (which the lint rule — and
 * React — prefer to the cascading render).
 */
function MediaFrame({
  sources,
  name,
  className,
  imgClassName,
  loading = 'lazy',
  showBadge = true,
}: FrameProps) {
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    sources.length ? 'loading' : 'error',
  )

  const src = sources[index]
  const animated = isAnimatedSource(src)

  return (
    <div
      className={cn(
        'bg-muted/40 relative flex items-center justify-center overflow-hidden',
        className,
      )}
    >
      {status === 'loading' && (
        <Skeleton className="absolute inset-0 rounded-none" aria-hidden />
      )}

      {status === 'error' || !src ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 px-3 py-6 text-center">
          <Dumbbell className="size-7 opacity-50" aria-hidden />
          <span className="text-xs leading-5">{t('media.unavailable')}</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={name}
          loading={loading}
          decoding="async"
          onLoad={() => setStatus('ready')}
          onError={() => {
            if (index + 1 < sources.length) {
              setStatus('loading')
              setIndex((current) => current + 1)
              return
            }
            setStatus('error')
          }}
          className={cn(
            'relative z-10 max-h-full max-w-full object-contain transition-opacity duration-200',
            status === 'ready' ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      )}

      {showBadge && animated && status !== 'error' && (
        <span className="bg-background/90 text-foreground absolute bottom-1.5 start-1.5 z-20 rounded-full border px-1.5 py-0.5 text-[9px] font-bold tracking-wide">
          GIF
        </span>
      )}

      {status === 'loading' && (
        <span role="status" className="sr-only">
          {t('media.loading')}
        </span>
      )}
    </div>
  )
}

/**
 * The one exercise visual used by the trainer workout step, the exercise detail card and the
 * library. It walks `exerciseMediaSources` (original GIF → original asset → preview → thumb),
 * shows a skeleton while the frame is decoding, and only gives up after every source failed.
 */
export function ExerciseMedia({ media, ...props }: Props) {
  const sources = useMemo(() => exerciseMediaSources(media), [media])

  return <MediaFrame key={sources.join('|')} sources={sources} {...props} />
}
