/**
 * Structured data. Rendering it from the same content as the page keeps the markup and the
 * schema in sync, which is the part search engines actually check.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from values we control (CMS fields), not from user markup.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
