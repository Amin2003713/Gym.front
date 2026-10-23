interface FormDataOptions {
  form?: FormData
  transformer?: <V>(value: V, key: string) => V | string
  skipNullish?: boolean
  useDotNotation?: boolean
}

/**
 * Converts an object to FormData, handling nested objects, arrays, and files.
 * Fully type-safe with generics.
 * Inspired by ghinda's gist: https://gist.github.com/ghinda/8442a57f22099bdb2e34
 *
 * @param obj
 * @param options - Customization options.
 * @returns FormData ready for API submission.
 */
export function objectToFormData<T extends Record<string, unknown>>(
  obj: T,
  options: FormDataOptions = {},
): FormData {
  const {
    form = new FormData(),
    transformer = (v) => {
      if (v === null) return ''
      return v
    },
    skipNullish = true,
    useDotNotation = false,
  } = options

  const appendRecursive = (
    value: unknown,
    key: string,
    namespace?: string,
  ): void => {
    // Build key: bracket for arrays, dot/bracket for objects
    const buildKey = (parent: string, child: string, isArrayItem: boolean) => {
      if (!parent) return child
      if (isArrayItem) return `${parent}[${child}]`
      return useDotNotation ? `${parent}.${child}` : `${parent}[${child}]`
    }

    // Skip nullish values if enabled
    if (skipNullish && (value === null || value === undefined)) {
      return
    }

    const transformed = transformer(value, key)

    if (Array.isArray(transformed)) {
      transformed.forEach((item, index) => {
        const arrayKey = buildKey(namespace || key, String(index), true)
        if (item instanceof File || item instanceof Blob) {
          form.append(
            arrayKey,
            item,
            item instanceof File ? item.name : undefined,
          )
        } else if (
          item &&
          typeof item === 'object' &&
          !(item instanceof Date)
        ) {
          appendRecursive(
            item,
            String(index),
            namespace ? `${namespace}[${key}]` : key,
          )
        } else {
          form.append(arrayKey, String(item))
        }
      })
    } else if (
      transformed &&
      typeof transformed === 'object' &&
      !(transformed instanceof File) &&
      !(transformed instanceof Blob) &&
      !(transformed instanceof Date)
    ) {
      // Nested object
      Object.entries(transformed).forEach(([prop, val]) => {
        appendRecursive(val, prop, namespace ? `${namespace}[${key}]` : key)
      })
    } else {
      // Primitive, File, Blob, Date
      const fullKey = namespace ? buildKey(namespace, key, false) : key
      if (transformed instanceof File || transformed instanceof Blob) {
        form.append(
          fullKey,
          transformed,
          transformed instanceof File ? transformed.name : undefined,
        )
      } else {
        form.append(fullKey, String(transformed))
      }
    }
  }

  Object.entries(obj).forEach(([key, value]) => {
    appendRecursive(value, key)
  })

  return form
}
