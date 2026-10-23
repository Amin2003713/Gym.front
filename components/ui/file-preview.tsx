'use client'

import { FileText, Trash } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileType } from '@/enums/file-types.enum'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface FilePreviewProps {
  url: string
  className?: string
  downloadable?: boolean
  compressedUrl?: string
  alt?: string
  fileName: string
  type: FileType
  disabled?: boolean
  deletable?: boolean
  dialogClassName?: string
  onDelete?: (...args: unknown[]) => void
}

export const FilePreview = ({
  url,
  className,
  compressedUrl,
  downloadable,
  alt = 'فایل پیوست',
  fileName,
  type,
  deletable,
  disabled,
  onDelete,
  dialogClassName,
}: FilePreviewProps) => {
  const isMobile = useIsMobile()
  return (
    <>
      {type !== FileType.Picture ? (
        <>
          {isMobile || <FileText className="size-4 shrink-0 sm:size-5" />}

          {downloadable ? (
            <Link
              title={fileName}
              href={url}
              target="_blank"
              className="line-clamp-2 w-full px-1 text-center text-xs break-all"
            >
              {fileName}
            </Link>
          ) : (
            <p
              title={fileName}
              className="line-clamp-2 w-full px-1 text-center text-xs break-all"
            >
              {fileName}
            </p>
          )}
        </>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Image
              title={fileName}
              width={100}
              height={100}
              alt={`${alt}-compressed`}
              loading="lazy"
              src={compressedUrl ?? url ?? ''}
              className={cn(
                'aspect-square size-full cursor-pointer object-cover',
                className,
              )}
            />
          </DialogTrigger>
          <DialogContent
            aria-describedby={undefined}
            className={cn(
              'flex !h-svh !min-h-svh min-w-full items-center justify-center rounded-none border-none bg-transparent !p-0',
              dialogClassName,
            )}
          >
            <DialogTitle className="sr-only">{alt}</DialogTitle>
            <Image
              src={url}
              alt={`${alt}-original`}
              width={1200}
              height={800}
              quality={80}
              loading="lazy"
              className="size-auto max-h-svh object-contain select-none"
            />
          </DialogContent>
        </Dialog>
      )}

      {deletable && onDelete && (
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
    </>
  )
}
