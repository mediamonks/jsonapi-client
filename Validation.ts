import { Predicate, isString, isObject, shape } from 'isntnt'

type Success<T> = Validation<T, never> & { state: ValidationState.SUCCESS }
type Failure<E> = Validation<never, E> & { state: ValidationState.FAILURE }

type ResolveValidation<S, F> = (success: (value: S) => void, failure: (errors: F) => void) => void

enum ValidationState {
  SUCCESS = 'success',
  FAILURE = 'failure',
}

export class Validation<S, F> {
  value!: S | F
  state!: ValidationState

  constructor(resolve: ResolveValidation<S, F>) {
    resolve(
      (value: S) => {
        if (!this.state) {
          this.value = value
          this.state = ValidationState.SUCCESS
        }
      },
      (value: F) => {
        if (!this.state) {
          this.value = value
          this.state = ValidationState.FAILURE
        }
      },
    )
    if (!this.state) {
      throw new Error(`Must be resolved`)
    }
  }

  isSuccess(): this is Success<S> {
    return this.state === ValidationState.SUCCESS
  }

  mapSuccess<T>(transform: (value: S) => T): Validation<T, F> {
    if (this.isSuccess()) {
      return Validation.success(transform(this.value))
    }
    return this as any
  }

  isFailure(): this is Failure<F> {
    return this.state === ValidationState.FAILURE
  }

  mapFailure<T>(transform: (value: F) => T): Validation<S, T> {
    if (this.isFailure()) {
      return Validation.failure(transform(this.value))
    }
    return this as any
  }

  map<V extends Validation<any, any>>(transform: (validation: this) => V): V {
    return transform(this)
  }

  unwrap(): S {
    if (this.isFailure()) {
      throw this.value
    }
    return this.value as S
  }

  static success<T>(value: T): Success<T> {
    return new Validation((accept) => accept(value)) as any
  }

  static failure<F>(value: F): Failure<F> {
    return new Validation((_, reject) => reject(value)) as any
  }
}

class ValidationError extends Error {
  static of(message: ValidatorRule<any>) {
    return new ValidationError(String(message))
  }
}

type ValidatorCode = string | number
type ValidatorLabel = string
type ValidatorDescription = string

class Validator<T> {
  rules: Array<ValidatorRule<T>>
  constructor(...rules: Array<ValidatorRule<T>>) {
    this.rules = rules
  }

  validate(value: unknown): Validation<T, string[]> {
    return new Validation((accept, reject) => {
      const errors = this.rules.filter((rule) => !rule.isValid(value)).map(String)
      return errors.length ? reject(errors) : accept(value as T)
    })
  }

  assert(value: unknown): void {
    this.rules.forEach((rule) => {
      if (!rule.isValid(value)) {
        throw ValidationError.of(rule)
      }
    })
  }
}

class ValidatorRule<T> {
  code: ValidatorCode | null = null
  label: ValidatorLabel | null = null
  description: ValidatorDescription
  predicate: Predicate<T>

  constructor(description: ValidatorDescription, predicate: Predicate<T>) {
    this.description = description
    this.predicate = predicate
  }

  validate(value: unknown): Validation<T, ValidationError> {
    return this.predicate(value)
      ? Validation.success(value)
      : Validation.failure(ValidationError.of(this))
  }

  isValid(value: unknown): value is T {
    return this.predicate(value)
  }

  isOr<U>(value: unknown, fallbackValue: U): T | U {
    return this.predicate(value) ? value : fallbackValue
  }

  isOrNothing(value: unknown): T | undefined {
    return (this.isOr as any)(value) // cast Validator#isOr to any so the second parameter can be omitted
  }

  // withCode(code: ValidatorCode): this {
  //   return this
  // }

  // withLabel(label: ValidatorLabel): this {
  //   return this
  // }

  toString(): string {
    const label = this.label === null ? ValidatorRule.defaultLabel : this.label
    const message = `${label} must be ${this.description}`
    return this.code !== null ? `${message} (${this.code})` : message
  }

  valueOf(): ValidatorCode | null {
    return this.code
  }

  static create<T>(description: string, predicate: Predicate<T>): ValidatorRule<T> {
    return new ValidatorRule(description, predicate)
  }

  static defaultLabel = 'value'
  static createDescriptor = (description: string) => (validator: ValidatorRule<any>): string => {
    const label = validator.label === null ? ValidatorRule.defaultLabel : validator.label
    const message = `${label} must be ${description}`
    return validator.code !== null ? `${message} (${validator.code})` : message
  }
}

class TypeValidator<T> extends ValidatorRule<T> {
  toString(): string {
    return this.description
  }
}

const oi = new ValidatorRule('o', isObject)
const xRule = new ValidatorRule('test', shape({ x: isString }))
const xA = new ValidatorRule('x', shape({ y: isString }))

const xValidator = new Validator(oi, xRule, xA)
