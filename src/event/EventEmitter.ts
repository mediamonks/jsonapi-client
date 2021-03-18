import { ResourceFormatter } from '../formatter'
import { ResourceIdentifier } from '../resource/identifier'
import { NaiveIncludedResource, NaiveResource } from '../types'

type Effect = () => void

type JSONAPIEventType =
  | 'decode'
  | 'decode-resource'
  | 'decode-base-resource'
  | 'decode-resource-identifier'

export abstract class JSONAPIEvent<T extends JSONAPIEventType, U> {
  readonly time: number
  readonly type: T
  readonly value: U

  constructor(type: T, value: U) {
    this.time = Date.now()
    this.type = type
    this.value = value
  }
}

export class DecodeEvent<T extends ResourceFormatter<any, any>> extends JSONAPIEvent<
  'decode',
  NaiveResource<T> | ReadonlyArray<NaiveResource<T>>
> {
  constructor(value: any) {
    super('decode', value)
  }
}

export class DecodeResourceIdentifierEvent<
  T extends ResourceFormatter<any, any>
> extends JSONAPIEvent<'decode-resource-identifier', ResourceIdentifier<T['type']>> {
  constructor(value: any) {
    super('decode-resource-identifier', value)
  }
}

export class DecodeBaseResourceEvent<T extends ResourceFormatter<any, any>> extends JSONAPIEvent<
  'decode-base-resource',
  NaiveIncludedResource<T>
> {
  constructor(value: any) {
    super('decode-base-resource', value)
  }
}

export class DecodeResourceEvent<T extends ResourceFormatter<any, any>> extends JSONAPIEvent<
  'decode-resource',
  NaiveResource<T>
> {
  constructor(value: any) {
    super('decode-resource', value)
  }
}

export type JSONAPIEventSubscription<T extends JSONAPIEvent<any, any>> = {
  type: T['type'] | null
  listener: JSONAPIEventListener<Extract<T, { type: T['type'] }>>
}

export type JSONAPIEventListener<T extends JSONAPIEvent<any, any>, U = EventEmitter<T>> = (
  this: U,
  event: T,
) => void

export class EventEmitter<T extends JSONAPIEvent<any, any>> {
  private subscriptions: Array<JSONAPIEventSubscription<T>> = []

  on<
    U extends T['type'],
    V extends JSONAPIEventListener<Extract<T, { type: U }>, any> = JSONAPIEventListener<
      Extract<T, { type: U }>,
      this
    >
  >(type: U, listener: V): Effect {
    const subscription = { type, listener }
    this.subscriptions.push(subscription)
    return () => {
      this.subscriptions = this.subscriptions.filter((item) => item !== subscription)
    }
  }

  listen<U extends JSONAPIEventListener<T, any>>(listener: U): Effect {
    return this.on(null as any, listener)
  }

  addEventListener<
    U extends T['type'],
    V extends JSONAPIEventListener<Extract<T, { type: U }>, any> = JSONAPIEventListener<
      Extract<T, { type: U }>,
      this
    >
  >(type: U, listener: V): void {
    this.subscriptions.push({ type, listener })
  }

  removeEventListener<U extends T['type']>(
    type: U,
    listener: JSONAPIEventListener<Extract<T, { type: U }>, any>,
  ): void {
    this.subscriptions = this.subscriptions.filter(
      (subscription) => subscription.type !== type && subscription.listener !== listener,
    )
  }

  protected emit(event: T) {
    this.subscriptions.forEach((subscription) => {
      if (subscription.type === null || subscription.type === event.type) {
        subscription.listener.call(this as any, event as any)
      }
    })
  }
}
