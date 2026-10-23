'use client'

import type { LatLngExpression } from 'leaflet'
import { Loader2, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Location } from '@/components/ui/map-picker'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// Dynamically import MapPicker to ensure it's client-side only
const DynamicMapPicker = dynamic(() => import('./map-picker'), {
  ssr: false,
  loading: () => (
    <div
      className="flex flex-col items-center justify-center p-4"
      style={{ height: '250px', width: '100%' }}
    >
      <Loader2 className="stroke-primary animate-spin" />
      <p className="text-muted-foreground mt-4 text-sm">
        در حال بارگذاری نقشه . . .
      </p>
    </div>
  ),
})

interface MapLocationPickerFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: Path<TFieldValues>
  label?: string
  placeholder?: string
  zoom?: number
  defaultCenter?: LatLngExpression
  height?: string
  className?: string
}

export function MapLocationPickerField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'انتخاب موقعیت از روی نقشه',
  zoom,
  defaultCenter,
  height,
  className,
}: MapLocationPickerFieldProps<TFieldValues>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  })

  const selectedLocation: Location | undefined = field.value

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem className={cn('flex flex-col', className)}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent"
                  aria-label={label || 'Select location'}
                >
                  {selectedLocation ? (
                    selectedLocation.address ? (
                      <span
                        title={selectedLocation.address}
                        className="truncate"
                      >
                        {selectedLocation.address}
                      </span>
                    ) : (
                      <span>{`${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`}</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                  )}
                  <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <DynamicMapPicker
                  initialLocation={selectedLocation}
                  onLocationSelect={(loc) => field.onChange(loc)}
                  zoom={zoom}
                  defaultCenter={defaultCenter}
                  height={height}
                />
              </PopoverContent>
            </Popover>
          </FormControl>
          {error && <FormMessage>{error.message}</FormMessage>}
        </FormItem>
      )}
    />
  )
}
