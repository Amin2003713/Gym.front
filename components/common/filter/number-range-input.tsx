'use client'

import type React from 'react'
import { useState, useEffect, useCallback } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NumberRangeValue {
  min?: number
  max?: number
}

interface NumberRangeInputProps {
  value?: NumberRangeValue
  onChange: (value?: NumberRangeValue) => void
  min?: number
  max?: number
  step?: number
  unit?: string
}

export function NumberRangeInput({
  value = {},
  onChange,
  min,
  max,
  step = 1,
  unit,
}: NumberRangeInputProps) {
  const [localValue, setLocalValue] = useState<NumberRangeValue>(value)

  useEffect(() => {
    // Only update if the values are actually different
    if (value.min !== localValue.min || value.max !== localValue.max) {
      setLocalValue(value)
    }
  }, [value])

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const minValue = e.target.value ? Number(e.target.value) : undefined
      const newValue = { ...localValue, min: minValue }

      // Clean up undefined keys for onChange
      const cleanedValue = Object.fromEntries(
        Object.entries(newValue).filter(([, value]) => value !== undefined),
      )

      setLocalValue(newValue)
      onChange(Object.keys(cleanedValue).length > 0 ? cleanedValue : undefined)
    },
    [localValue, onChange],
  )

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const maxValue = e.target.value ? Number(e.target.value) : undefined
      const newValue = { ...localValue, max: maxValue }

      // Clean up undefined keys for onChange
      const cleanedValue = Object.fromEntries(
        Object.entries(newValue).filter(([, value]) => value !== undefined),
      )

      setLocalValue(newValue)
      onChange(Object.keys(cleanedValue).length > 0 ? cleanedValue : undefined)
    },
    [localValue, onChange],
  )

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">از</Label>
        <div className="relative">
          <Input
            type="number"
            value={localValue.min || ''}
            onChange={handleMinChange}
            min={min}
            max={max}
            step={step}
            placeholder="حداقل"
          />
          {unit && (
            <span className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2 text-xs">
              {unit}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">تا</Label>
        <div className="relative">
          <Input
            type="number"
            value={localValue.max || ''}
            onChange={handleMaxChange}
            min={min}
            max={max}
            step={step}
            placeholder="حداکثر"
          />
          {unit && (
            <span className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2 text-xs">
              {unit}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
