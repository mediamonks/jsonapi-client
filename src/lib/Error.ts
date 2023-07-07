export abstract class JSONAPIError<T> extends Error {
  abstract name: string;
  pointer: ReadonlyArray<string>;
  value: T;

  constructor(message: string, value: T, pointer: ReadonlyArray<string> = []) {
    super(message);
    this.value = value;
    this.pointer = pointer;
  }
}

export class JSONAPIRequestError<T> extends JSONAPIError<T> {
  name = 'JSONAPIRequestError';
}

export class JSONAPIResponseError<T> extends JSONAPIError<T> {
  name = 'JSONAPIResponseError';
}

export class JSONAPIValidationError<T> extends JSONAPIError<T> {
  name = 'JSONAPIValidationError';
}
