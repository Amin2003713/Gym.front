'use client'

import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react'
import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type ComboboxSize = 'xs' | 'sm' | 'md' | 'lg'

interface ComboboxProps<TOptions extends { label?: string; title?: string }> {
  multiSelect?: boolean
  freeSolo?: boolean
  placeholder?: string
  emptyMessage?: string
  createMessage?: string
  initialItems?: TOptions[]
  initialSelected?: string | string[]
  onChange?: (value: string | string[]) => void
  className?: string
  disabled?: boolean
  loading?: boolean
  size?: ComboboxSize
  maxDisplayedItems?: number
  maxHeight?: number | string
  options?: TOptions[] | null
  getOptionLabel?: (option: TOptions) => string
  createOption?: (label: string) => TOptions
}

export function Combobox<TOptions extends { label?: string; title?: string }>({
  multiSelect = false,
  freeSolo = false,
  placeholder = 'Select item(s)...',
  emptyMessage = 'No item found.',
  createMessage = 'Create',
  initialItems = [],
  initialSelected = multiSelect ? [] : '',
  onChange,
  className,
  disabled = false,
  loading = false,
  size = 'md',
  maxDisplayedItems = 5,
  maxHeight = 300,
  options = null,
  getOptionLabel,
  createOption,
}: ComboboxProps<TOptions>) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [items, setItems] = React.useState<TOptions[]>(options ?? initialItems)

  const [singleValue, setSingleValue] = React.useState<string>(
    typeof initialSelected === 'string' ? initialSelected : '',
  )

  const [multiValues, setMultiValues] = React.useState<string[]>(
    Array.isArray(initialSelected) ? initialSelected : [],
  )

  const getDisplayText = (item: TOptions | string): string => {
    if (typeof item === 'string') return item
    return getOptionLabel
      ? getOptionLabel(item)
      : item.label || item.title || String(item)
  }

  const filteredItems = items.filter((item) =>
    getDisplayText(item).toLowerCase().includes(inputValue.toLowerCase()),
  )

  const showCreateOption =
    freeSolo &&
    inputValue &&
    !items.some(
      (item) => getDisplayText(item).toLowerCase() === inputValue.toLowerCase(),
    )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!open) return
    setInputValue(e.target.value)
  }

  const handleSelect = (value: string) => {
    if (!multiSelect) {
      setSingleValue(value)
      onChange?.(value)
      setOpen(false)
    } else {
      const newSelected = multiValues.includes(value)
        ? multiValues.filter((v) => v !== value)
        : [...multiValues, value]

      setMultiValues(newSelected)
      onChange?.(newSelected)
    }

    setInputValue('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const removeItem = (item: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!multiSelect) return

    const newSelected = multiValues.filter((i) => i !== item)
    setMultiValues(newSelected)
    onChange?.(newSelected)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const createItem = () => {
    if (!freeSolo) return
    const trimmed = inputValue.trim()
    if (!trimmed) return

    const newItem = createOption
      ? createOption(trimmed)
      : (trimmed as unknown as TOptions)

    setItems((prev) => [...prev, newItem])
    const label = getDisplayText(newItem)

    if (!multiSelect) {
      setSingleValue(label)
      onChange?.(label)
      setOpen(false)
    } else {
      const newSelected = [...multiValues, label]
      setMultiValues(newSelected)
      onChange?.(newSelected)
    }

    setInputValue('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      multiSelect &&
      e.key === 'Backspace' &&
      !inputValue &&
      multiValues.length > 0
    ) {
      const newSelected = [...multiValues]
      newSelected.pop()
      setMultiValues(newSelected)
      onChange?.(newSelected)
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return {
          container: 'min-h-8 px-2 py-1 text-xs',
          badge: 'px-1.5 py-0 text-xs',
          badgeIcon: 'h-2.5 w-2.5',
          icon: 'h-3.5 w-3.5',
          input: 'text-xs',
        }
      case 'sm':
        return {
          container: 'min-h-9 px-2.5 py-1.5 text-sm',
          badge: 'px-1.5 py-0 text-xs',
          badgeIcon: 'h-2.5 w-2.5',
          icon: 'h-3.5 w-3.5',
          input: 'text-sm',
        }
      case 'lg':
        return {
          container: 'min-h-12 px-4 py-3 text-base',
          badge: 'px-2.5 py-0.5 text-sm',
          badgeIcon: 'h-3.5 w-3.5',
          icon: 'h-5 w-5',
          input: 'text-base',
        }
      case 'md':
      default:
        return {
          container: 'min-h-10 px-3 py-2 text-sm',
          badge: 'px-2 py-0.5 text-xs',
          badgeIcon: 'h-3 w-3',
          icon: 'h-4 w-4',
          input: 'text-sm',
        }
    }
  }

  const sizeStyles = getSizeStyles()

  return (
    <Popover
      modal
      open={open}
      onOpenChange={disabled || loading ? undefined : setOpen}
    >
      <PopoverTrigger asChild>
        <div
          className={cn(
            'border-input bg-background ring-offset-background focus-within:ring-ring flex flex-wrap items-center rounded-md border focus-within:ring-2 focus-within:ring-offset-2',
            sizeStyles.container,
            (disabled || loading) && 'cursor-not-allowed opacity-50',
            className,
          )}
          onClick={() => {
            if (disabled || loading) return
            inputRef.current?.focus()
            setOpen(true)
          }}
        >
          {!multiSelect ? (
            singleValue ? (
              <span className="mr-1 truncate">{singleValue}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )
          ) : (
            <>
              {multiValues.length > 0 ? (
                multiValues.map((val) => (
                  <Badge
                    key={val}
                    className={cn(
                      'my-0.5 me-1 max-w-18 gap-1 overflow-hidden',
                      sizeStyles.badge,
                    )}
                    variant="secondary"
                  >
                    {val}
                    <button onClick={(e) => removeItem(val, e)}>
                      <span className="text-muted-foreground hover:text-foreground">
                        ×
                      </span>
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </>
          )}

          <input
            ref={inputRef}
            className={cn(
              'placeholder:text-muted-foreground flex-1 bg-transparent outline-none disabled:cursor-not-allowed',
              sizeStyles.input,
              !multiSelect && singleValue && 'w-[0] p-0',
              multiSelect && multiValues.length > 0 && 'w-20 min-w-[80px]',
            )}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
          />

          {loading ? (
            <Loader2 className={cn('ms-auto animate-spin', sizeStyles.icon)} />
          ) : (
            <ChevronsUpDown
              className={cn('ms-auto opacity-50', sizeStyles.icon)}
            />
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search..."
            value={inputValue}
            onChangeCapture={handleInputChange}
            className={cn('h-9', sizeStyles.input)}
            disabled={loading}
          />
          <CommandList
            style={{
              maxHeight:
                typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {showCreateOption || emptyMessage}
                  {showCreateOption && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={createItem}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <span className="truncate">
                        {createMessage} &quot;{inputValue}&quot;
                      </span>
                    </Button>
                  )}
                </CommandEmpty>

                <CommandGroup>
                  {filteredItems.map((item, index) => {
                    const label = getDisplayText(item)
                    return (
                      <CommandItem
                        key={index}
                        value={label}
                        onSelect={() => handleSelect(label)}
                        className="flex items-center"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            !multiSelect
                              ? singleValue === label
                                ? 'opacity-100'
                                : 'opacity-0'
                              : multiValues.includes(label)
                                ? 'opacity-100'
                                : 'opacity-0',
                          )}
                        />
                        <span className="truncate">{label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
