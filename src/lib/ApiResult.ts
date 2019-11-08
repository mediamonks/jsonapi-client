export class ApiEntityResult<T, M> {
  data: T
  meta: M

  constructor(data: T, meta: M) {
    this.data = data
    this.meta = meta
  }

  [Symbol.iterator](): IterableIterator<T> {
    return [this.data][Symbol.iterator]()
  }
}

export class ApiCollectionResult<T, M> {
  data: T[]
  meta: M

  constructor(data: T[], meta: M) {
    this.data = data
    this.meta = meta
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.data[Symbol.iterator]()
  }
}
