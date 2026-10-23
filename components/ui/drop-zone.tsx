'use client'

import throttle from 'lodash.throttle'
import { CloudUpload, FileText, Trash } from 'lucide-react'
import Image from 'next/image'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form'

import { Card } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { FormField, FormItem, FormLabel } from '@/components/ui/form'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './dialog'

interface DropZoneProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  allowedTypes: string[]
  className?: string
  maxVolume?: number
  mutiSelect?: boolean
  shouldReset: boolean
  disabled: boolean
  setShouldReset: React.Dispatch<React.SetStateAction<boolean>>
  label?: React.ReactNode
}

function DropZone<T extends FieldValues>({
  form,
  name,
  allowedTypes,
  className,
  maxVolume = 5,
  mutiSelect = false,
  shouldReset,
  disabled,
  setShouldReset,
  label,
}: DropZoneProps<T>) {
  const [filesPreview, setFilesPreview] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLButtonElement>(null)

  const triggerThrottle = useMemo(
    () =>
      throttle(
        () => {
          dropZoneRef.current?.setAttribute('data-dragging', 'true')
        },
        500,
        { trailing: false },
      ),

    [],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault()

      triggerThrottle()
    },
    [triggerThrottle],
  )

  const handleOnClick = () => {
    inputRef.current?.click()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (mutiSelect) {
      onChange(e.dataTransfer.files as FileList)
    } else {
      onChange(e.dataTransfer.files[0] as File)
    }
    dropZoneRef.current?.setAttribute('data-dragging', 'false')
  }

  const handleChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mutiSelect) {
      onChange(e.target.files as FileList)
    } else {
      onChange(e.target.files?.[0] as File)
    }
  }

  const onChange = (files: FileList | File) => {
    if (disabled) return

    if (files instanceof File) {
      if (!files) return

      const reader = new FileReader()
      reader.onloadend = () => {
        setFilesPreview([reader.result as string])
        setSelectedFiles([files])
      }

      reader.readAsDataURL(files)
    } else if (files instanceof FileList) {
      for (let i = 0; i < files.length; i++) {
        if (!files || files.length === 0) return

        const currentFile = files.item(i)
        if (!currentFile) continue

        if (currentFile.size === 0 && currentFile.type === '') continue

        const reader = new FileReader()

        reader.onloadend = () => {
          setFilesPreview((prevState) => [
            ...(prevState || []),
            reader.result as string,
          ])

          setSelectedFiles((prevState) => [...(prevState || []), currentFile])
        }

        reader.readAsDataURL(currentFile)
      }
    }
  }

  const handleRemoveFile = (fileIndex: number) => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }

    if (mutiSelect) {
      setFilesPreview((prevState) =>
        prevState?.filter((_, index) => index !== fileIndex),
      )

      setSelectedFiles((prevState) => {
        return prevState?.filter((_, index) => index !== fileIndex)
      })
    } else {
      setFilesPreview([])
      setSelectedFiles([])
    }
  }

  useEffect(() => {
    if (shouldReset) {
      if (inputRef.current) {
        inputRef.current.value = ''
      }

      setFilesPreview([])
      setSelectedFiles([])
    }

    setShouldReset(false)
  }, [shouldReset])

  useEffect(() => {
    form.setValue(name, [...selectedFiles] as PathValue<T, Path<T>>, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }, [selectedFiles])

  const fieldErrors = form.formState.errors[name] as
    | { message?: string }[]
    | undefined

  return (
    <FormItem>
      <FormField
        control={form.control}
        name={name}
        disabled={disabled}
        render={({ fieldState }) => (
          <>
            <FormLabel>{label ? label : 'پیوست فایل'}</FormLabel>

            <button
              disabled={disabled}
              type="button"
              className={cn(
                'border-muted flex cursor-pointer flex-col items-center gap-2 space-y-2 rounded border-2 border-dashed py-3',
                className,
                disabled ||
                  'data-[dragging=true]:border-accent data-[dragging=true]:bg-foreground/5',
              )}
              onDragLeave={(e) => {
                if (
                  !(e.currentTarget as HTMLElement).contains(
                    e.relatedTarget as Node,
                  )
                ) {
                  if (!disabled)
                    dropZoneRef.current?.setAttribute('data-dragging', 'false')
                }
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleOnClick}
              ref={dropZoneRef}
              data-dragging="false"
            >
              <div className="bg-muted flex size-10 items-center justify-center rounded">
                <CloudUpload className="stroke-muted-foreground size-5" />
              </div>

              <p className="text-muted-foreground line-clamp-1 px-2 text-xs xl:text-sm">
                کلیک کنید یا فایل را اینجا بکشید و رها کنید
              </p>

              <p className="text-muted-foreground line-clamp-1 px-2 text-xs xl:text-sm">
                حداکثر حجم فایل: {maxVolume} مگابایت
              </p>

              <p className="text-muted-foreground line-clamp-2 px-2 text-center text-xs xl:text-sm">
                فرمت های مجاز: {allowedTypes.join(' ,')}
              </p>

              <input
                disabled={disabled}
                onChange={handleChangeFile}
                multiple={mutiSelect}
                type="file"
                hidden
                ref={inputRef}
                className="hidden"
                accept={allowedTypes.join(',')}
              />
            </button>

            {!mutiSelect && !!filesPreview.length && !!selectedFiles.length && (
              <div className="mx-auto h-24 w-24">
                <DropZoneFilePreview
                  src={filesPreview[0]}
                  fileName={selectedFiles[0].name}
                  disabled={disabled}
                  fileType={selectedFiles[0].type}
                  onDelete={() => handleRemoveFile(0)}
                />
              </div>
            )}

            {mutiSelect && !!filesPreview.length && !!selectedFiles.length && (
              <div className="flex flex-wrap justify-around gap-2">
                <Carousel
                  opts={{
                    direction: 'rtl',
                  }}
                  className="w-full max-w-[240px] sm:max-w-[100px] xl:max-w-[180px]"
                >
                  <CarouselContent className="space-x-2">
                    {filesPreview.slice(0, 9).map((src, index) => (
                      <CarouselItem
                        className="h-20 max-w-20 shrink-0 sm:max-h-24 sm:max-w-24"
                        key={index + selectedFiles[index].name}
                      >
                        <DropZoneFilePreview
                          src={src}
                          fileName={selectedFiles[index].name}
                          disabled={disabled}
                          fileType={selectedFiles[index].type}
                          onDelete={() => handleRemoveFile(index)}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  <CarouselNext type="button" />
                  <CarouselPrevious type="button" />
                </Carousel>

                <p className="text-destructive-foreground w-full text-sm">
                  {fieldState.error?.message}
                </p>
              </div>
            )}
          </>
        )}
      />

      <div className="space-y-1">
        {Array.isArray(fieldErrors) &&
          fieldErrors.map((err, idx) =>
            err?.message ? (
              <p key={idx} className="text-destructive-foreground text-sm">
                {err.message}
              </p>
            ) : null,
          )}
      </div>
    </FormItem>
  )
}

interface DropZoneFilePreviewProps {
  fileType: string
  fileName?: string
  src?: string
  onDelete: (...args: unknown[]) => void
  disabled: boolean
}

function DropZoneFilePreview({
  fileType,
  fileName,
  src,
  onDelete,
  disabled,
}: DropZoneFilePreviewProps) {
  const isMobile = useIsMobile()

  return (
    <Card
      title={fileName}
      className="relative flex h-full w-full justify-center gap-2 rounded !p-0"
    >
      <Dialog>
        {['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
          fileType,
        ) ? (
          <DialogTrigger asChild>
            <Image
              src={src!}
              alt="user file"
              width={96}
              height={96}
              className="aspect-square h-full cursor-pointer object-cover"
            />
          </DialogTrigger>
        ) : (
          <>
            {isMobile || (
              <FileText className="mx-auto size-4 shrink-0 sm:size-5" />
            )}
            <p className="line-clamp-2 w-full px-1 text-center text-xs break-all md:line-clamp-1">
              {fileName}
            </p>
          </>
        )}
        <DialogContent className="max-w-xs !border-none bg-transparent p-0 sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
          <DialogTitle className="sr-only">selected image</DialogTitle>
          <Image
            src={src!}
            className="!static max-h-[75svh] w-[75vw] object-cover"
            alt="user file"
            fill
          />
        </DialogContent>
      </Dialog>

      {!disabled && (
        <button
          disabled={disabled}
          type="button"
          className="absolute top-1 right-1 z-10 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash className="stroke-destructive size-4" />
        </button>
      )}
    </Card>
  )
}

export default DropZone
