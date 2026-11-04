'use client'

import { useFigureGender } from '@/hooks/use-figure-gender'
import BodyMap, { BodyMapLegend } from '@/features/gym/components/body-map'

type Props = {
  /** Omit to draw the signed-in member; staff panels pass the member's own figure. */
  body?: 'male' | 'female'
  palette?: 'load' | 'recovery'
  load: Record<string, number>
  /** Absolute bands; without them the map scales relative to the hardest-worked muscle. */
  thresholds?: Array<{ at: number; level: number; exclusive?: boolean }>
  selected?: string
  onMuscle?: (slug: string) => void
  className?: string
  size?: 'thumbnail' | 'card' | 'full'
  roles?: Record<string, 'primary' | 'secondary'>
  /** Compact surfaces (cards, rows) hide the colour key. */
  legend?: boolean
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
  legend = true,
}: Props) {
  const userGender = useFigureGender()

  return (
    <div className={className}>
      <BodyMap
        body={body ?? userGender}
        palette={palette}
        load={load}
        thresholds={thresholds}
        selected={selected}
        onMuscle={onMuscle}
        size={size}
        roles={roles}
      />
      {legend && (
        <div className="mt-2 flex justify-center">
          <BodyMapLegend palette={palette} />
        </div>
      )}
    </div>
  )
}
