export class EntityResult<T, M> {
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

export class CollectionResult<T, M> {
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
