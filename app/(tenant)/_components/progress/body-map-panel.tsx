'use client'

import BodyMap, { BodyMapLegend } from '@/features/gym/components/body-map'

type Props = {
  body: 'male' | 'female'
  palette?: 'load' | 'recovery'
  load: Record<string, number>
  /** Absolute bands; without them the map scales relative to the hardest-worked muscle. */
  thresholds?: Array<{ at: number; level: number; exclusive?: boolean }>
  selected?: string
  onMuscle?: (slug: string) => void
  className?: string
  size?: 'thumbnail' | 'card' | 'full'
  roles?: Record<string, 'primary' | 'secondary'>
}

export default function BodyMapPanel({
  body,
  palette = 'load',
  load,
  thresholds,
  selected,
  onMuscle,
  className,
  size,
  roles,
}: Props) {
  return (
    <div className={className}>
      <BodyMap
        body={body}
        palette={palette}
        load={load}
        thresholds={thresholds}
        selected={selected}
        onMuscle={onMuscle}
        size={size}
        roles={roles}
      />
      <div className="mt-2 flex justify-center">
        <BodyMapLegend palette={palette} />
      </div>
    </div>
  )
}
