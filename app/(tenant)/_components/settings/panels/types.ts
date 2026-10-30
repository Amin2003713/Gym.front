import type { MemberPreferences } from '@/app/(tenant)/_model/preferences'

/** Every settings panel edits the shared draft; only the Save button writes it back. */
export type PanelProps = {
  draft: MemberPreferences
  update: (patch: Partial<MemberPreferences>) => void
  replace: (next: MemberPreferences) => void
}
