'use client'

import { CloudUpload, FileTextIcon, X, XIcon } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'
import {
  type Control,
  type FieldPath,
  type FieldValues,
  type UseFieldArrayRemove,
} from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from '@/components/ui/file-upload'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { FileType } from '@/enums/file-types.enum'
import { Media } from '@/types/media.interface'
import { formatBytes } from '@/utils/format-bytes'

export interface FileUploadFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>
  name: TName
  label?: string
  description?: string
  placeholder?: string
  className?: string
  dropzoneClassName?: string
  mediaUrls?: Media[]
  onRemoveUrls?: UseFieldArrayRemove
}

export function FileUploadFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  placeholder,
  className,
  dropzoneClassName,
  mediaUrls,
  onRemoveUrls,
  ...rest
}: FileUploadFormFieldProps<TFieldValues, TName> &
  React.ComponentProps<typeof FileUpload>) {
  // Ensure value is always an array
  // const fieldValue = React.useMemo(() => {
  //   return Array.isArray(field.value) ? field.value : []
  // }, [field.value])

  // Generate default placeholder text
  const defaultPlaceholder = React.useMemo(() => {
    const fileText = rest.maxFiles === 1 ? 'file' : 'files'
    return `Drag and drop or choose ${fileText} to upload`
  }, [rest.maxFiles])

  const handleRejectFile = (file: File, message: string) => {
    return rest.onFileReject
      ? rest.onFileReject(file, message)
      : toast.error('بارگذاری ناموفق', { description: message })
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, formState: { isSubmitting } }) => {
        const isFieldDisabled = rest.disabled || isSubmitting
        return (
          <FormItem className={className}>
            {label && (
              <FormLabel>
                {label}
                {rest.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
            )}
            <FormControl>
              <FileUpload
                value={field.value}
                onValueChange={(files: File[]) => field.onChange(files)}
                disabled={isFieldDisabled}
                onFileReject={handleRejectFile}
                {...rest}
              >
                <FileUploadDropzone
                  className={dropzoneClassName}
                  aria-label={label || 'File upload area'}
                >
                  <div className="text-muted-foreground flex flex-row flex-wrap items-center justify-center gap-1 text-center text-sm">
                    <CloudUpload className="size-4" aria-hidden="true" />
                    <span>{placeholder || defaultPlaceholder}</span>
                    {/*{!isFieldDisabled && (*/}
                    <>
                      <span>or</span>
                      <FileUploadTrigger asChild disabled={isFieldDisabled}>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          type="button"
                          disabled={isFieldDisabled}
                        >
                          browse
                        </Button>
                      </FileUploadTrigger>
                    </>
                    {/*)}*/}
                  </div>
                </FileUploadDropzone>

                {field.value?.length > 0 && (
                  <FileUploadList>
                    {field.value.map((file: File, index: number) => (
                      <FileUploadItem
                        key={`${file.name}-${index}`}
                        value={file}
                      >
                        <FileUploadItemPreview />
                        <FileUploadItemMetadata />
                        {!isFieldDisabled && (
                          <FileUploadItemDelete asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              type="button"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="size-4" aria-hidden="true" />
                              <span className="sr-only">
                                Delete {file.name}
                              </span>
                            </Button>
                          </FileUploadItemDelete>
                        )}
                      </FileUploadItem>
                    ))}
                  </FileUploadList>
                )}
              </FileUpload>
            </FormControl>
            {mediaUrls?.map((media, index) => (
              <div
                key={`${index}`}
                className="relative flex gap-2.5 rounded-md border p-3"
              >
                {media.type === FileType.Picture ? (
                  <Image
                    src={media.url}
                    alt={`${media.fileName}-${index}`}
                    height={1000}
                    width={1000}
                    className="size-10"
                  />
                ) : (
                  <FileTextIcon className="size-10" />
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span>{`${media.fileName}${media.extension}`}</span>
                  <span lang="en" className="text-muted-foreground text-xs">
                    {formatBytes(Number(media.fileSize ?? 0))}
                  </span>
                </div>
                <Button
                  onClick={() => onRemoveUrls?.(index)}
                  size="icon"
                  variant="ghost"
                  type="button"
                >
                  <XIcon className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
