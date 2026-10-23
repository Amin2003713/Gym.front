import React from 'react'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface DisabledTextareaProps {
  wrapperClassName?: string
  label: string
  value: string
  textAreaClassName?: string
}

const DisabledTextarea = ({
  wrapperClassName,
  textAreaClassName,
  value,
  label,
}: DisabledTextareaProps) => {
  return (
    <div className={cn('w-full space-y-2', wrapperClassName)}>
      <Label className="opacity-50">{label}</Label>
      <Textarea
        className={cn('max-h-20 w-full overflow-y-auto', textAreaClassName)}
        rows={1}
        value={value}
        disabled
      />
    </div>
  )
}

export default DisabledTextarea
