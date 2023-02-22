import { anyObj } from '@utils/typings'

/**
 * Utility for conditionally joining classNames together
 */
export function cx(...args: (string | false | undefined | null | anyObj)[]) {
  const classNames = []

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (!arg) continue

    const argType = typeof arg

    if (argType === 'string' || argType === 'number') {
      classNames.push(arg)
    } else if (argType === 'object') {
      for (let i2 = 0, keys = Object.keys(arg); i2 < keys.length; i2++) {
        if ((arg as anyObj<boolean>)[keys[i2]!]) {
          classNames.push(keys[i2])
        }
      }
    }
  }

  return classNames.join(' ')
}
