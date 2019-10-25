export class ApiSortRule<T extends string> {
  readonly name: T
  readonly ascending: boolean
  constructor(name: T, ascending: boolean) {
    this.name = name
    this.ascending = ascending
  }

  toString(): string {
    return this.ascending ? this.name : `-${this.name}`
  }
}

export const sort = <T extends string>(name: T, ascending: boolean): ApiSortRule<T> =>
  new ApiSortRule(name, ascending)

export const ascend = <T extends string>(name: T): ApiSortRule<T> => sort(name, true)

export const descend = <T extends string>(name: T): ApiSortRule<T> => sort(name, false)
