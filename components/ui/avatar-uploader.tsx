'use client'

import { LoaderCircle, Trash2, UploadCloud, UserIcon } from '@/components/icons'
import { useId, useRef, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

import { mediaApi } from '@/app/(tenant)/_api/media-api'

interface AvatarUploaderProps {
  value: string
  onChange: (url: string) => void
  label?: string
  disabled?: boolean
}

const MAX_BYTES = 4 * 1024 * 1024

/**
 * Uploads a profile picture straight through the tenant media library
 * (POST media/uploads) and stores the returned download URL.
 */
export default function AvatarUploader({
  value,
  onChange,
  label = 'تصویر پروفایل',
  disabled = false,
}: AvatarUploaderProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const onPick = async (file: File | undefined) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('فقط فایل تصویری مجاز است.')
      return
    }

    if (file.size > MAX_BYTES) {
      toast.error('حجم تصویر نباید بیش از ۴ مگابایت باشد.')
      return
    }

    setUploading(true)

    try {
      const { url } = await mediaApi.uploadImage(file)
      onChange(url)
      toast.success('تصویر پروفایل بارگذاری شد')
    } catch (error) {
      toast.error('بارگذاری تصویر ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className="border-primary/20 size-16 rounded-2xl border">
        {value ? <AvatarImage src={value} alt={label} /> : null}
        <AvatarFallback className="bg-muted rounded-2xl">
          <UserIcon className="text-muted-foreground size-7" />
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <span className="text-sm">{label}</span>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled || uploading}
            onChange={(event) => void onPick(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <UploadCloud className="size-4" />
            )}
            {uploading ? 'در حال بارگذاری…' : 'انتخاب تصویر'}
          </Button>

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || uploading}
              onClick={() => onChange('')}
            >
              <Trash2 className="size-4" />
              حذف
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
