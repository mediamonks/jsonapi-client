export type Transform<I, O = I> = (value: I, ...rest: Array<unknown>) => O
export type Effect = Transform<void>
export type Affect<T> = Transform<T, void>
export type Fabricate<T> = Transform<void, T>

export type ValuesOf<T> = T[keyof T]

export type ExtendsOrNever<T, X> = T extends X ? T : never

export type NonEmptyArray<T> = Array<T> & { 0: T }

export type WithoutNever<T> = Pick<
  T,
  ValuesOf<
    {
      [K in keyof T]: T extends never ? never : K
    }
  >
>
