type TimerRef = {
  start: () => void
  pause: () => void
  resume: () => void
  restart: (expiryTimestamp: Date) => void
}

type TimerSize = 'xs' | 'sm' | 'md' | 'lg'

type TimerVariant =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'success'
  | 'ghost'
  | 'accent'
  | 'info'
  | 'warning'
  | 'error'
  | 'gradient'
