// eslint-disable-next-line @typescript-eslint/naming-convention
export type anyObj<T = any> = {
  [key: string]: T
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export type anyFunction = {
  (...params: any): any
}

export type Serializable =
  | boolean
  | number
  | string
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable }

export type StrictEqualTypes = string | number | undefined

export type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T
}

export type ObjectPropValue<T extends anyObj> = T[keyof T]

export type MutuallyAssignable<T extends U, U extends V, V = T> = void

export type Modify<T, R> = Omit<T, keyof R> & R

export type StrictPropertyCheck<
  T,
  TExpected,
  TError = 'Type does not satisfies the expected shape',
> = T extends TExpected
  ? Exclude<keyof T, keyof TExpected> extends never
    ? T
    : TError
  : TExpected
