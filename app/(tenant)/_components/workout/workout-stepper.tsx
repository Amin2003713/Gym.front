'use client'

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, GripVertical } from '@/components/icons'
import { useCallback } from 'react'

import { cn } from '@/lib/utils'

export type StepperItem = {
  id: string
  name: string
  doneSets: number
  totalSets: number
}

type Props = {
  items: StepperItem[]
  activeIndex: number
  onSelect: (index: number) => void
  onReorder: (ids: string[]) => void
}

function SortableStep({
  item,
  index,
  active,
  completed,
  connected,
  onSelect,
}: {
  item: StepperItem
  index: number
  active: boolean
  completed: boolean
  connected: boolean
  onSelect: (index: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex shrink-0 items-center', isDragging && 'z-10 opacity-80')}
    >
      {connected && (
        <span
          aria-hidden
          className={cn(
            'mx-0.5 h-0.5 w-4 rounded-full transition-colors',
            active || completed ? 'bg-primary' : 'bg-border',
          )}
        />
      )}

      <button
        type="button"
        onClick={() => onSelect(index)}
        aria-current={active ? 'step' : undefined}
        className={cn(
          'focus-visible:ring-ring group flex max-w-44 min-w-28 flex-col gap-1 rounded-xl border px-3 py-2 text-start transition-[background-color,border-color,box-shadow] duration-150 focus-visible:ring-[3px] focus-visible:ring-offset-2',
          active
            ? 'border-primary bg-primary/10 shadow-sm'
            : completed
              ? 'border-emerald-500/40 bg-emerald-500/10 dark:border-emerald-400/30'
              : 'bg-background hover:border-primary/40 hover:bg-muted/60',
        )}
      >
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
              active
                ? 'bg-primary text-primary-foreground'
                : completed
                  ? 'bg-emerald-500 text-white dark:bg-emerald-400 dark:text-emerald-950'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {completed ? <Check className="size-3" aria-hidden /> : index + 1}
          </span>
          <span className="truncate text-xs font-bold">{item.name}</span>
        </span>
        <span className="text-muted-foreground truncate text-[10px] tabular-nums">
          {item.totalSets > 0
            ? `${item.doneSets} از ${item.totalSets} ست`
            : `${item.doneSets} ست ثبت‌شده`}
        </span>
      </button>

      <button
        type="button"
        aria-label={`جابه‌جایی ${item.name}`}
        className="text-muted-foreground hover:text-foreground flex w-6 shrink-0 cursor-grab items-center justify-center rounded-e-xl opacity-60 transition-opacity hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" aria-hidden />
      </button>
    </li>
  )
}

/**
 * The workout progress rail: named steps joined by connectors, each showing how many of its sets
 * are logged. Steps are drag-to-reorder for the session (the caller persists the order) and the
 * whole rail is keyboard sortable, so reordering never requires a pointer.
 */
export function WorkoutStepper({ items, activeIndex, onSelect, onReorder }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const from = items.findIndex((item) => item.id === active.id)
      const to = items.findIndex((item) => item.id === over.id)
      if (from === -1 || to === -1) return

      onReorder(arrayMove(items, from, to).map((item) => item.id))
    },
    [items, onReorder],
  )

  if (items.length <= 1) return null

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={horizontalListSortingStrategy}>
        <ol className="flex list-none items-stretch overflow-x-auto pb-1" aria-label="مراحل تمرین">
          {items.map((item, index) => (
            <SortableStep
              key={item.id}
              item={item}
              index={index}
              active={index === activeIndex}
              completed={
                item.totalSets > 0 ? item.doneSets >= item.totalSets : item.doneSets > 0
              }
              connected={index > 0}
              onSelect={onSelect}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}
