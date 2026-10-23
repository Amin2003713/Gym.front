import { Loader2 } from 'lucide-react'
import React, { Dispatch, SetStateAction } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'

interface AreYouSureProps<TFunc> {
  open?: boolean
  onOpenChange?: Dispatch<SetStateAction<boolean>>
  action: () => TFunc
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  trigger?: React.ReactNode
}

function AreYouSure<TFunc>({
  action,
  title,
  description,
  children,
  confirmLabel = 'تایید',
  cancelLabel = 'انصراف',
  trigger,
  open,
  loading,
  onOpenChange,
}: AreYouSureProps<TFunc>) {
  const handleClickAction = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault()
    action()
  }

  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {!!description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          {!!children && <div>{children}</div>}
          <DrawerFooter className="pt-2">
            <DrawerClose disabled={loading} asChild>
              <Button variant="outline">{cancelLabel}</Button>
            </DrawerClose>

            <Button disabled={loading} onClick={handleClickAction}>
              {confirmLabel}
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {!!description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {!!children && <div>{children}</div>}
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleClickAction}
            disabled={loading}
            className="flex-1"
          >
            {confirmLabel}
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </AlertDialogAction>
          <AlertDialogCancel disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default AreYouSure
