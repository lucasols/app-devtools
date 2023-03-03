import { dequal } from 'dequal'
import { produce } from 'immer'
import {
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  JSXElement,
  untrack,
} from 'solid-js'

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

export type SignalRef<T> = {
  value: T
  produce(recipe: (draft: T) => T | undefined): void
  peek(): T
  set: (newValue: T) => void
}

export function createSignalRef<T>(initialValue: T): SignalRef<T> {
  const [value, setValue] = createSignal(initialValue)

  return {
    get value() {
      return value()
    },
    set value(newValue) {
      setValue(() => newValue)
    },
    set(newValue) {
      setValue(() => newValue)
    },
    produce(recipe) {
      setValue((val) => produce(val, recipe))
    },
    peek() {
      return untrack(value)
    },
  }
}

export type MemoRef<T> = {
  value: T
}

export function createMemoRef<T>(fn: (prev: T | undefined) => T): MemoRef<T> {
  const value = createMemo(fn)

  return {
    get value() {
      return value()
    },
  }
}

export function iife(expression: () => JSXElement): JSXElement {
  return expression()
}
