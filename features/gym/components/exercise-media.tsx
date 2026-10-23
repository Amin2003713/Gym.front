import type { ExerciseMedia as ExerciseMediaContract } from '../domain/types'

/** Renders only media supplied by the backend. Missing media intentionally renders nothing. */
export function ExerciseMedia({ media, alt }: { media?: ExerciseMediaContract | null; alt?: string }) {
  if (!media?.url) return null

  return (
    // The backend is responsible for returning an approved image/GIF/animated SVG URL.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={media.url}
      alt={media.alt || alt || ''}
      loading="lazy"
      className="max-h-full max-w-full object-contain"
      data-media-kind={media.kind.toLowerCase()}
    />
  )
}
