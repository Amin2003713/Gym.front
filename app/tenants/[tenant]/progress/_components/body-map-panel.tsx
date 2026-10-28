'use client'

import BodyMap, { BodyMapLegend } from '@/features/gym/components/body-map'

type Props = {
  body: 'male' | 'female'
  palette?: 'load' | 'recovery'
  load: Record<string, number>
  selected?: string
  onMuscle?: (slug: string) => void
  className?: string
}

export default function BodyMapPanel({ body, palette = 'load', load, selected, onMuscle, className }: Props) {
  return (
    <div className={className}>
      <BodyMap body={body} palette={palette} load={load} selected={selected} onMuscle={onMuscle}/>
      <div className="mt-2 flex justify-center">
        <BodyMapLegend palette={palette}/>
      </div>
    </div>
  )
}
