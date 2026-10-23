'use client'

import { Command as CommandPrimitive } from 'cmdk'
import { CircleX, Loader2 } from 'lucide-react'
import {
  useState,
  useRef,
  useCallback,
  type KeyboardEvent,
  RefObject,
  FC,
  useMemo,
} from 'react'
import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import {
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ---------- types ----------
export type Option = { id: string | null; label: string }
type OnSingleValueChange = (value: Option | null) => void
type OnMultiValueChange = (value: Option[]) => void

interface BaseProps {
  allowCustomValue?: boolean
  className?: string
  disabled?: boolean
  emptyMessage?: string
  isLoading?: boolean
  label?: string
  options: Option[]
  placeholder?: string
  onFocus?: VoidFunction
  ariaInvalid?: boolean
  /**
   * If you're using the AutoComplete component inside a Dialog or another Popover,
   * provide the ref of that Dialog/Popover's content element here.
   * This ensures that the PopoverContent is rendered within the same portal layer,
   * preventing it from being positioned behind the overlay and allowing proper interaction.
   */
  popoverContainer?: RefObject<HTMLDivElement | null>
}

interface MultiSelectProps {
  limitTags?: number
  multiSelect: true
  onValueChange?: OnMultiValueChange
  value?: Option[]
}

interface SingleSelectProps {
  limitTags?: null
  multiSelect?: false
  onValueChange?: OnSingleValueChange
  value?: Option | null
}

export type AutoCompleteProps = BaseProps &
  (MultiSelectProps | SingleSelectProps)

function isMultiSelect(
  props: AutoCompleteProps,
): props is BaseProps & MultiSelectProps {
  return props.multiSelect === true
}

export const AutoComplete: FC<AutoCompleteProps> = (props) => {
  const {
    label,
    className,
    disabled,
    options,
    placeholder,
    isLoading = false,
    emptyMessage = 'بدون نتیجه !',
    allowCustomValue = false,
    limitTags,
    onFocus,
    popoverContainer,
  } = props

  const inputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setOpen] = useState<boolean>(false)
  const [showAllBadges, setShowAllBadges] = useState<boolean>(true)
  const [inputValue, setInputValue] = useState<string>('')

  const selectedValues = useMemo(() => {
    if (isMultiSelect(props)) return props.value ?? []
    return props.value ? [props.value] : []
  }, [props])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current
      if (!input) return

      if (!isOpen) setOpen(true)

      if (event.key === 'Enter' && inputValue !== '') {
        const optionToSelect = options.find((opt) => opt.label === inputValue)

        if (optionToSelect) {
          if (isMultiSelect(props)) {
            if (!selectedValues.some((v) => v.id === optionToSelect.id)) {
              props.onValueChange?.([...selectedValues, optionToSelect])
            }
          } else {
            props.onValueChange?.(optionToSelect)
          }
        } else if (allowCustomValue) {
          const custom = {
            id: null,
            label: inputValue,
          }
          if (isMultiSelect(props)) {
            props.onValueChange?.([...selectedValues, custom])
          } else {
            props.onValueChange?.(custom)
          }
        }
        setInputValue('')
        setOpen(false)
      }

      if (event.key === 'Backspace' && inputValue === '') {
        if (isMultiSelect(props) && !!selectedValues.length) {
          props.onValueChange?.(selectedValues.slice(0, -1))
        }
      }

      if (event.key === 'Escape') {
        input.blur()
        setOpen(false)
      }
    },
    [isOpen, inputValue, options, selectedValues, props, allowCustomValue],
  )

  const handleChangeInputValue = (value: string) => {
    setInputValue(value)
    if (!isOpen && value) setOpen(true)
  }

  const handleBlur = () => {
    setShowAllBadges(false)
    // Delay closing to allow for option selection
    setTimeout(() => setOpen(false), 150)
  }

  const handleOptionSelect = (opt: Option) => {
    if (isMultiSelect(props)) {
      const exists = selectedValues.find((x) => x.id === opt.id)
      const newValues = exists
        ? selectedValues.filter((x) => x.id !== opt.id)
        : [...selectedValues, opt]
      props.onValueChange?.(newValues)
    } else {
      props.onValueChange?.(opt)
      setOpen(false)
    }
    setInputValue('')
  }

  const handleClearValue = (optionToRemove?: Option) => {
    if (isMultiSelect(props)) {
      const newValues = optionToRemove
        ? selectedValues.filter((v) => v.id !== optionToRemove.id)
        : []
      props.onValueChange?.(newValues)
    } else {
      props.onValueChange?.(null)
    }
    setInputValue('')
  }

  const shouldShowPopover =
    isOpen && (!!options.length || !!inputValue || isLoading)

  return (
    <CommandPrimitive onKeyDown={handleKeyDown}>
      {label && (
        <Label
          className={cn(
            'mb-2',
            props.ariaInvalid && 'text-destructive-foreground',
          )}
        >
          {label}
        </Label>
      )}
      <Popover open={shouldShowPopover} onOpenChange={setOpen} modal>
        <PopoverTrigger
          asChild
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div
            aria-invalid={props.ariaInvalid}
            className={cn(
              'aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex flex-wrap items-center rounded-md border',
              className,
              {
                'border-ring ring-ring/50 border-1 shadow-xs ring-[3px] transition-[color,box-shadow]':
                  isOpen,
              },
            )}
            onClick={() => {
              if (!disabled) {
                setOpen(true)
                inputRef.current?.focus()
              }
            }}
          >
            {selectedValues
              .slice(
                -(!showAllBadges && limitTags
                  ? limitTags
                  : selectedValues.length),
              )
              .map((opt) => (
                <Badge
                  key={opt.id}
                  variant="secondary"
                  className="m-0.5 flex cursor-default items-center gap-1 p-1"
                >
                  <span className="max-w-[7rem] truncate">{opt.label}</span>
                  <Separator orientation="vertical" className="!h-4" />
                  <div
                    onClick={() => handleClearValue(opt)}
                    className="cursor-pointer"
                  >
                    <CircleX
                      size={14}
                      className="text-destructive-foreground"
                    />
                  </div>
                </Badge>
              ))}
            {limitTags &&
              !showAllBadges &&
              selectedValues.length > limitTags && (
                <Badge
                  variant="outline"
                  className="m-0.5 cursor-help p-1"
                  onClick={() => setShowAllBadges(true)}
                >
                  {`+${selectedValues.length - limitTags} مورد دیگر`}
                </Badge>
              )}
            <div className="relative grow">
              <CommandInput
                ref={inputRef}
                value={inputValue}
                onValueChange={isLoading ? undefined : handleChangeInputValue}
                onBlur={handleBlur}
                onFocus={() => {
                  setOpen(true)
                  if (onFocus) {
                    onFocus()
                  }
                }}
                placeholder={!selectedValues.length ? placeholder : undefined}
                disabled={disabled}
                className={cn({ 'pl-6': selectedValues.length })}
              />
              {!!selectedValues.length && (
                <CircleX
                  className="text-muted-foreground absolute top-2 left-8 size-5 cursor-pointer"
                  onClick={() => handleClearValue()}
                />
              )}
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent
          container={popoverContainer?.current}
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <CommandList className="max-h-[200px]">
            {isLoading && (
              <div className="p-1">
                <Skeleton className="flex h-8 w-full items-center justify-center">
                  <Loader2 className="text-muted-foreground animate-spin" />
                </Skeleton>
              </div>
            )}
            {!isLoading && !!options.length && (
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.label}
                    onMouseDown={(event) => event.preventDefault()}
                    onSelect={() => handleOptionSelect(opt)}
                    className="flex w-full items-center gap-2"
                  >
                    {isMultiSelect(props) && (
                      <input
                        type="checkbox"
                        checked={selectedValues.some((x) => x.id === opt.id)}
                        readOnly
                        className="accent-primary"
                      />
                    )}
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!isLoading &&
              inputValue &&
              allowCustomValue &&
              !options.some((opt) => opt.label === inputValue) && (
                <CommandItem
                  value={inputValue}
                  onSelect={() =>
                    handleOptionSelect({
                      id: null,
                      label: inputValue,
                    })
                  }
                  className="cursor-pointer"
                >
                  <span className="text-muted-foreground">
                    ایجاد &#34;{inputValue}&#34;
                  </span>
                </CommandItem>
              )}

            {!allowCustomValue && (
              <CommandPrimitive.Empty className="px-2 py-3 text-center text-sm select-none">
                {emptyMessage}
              </CommandPrimitive.Empty>
            )}
          </CommandList>
        </PopoverContent>
      </Popover>
    </CommandPrimitive>
  )
}
