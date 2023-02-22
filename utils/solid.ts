import { dequal } from 'dequal'
import { createEffect, createMemo, createRoot, createSignal } from 'solid-js'

export function subscribe(callback: () => any) {
  let disposer: (() => void) | null = null

  createRoot((dispose) => {
    createEffect(() => {
      disposer = dispose
      callback()
    })
  })

  return disposer!
}

export type ReconcileItems<T> = T[]

export function reconcile<T>(
  original: readonly T[] | undefined | null,
  newItems: ReconcileItems<T>,
  key: keyof T,
): T[] {
  if (!original) {
    return newItems
  }

  const final: T[] = []

  const originalMap = new Map<any, T>(original.map((item) => [item[key], item]))

  for (const item of newItems) {
    const currentValue = originalMap.get(item[key])

    if (!currentValue) {
      final.push(item)
    } else if (dequal(currentValue, item)) {
      final.push(currentValue)
    } else {
      final.push(item)
    }
  }

  return final
}

export function createReconciledArray<T>(
  array: T[] | (() => T[]),
  key: keyof T,
) {
  return createMemo<T[]>((prev) => {
    return reconcile(prev, typeof array === 'function' ? array() : array, key)
  })
}

export function createElemRef<E extends HTMLElement>() {
  const ref = undefined as E | undefined

  return ref
}

export function createSignalRef<T>(initialValue: T) {
  const [value, setValue] = createSignal(initialValue)

  return {
    get value() {
      return value()
    },
    set value(newValue) {
      setValue(() => newValue)
    },
    set(newValue: T) {
      setValue(() => newValue)
    },
  }
}
