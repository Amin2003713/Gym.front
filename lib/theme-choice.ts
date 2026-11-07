/**
 * Tracks an explicit theme click in the running app session.
 *
 * The preferences read is asynchronous, so a response that was requested before a click can
 * resolve after it. Applying that stale theme is what made the toggle visibly flip back. Once the
 * person has chosen a theme, the API response must not overwrite it for the rest of the session.
 */
let localChoice = false

export const markThemeChoice = () => {
  localChoice = true
}

export const hasLocalThemeChoice = () => localChoice
