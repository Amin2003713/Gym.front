'use client'

import { ChevronUp, Search } from 'lucide-react'
import { useMemo, useState } from 'react'


import { useGetUsers } from '@/app/(tenant)/_api/use-get-users'

export interface MemberPickerSelection {
  id: string
  name: string
}

interface MemberPickerProps {
  /** Shown when the id is not (yet) resolvable to a name. */
  valueLabel?: string | null
  onSelect: (selection: MemberPickerSelection | null) => void
  placeholder?: string
}

/**
 * Multi-select dropdown for members (users of the tenant). Replaces pasting
 * raw GUIDs: the user opens the dropdown, searches a name, checks members.
 */
export default function MemberPicker({
  valueLabel,
  onSelect,
  placeholder = 'افزودن شاگرد…',
}: MemberPickerProps) {
  const { users, isLoading } = useGetUsers()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return users
    return users.filter((u) => (u.label ?? '').toLowerCase().includes(term))
  }, [users, query])

  const toggle = (id: string, name: string) => {
    // Presentational component; parent decides toggle/select semantics.
    onSelect({ id, name })
  }

  const clear = (event: React.MouseEvent) => {
    event.stopPropagation()
    onSelect(null)
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((old) => !old)}
        className="border-input bg-background flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-muted-foreground truncate">
          {valueLabel ?? placeholder}
        </span>
        <ChevronUp className={`size-4 text-muted-foreground transition ${open ? '' : 'rotate-180'}`} />
      </button>

      {open && (
        <div className="bg-card absolute z-50 mt-1 w-full overflow-hidden rounded-lg border shadow-lg">
          <div className="relative border-b p-2">
            <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی نام شاگرد…"
              aria-label="جستجوی شاگرد"
              className="h-9 w-full rounded-lg border pr-9 pl-3 text-sm outline-none"
            />
          </div>
          <div role="listbox" className="max-h-64 overflow-y-auto p-1">
            {isLoading ? (
              <p className="text-muted-foreground py-6 text-center text-sm">در حال دریافت اعضا…</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">عضوی پیدا نشد.</p>
            ) : (
              filtered.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => toggle(user.id, user.label)}
                  className="hover:bg-muted/50 flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-right text-sm"
                >
                  <span className="min-w-0 truncate font-medium">{user.label}</span>
                  <span className="text-muted-foreground shrink-0 text-xs" dir="ltr">
                    {user.phoneNumber ?? user.username ?? ''}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {open && valueLabel ? (
        <span className="sr-only">{valueLabel}</span>
      ) : null}
      {/* Clear affordance for currently-first member is handled by parent list via onSelect(null) */}
      <button
        type="button"
        onClick={clear}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  )
}
