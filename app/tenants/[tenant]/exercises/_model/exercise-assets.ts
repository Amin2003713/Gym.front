export interface ExerciseAsset {
  id?: string
  url: string
  name: string
  contentType?: string
  kind: 'image' | 'video' | 'animation' | 'other'
  /** Small variant — list/card covers and gallery thumbnails. */
  thumbUrl?: string
  /** Larger preview variant — gallery main view. */
  previewUrl?: string
  /** Original file — best quality, used for zoom/download. */
  originalUrl?: string
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function getString(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return undefined
}

function classifyAsset(
  url: string,
  contentType?: string,
): ExerciseAsset['kind'] {
  const type = contentType?.toLowerCase() ?? ''
  const path = url.split(/[?#]/)[0].toLowerCase()

  if (type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv)$/.test(path)) {
    return 'video'
  }

  if (
    type === 'image/gif' ||
    type === 'image/svg+xml' ||
    /\.(gif|svg|apng)$/.test(path)
  ) {
    return 'animation'
  }

  if (
    type.startsWith('image/') ||
    /\.(png|jpe?g|webp|avif|bmp|ico|tiff?)$/.test(path)
  ) {
    return 'image'
  }

  return 'other'
}

/** Buckets a media variant name into thumb / preview / original. */
function variantBucket(name: string): 'thumb' | 'preview' | 'original' {
  if (/thumb|small|mini/i.test(name)) return 'thumb'
  if (/preview|middle|medium|mobile/i.test(name)) return 'preview'
  return 'original'
}

/**
 * Maps the typed exercise detail `media` array (asset with variants) into
 * flat gallery assets. Variants are grouped per media entry:
 * - thumbnail → card covers and gallery thumbnails
 * - preview   → gallery main view
 * - original  → best quality, used for zoom/download
 * Animated formats (GIF/SVG/APNG) are classified so the gallery can play
 * them directly.
 */
export function mapExerciseMediaAssets(
  media:
    | Array<
        | {
            role: number
            order?: number
            isPrimary?: boolean
            asset?: {
              id?: string
              contentType?: string
              originalFileName?: string
              variants?:
                | Array<{
                    url?: string | null
                    contentType?: string
                    id?: string
                    variantName?: string
                  }>
                  | null
            }
          }
        | undefined
        | null
      >
    | undefined
    | null,
): ExerciseAsset[] {
  const result: ExerciseAsset[] = []
  const seen = new Set<string>()

  for (const entry of media ?? []) {
    const asset = entry?.asset
    if (!asset) continue

    const buckets: Record<'thumb' | 'preview' | 'original', { url: string; contentType?: string } | null> =
      { thumb: null, preview: null, original: null }
    let assetId: string | undefined

    for (const innerVariant of asset.variants ?? []) {
      const variant = innerVariant as
        | { url?: string | null; contentType?: string; id?: string; variantName?: string }
        | null
      if (!variant) continue

      const url = variant.url?.trim()
      if (!url) continue

      if (!assetId) assetId = variant.id ?? asset.id

      const bucket = variantBucket(variant.variantName ?? '')
      buckets[bucket] ??= { url, contentType: variant.contentType }

      // Any left-over variant without a recognized name still becomes the
      // best available fallback for the buckets below it in quality order.
      if (bucket === 'preview' && !buckets.original) buckets.original = { url, contentType: variant.contentType }
      if (bucket === 'thumb' && !buckets.preview) buckets.preview = { url, contentType: variant.contentType }
    }

    const best = buckets.preview ?? buckets.original ?? buckets.thumb
    if (!best) continue

    const kind = classifyAsset(best.url, best.contentType)
    if (kind === 'other') continue

    const key = `${asset.id ?? best.url}:${buckets.thumb?.url ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)

    result.push({
      id: assetId,
      url: best.url,
      name:
        asset.originalFileName ||
        best.url.split('/').pop() ||
        (entry.role === 1 ? 'حرکت اصلی' : 'رسانه حرکت'),
      contentType: best.contentType ?? asset.contentType,
      kind,
      thumbUrl: buckets.thumb?.url ?? best.url,
      previewUrl: buckets.preview?.url ?? best.url,
      originalUrl: buckets.original?.url ?? best.url,
    })
  }

  return result
}

/**
 * Collects assets from common DTO structures.
 *
 * Adjust the property names in `assetKeys` and `urlKeys` if your API
 * uses a different contract. The function deliberately does not treat
 * arbitrary strings such as descriptions as asset URLs.
 */
export function mapExerciseAssets(dto: unknown): ExerciseAsset[] {
  if (!isRecord(dto)) return []

  const assetKeys = [
    'assets',
    'media',
    'images',
    'videos',
    'attachments',
    'files',
    'gallery',
  ]

  const urlKeys = [
    'url',
    'uri',
    'src',
    'downloadUrl',
    'fileUrl',
    'publicUrl',
    'assetUrl',
  ]

  const result: ExerciseAsset[] = []
  const seen = new Set<string>()

  function add(value: unknown, fallbackName?: string) {
    if (typeof value === 'string') {
      const url = value.trim()
      if (!url) return

      const kind = classifyAsset(url)
      if (kind === 'other') return

      const key = url
      if (seen.has(key)) return
      seen.add(key)

      result.push({
        url,
        name: fallbackName || url.split('/').pop() || 'Exercise media',
        kind,
      })
      return
    }

    if (!isRecord(value)) return

    const url = getString(value, urlKeys)
    if (!url) return

    const contentType = getString(value, [
      'contentType',
      'mimeType',
      'mediaType',
      'type',
    ])

    const kind = classifyAsset(url, contentType)
    const id = getString(value, ['id', 'assetId', 'fileId'])
    const name =
      getString(value, ['name', 'fileName', 'title', 'alt']) ??
      fallbackName ??
      url.split('/').pop() ??
      'Exercise media'

    const key = id ? `id:${id}` : url
    if (seen.has(key)) return
    seen.add(key)

    result.push({ id, url, name, contentType, kind })
  }

  // Collect known asset arrays.
  for (const key of assetKeys) {
    const value = dto[key]

    if (Array.isArray(value)) {
      value.forEach((asset, index) => add(asset, `${key} ${index + 1}`))
    } else if (value != null) {
      add(value, key)
    }
  }

  // Also map common singular media properties.
  for (const key of [
    'imageUrl',
    'coverUrl',
    'thumbnailUrl',
    'gifUrl',
    'videoUrl',
    'animationUrl',
    'mediaUrl',
  ]) {
    add(dto[key], key)
  }

  return result
}
