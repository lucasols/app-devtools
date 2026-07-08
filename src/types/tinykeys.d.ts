declare module 'tinykeys' {
  export type KeyBindingPressHandler = (event: KeyboardEvent) => void

  export type KeyBindingMap = Record<string, KeyBindingPressHandler>

  export type KeyBindingOptions = {
    event?: 'keydown' | 'keyup'
    capture?: boolean
    timeout?: number
  }

  export function tinykeys(
    target: Window | HTMLElement,
    keyBindingMap: KeyBindingMap,
    options?: KeyBindingOptions,
  ): () => void

  export default tinykeys
}
