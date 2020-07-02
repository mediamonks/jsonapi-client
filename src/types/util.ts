export type Transform<I, O = I> = (value: I, ...rest: Array<unknown>) => O
export type AsyncTransform<I, O = I> = (value: I, ...rest: Array<unknown>) => Promise<O>
export type Effect = Transform<void>
export type Affect<T> = Transform<T, void>
export type Fabricate<T> = Transform<void, T>

export type Nullable<T> = T | null

export type ValuesOf<T> = T[keyof T]

export type ExtendsOrNever<T, X> = T extends X ? T : never

export type NonEmptyReadonlyArray<T> = ReadonlyArray<T> & { 0: T }

export type WithoutNever<T> = Pick<
  T,
  ValuesOf<
    {
      [K in keyof T]: T[K] extends never ? never : K
    }
  >
>

export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never }

export type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U
