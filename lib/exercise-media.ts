/**
 * Exercise media ordering shared by every surface that shows an exercise.
 *
 * The product rule is: (1) the original-quality GIF, so the movement animates before anything
 * else is attempted, then (2) the original asset (video or still), and only then the lighter
 * derivatives. The previous implementation took the first `preview|original|thumb` variant it
 * found, which often meant a static thumbnail even when a GIF existed.
 */

export type MediaVariantLike = {
  variantName?: string | null
  url?: string | null
  contentType?: string | null
  kind?: number | null
}

export type MediaAssetLike = {
  originalFileName?: string | null
  contentType?: string | null
  extension?: string | null
  variants?: MediaVariantLike[] | null
}

export type ExerciseMediaLike = {
  role?: number | null
  order?: number | null
  isPrimary?: boolean | null
  asset?: MediaAssetLike | null
}

const isGif = (variant: MediaVariantLike, asset?: MediaAssetLike | null) => {
  const type = variant.contentType ?? asset?.contentType ?? ''
  return (
    /gif/i.test(type) ||
    /\.gif(\?|$)/i.test(variant.url ?? '') ||
    /\.gif$/i.test(asset?.originalFileName ?? '')
  )
}

const QUALITY_PATTERN = /original|source|full|raw/i
const PREVIEW_PATTERN = /preview|medium|large/i
const THUMB_PATTERN = /thumb|small|mini/i

/** Lower is tried first. */
const variantScore = (variant: MediaVariantLike, asset?: MediaAssetLike | null) => {
  const name = (variant.variantName ?? '').toLowerCase()
  const gif = isGif(variant, asset)

  if (gif && QUALITY_PATTERN.test(name)) return 0
  if (gif) return 1
  if (QUALITY_PATTERN.test(name)) return 2
  if (PREVIEW_PATTERN.test(name)) return 3
  if (THUMB_PATTERN.test(name)) return 4
  return 5
}

/**
 * Every usable media URL in the order it should be attempted. Falls through to the next entry when
 * an asset is missing or fails to load, so a deleted derivative degrades instead of breaking.
 */
export function exerciseMediaSources(
  media: ExerciseMediaLike[] | ExerciseMediaLike | null | undefined,
): string[] {
  const items = (Array.isArray(media) ? media : media ? [media] : []).slice()

  const scored: Array<{ url: string; score: number }> = []

  items.forEach((item, itemIndex) => {
    const variants = item.asset?.variants ?? []
    const itemBias = (item.isPrimary ? 0 : 0.1) + itemIndex * 0.001

    variants.forEach((variant) => {
      const url = variant.url?.trim()
      if (!url) return
      scored.push({ url, score: variantScore(variant, item.asset) + itemBias })
    })
  })

  scored.sort((a, b) => a.score - b.score)

  return [...new Set(scored.map((entry) => entry.url))]
}

/** True when the first source is an animated GIF — used for the small "GIF" badge. */
export function isAnimatedSource(url?: string | null) {
  return /\.gif(\?|$)/i.test(url ?? '')
}
