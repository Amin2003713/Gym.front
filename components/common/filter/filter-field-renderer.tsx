'use client'

import React, { RefObject } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { FilterField } from '@/components/types/filter.types'
import { AutoComplete } from '@/components/ui/autoComplete'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SelectBox } from '@/components/ui/select'

import { NumberRangeInput } from './number-range-input'

interface FilterFieldRendererProps {
  field: FilterField
  form: UseFormReturn<Record<string, any>>
  drawerRef: RefObject<HTMLDivElement | null>
}

export function FilterFieldRenderer({
  field,
  form,
  drawerRef,
}: FilterFieldRendererProps) {
  const {
    setValue,
    watch,
    formState: { errors },
    register,
  } = form
  const value = watch(field.key)

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            {...register(field.key)}
            placeholder={field.placeholder}
            className="w-full"
          />
        )

      case 'select':
        const selectField = field as Extract<FilterField, { type: 'select' }>
        return (
          <SelectBox
            placeholder={field.placeholder || 'انتخاب کنید'}
            items={selectField.options}
            value={value || ''}
            onValueChange={(val) => setValue(field.key, val)}
            className="w-full"
          />
        )

      case 'multiSelect':
        const multiSelectField = field as Extract<
          FilterField,
          { type: 'multiSelect' }
        >
        const autoCompleteValue =
          value?.map(({ value, label }: { value: string; label: string }) => ({
            id: value,
            label,
          })) || []
        return (
          <AutoComplete
            popoverContainer={drawerRef}
            multiSelect
            limitTags={2}
            placeholder={field.placeholder}
            options={multiSelectField.options.map((o) => ({
              id: o.value,
              label: o.label,
            }))}
            value={autoCompleteValue}
            onValueChange={(val) =>
              setValue(
                field.key,
                val.map(({ id, label }) => ({ value: id, label })),
              )
            }
          />
        )

      case 'numberRange':
        const numberField = field as Extract<
          FilterField,
          { type: 'numberRange' }
        >
        return (
          <NumberRangeInput
            value={value}
            onChange={(val) => setValue(field.key, val)}
            min={numberField.min}
            max={numberField.max}
            step={numberField.step}
            unit={numberField.unit}
          />
        )

      case 'checkbox':
        const checkboxField = field as Extract<
          FilterField,
          { type: 'checkbox' }
        >
        return (
          <div className="grid grid-cols-2 gap-2">
            {checkboxField.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.key}-${option.value}`}
                  checked={(value || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValue = value || []
                    if (checked) {
                      setValue(field.key, [...currentValue, option.value])
                    } else {
                      setValue(
                        field.key,
                        currentValue.filter((v: string) => v !== option.value),
                      )
                    }
                  }}
                />
                <Label
                  htmlFor={`${field.key}-${option.value}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        )

      case 'radio':
        const radioField = field as Extract<FilterField, { type: 'radio' }>
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={(val) => setValue(field.key, val)}
          >
            {radioField.options.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <RadioGroupItem
                  value={String(option.value)}
                  id={`${field.key}-${option.value}`}
                />
                <Label
                  htmlFor={`${field.key}-${option.value}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="mr-1 text-red-500">*</span>}
      </Label>
      {renderField()}
      {errors[field.key] && (
        <p className="text-sm text-red-500">
          {errors[field.key]?.message as string}
        </p>
      )}
    </div>
  )
}
