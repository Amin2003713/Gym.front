'use client'
import { useSortable } from '@dnd-kit/sortable'
import { GripVerticalIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 cursor-grab hover:bg-transparent active:cursor-grabbing"
    >
      <GripVerticalIcon className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}
