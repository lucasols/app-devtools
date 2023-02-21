export function tryExpression<T>(
  expression: () => T,
  onError?: (error: unknown) => void,
): T | null {
  try {
    return expression()
  } catch (error) {
    if (onError) {
      onError(error)
    }

    return null
  }
}
