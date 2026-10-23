import React from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface DisabledInputProps {
  className?: string
  label: string
  value: string
}

const DisabledInput = ({ className, label, value }: DisabledInputProps) => {
  return (
    <div className={cn('w-full space-y-2', className)}>
      <Label className="opacity-50">{label}</Label>
      <Input disabled className="w-full" value={value} />
    </div>
  )
}

export default DisabledInput
