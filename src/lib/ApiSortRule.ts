export const sort = <T extends string>(name: T, ascending: boolean): string =>
  ascending ? name : `-${name}`

export const ascend = <T extends string>(name: T): string => sort(name, true)

export const descend = <T extends string>(name: T): string => sort(name, false)
