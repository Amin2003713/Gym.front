'use client'

import { AlertTriangle } from '@/components/icons'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { t } from '@/lib/i18n'

export type ConfirmOptions = {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  /** Red confirm button + warning icon, for destructive actions. */
  destructive?: boolean
}

export type PromptField = {
  name: string
  label: string
  type?: 'text' | 'number'
  defaultValue?: string
  min?: string
  max?: string
  step?: string
  inputMode?: 'text' | 'numeric' | 'decimal'
}

export type PromptOptions = {
  title: string
  description?: string
  fields: PromptField[]
  confirmText?: string
  cancelText?: string
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>
type PromptFn = (options: PromptOptions) => Promise<Record<string, string> | null>

type ConfirmState = ConfirmOptions
type PromptState = PromptOptions

const ConfirmContext = createContext<{ confirm: ConfirmFn; prompt: PromptFn } | null>(null)

/**
 * The one dialog surface of the app. Native `confirm`/`prompt` are blocking, unstyleable and
 * untranslatable; this wraps Radix AlertDialog/Dialog in promise-based helpers so a caller reads
 * like the native API it replaces:
 *
 *   const ok = await confirm({ title: '…', destructive: true })
 *   const values = await prompt({ title: '…', fields: [{ name: 'reps', label: '…' }] })
 *
 * A second request replaces the open one (resolving the previous one as cancelled) instead of
 * stacking dialogs or leaving an unresolved promise behind.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [promptState, setPromptState] = useState<PromptState | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})

  const pendingConfirm = useRef<((value: boolean) => void) | null>(null)
  const pendingPrompt = useRef<((value: Record<string, string> | null) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        pendingConfirm.current?.(false)
        pendingConfirm.current = resolve
        setConfirmState(options)
      }),
    [],
  )

  const prompt = useCallback<PromptFn>(
    (options) =>
      new Promise<Record<string, string> | null>((resolve) => {
        pendingPrompt.current?.(null)
        pendingPrompt.current = resolve

        const initial: Record<string, string> = {}
        options.fields.forEach((field) => {
          initial[field.name] = field.defaultValue ?? ''
        })

        setValues(initial)
        setPromptState(options)
      }),
    [],
  )

  const finishConfirm = useCallback((value: boolean) => {
    const resolve = pendingConfirm.current
    pendingConfirm.current = null
    setConfirmState(null)
    resolve?.(value)
  }, [])

  const finishPrompt = useCallback((value: Record<string, string> | null) => {
    const resolve = pendingPrompt.current
    pendingPrompt.current = null
    setPromptState(null)
    resolve?.(value ? { ...value } : null)
  }, [])

  const api = useMemo(() => ({ confirm, prompt }), [confirm, prompt])

  const promptInvalid = !!promptState?.fields.some(
    (field) => !values[field.name]?.trim(),
  )

  return (
    <ConfirmContext.Provider value={api}>
      {children}

      <AlertDialog
        open={!!confirmState}
        onOpenChange={(open) => {
          if (!open) finishConfirm(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmState?.destructive && (
                <AlertTriangle className="text-destructive size-5 shrink-0" aria-hidden />
              )}
              {confirmState?.title ?? ''}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmState?.description ?? t('dialog.confirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => finishConfirm(false)}>
              {confirmState?.cancelText ?? t('common.cancel')}
            </AlertDialogCancel>
            <Button
              variant={confirmState?.destructive ? 'destructive' : 'default'}
              onClick={() => finishConfirm(true)}
            >
              {confirmState?.confirmText ?? t('common.confirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!promptState}
        onOpenChange={(open) => {
          if (!open) finishPrompt(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{promptState?.title ?? ''}</DialogTitle>
            {promptState?.description && (
              <DialogDescription>{promptState.description}</DialogDescription>
            )}
          </DialogHeader>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (!promptInvalid) finishPrompt(values)
            }}
          >
            {promptState?.fields.map((field) => (
              <label key={field.name} className="block space-y-1">
                <span className="text-muted-foreground text-xs">{field.label}</span>
                <Input
                  type={field.type === 'number' ? 'number' : 'text'}
                  inputMode={
                    field.inputMode ??
                    (field.type === 'number' ? 'decimal' : undefined)
                  }
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={values[field.name] ?? ''}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => finishPrompt(null)}>
                {promptState?.cancelText ?? t('common.cancel')}
              </Button>
              <Button type="submit" disabled={promptInvalid}>
                {promptState?.confirmText ?? t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)

  if (!context) {
    throw new Error('useConfirm must be used inside <ConfirmProvider>')
  }

  return context
}
