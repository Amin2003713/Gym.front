import type { SiteFaq } from '@/features/platform/types'

/** Native details/summary: keyboard accessible, no client JavaScript, and indexable. */
export function FaqList({ faqs }: { faqs: SiteFaq[] }) {
  const active = faqs.filter((faq) => faq.isActive)

  if (active.length === 0) return null

  return (
    <div className="border-border divide-border divide-y rounded-xl border">
      {active
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((faq) => (
          <details key={faq.id} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold [&::-webkit-details-marker]:hidden">
              <span>{faq.question}</span>
              <span
                aria-hidden="true"
                className="text-muted-foreground shrink-0 text-lg leading-none transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="text-muted-foreground mt-3 max-w-3xl text-sm leading-7">{faq.answer}</p>
          </details>
        ))}
    </div>
  )
}
