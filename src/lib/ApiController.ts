import { isArray, isUndefined, isNone, isSome, isString, Serializable } from 'isntnt';
import dedent from 'dedent';

import { EMPTY_OBJECT, ResourceDocumentKey, __DEV__, DebugErrorCode } from '../constants/data';
import { createEmptyObject, keys, createDataValue, HTTPRequestMethod } from '../utils/data';
import { Result } from '../utils/Result';

import { Client, ClientSetup } from './Client';
import { JSONAPIError, JSONAPIResponseError, JSONAPIValidationError } from './Error';
import { AnyResource, ResourceConstructor } from './Resource';
import { Attribute, AttributeValue, Relationship, RelationshipValue } from './ResourceField';
import { ResourceIdentifier } from './ResourceIdentifier';
import { JSONAPIFieldsParameterValue, IncludeParameterValue } from '../utils/url';

type RequestOptions = {
  method: HTTPRequestMethod;
  headers: Headers;
  body?: string;
};

export const jsonApiContentType = 'application/vnd.api+json';

export const defaultRequestHeaders = {
  ['Accept']: jsonApiContentType,
  ['Content-Type']: jsonApiContentType,
};

export type ResourceData<R extends AnyResource> = ResourceIdentifier<R['type']> & {
  attributes: any;
  relationships: any;
};

export class ApiController<S extends Partial<ClientSetup>> {
  client: Client<S>;
  constructor(client: Client<S>) {
    this.client = client;
  }

  async handleRequest(
    url: URL,
    method: HTTPRequestMethod,
    data?: Serializable,
  ): Promise<Result<any, JSONAPIError<any>[]>> {
    if (isNone(this.client.setup.fetchAdapter)) {
      if (__DEV__) {
        throw new Error(dedent`No fetch adapter provided.
        When not running in a browser that doesn't support fetch, you need to provide polyfill fetch.
        When running in node, you can pass "node-fetch" as an adapter to the Api setup.
        If you want to mock, you can use "fetch-mock".
      `);
      }
      throw new Error(DebugErrorCode.MISSING_FETCH_ADAPTER as any);
    }

    const options: RequestOptions = {
      method,
      headers: new Headers(defaultRequestHeaders),
    };

    if (!isUndefined(data)) {
      try {
        options.body = JSON.stringify(data);
      } catch (error) {
        return Result.reject([new JSONAPIValidationError(`Data is not serializable`, data, [])]);
      }
    }

    const request = await this.client.setup.beforeRequest!(new Request(url.href, options) as any);
    const response = await this.client.setup.fetchAdapter!(request as any);
    if (!response.ok) {
      const errorMessage = response.statusText || `Request Error ${response.status}`;
      return Result.reject([new JSONAPIResponseError(errorMessage, response.status)]);
    }

    if (response.status === 204) {
      return Result.accept(null);
    }

    return response
      .json()
      .then((data): any => {
        return ResourceDocumentKey.ERRORS in data
          ? Result.reject(data.errors.map(this.client.setup.parseErrorObject))
          : Result.accept(data);
      })
      .catch((error) => Result.reject([new JSONAPIResponseError(dedent`Invalid request`, error)]));
  }

  getAttributeValue<F extends Attribute<any, any>>(
    data: ResourceData<AnyResource>,
    field: F,
    pointer: ReadonlyArray<string>,
  ): Result<AttributeValue, JSONAPIError<any>> {
    // TODO: Attributes prop is not always optional, should it throw if its missing
    // when it should not?
    const attributes = data.attributes || EMPTY_OBJECT;
    const value = (attributes as any)[field.name];
    if (field.isValid(value)) {
      return Result.accept(value);
    }
    if (field.isOptionalAttribute() && isNone(value)) {
      return Result.accept(null as any);
    }
    return Result.reject(
      new JSONAPIValidationError(
        dedent`Invalid attribute value at "${field.name}"`,
        value,
        pointer.concat(field.name),
      ),
    );
  }

  getRelationshipData<F extends Relationship<any, any>>(
    data: ResourceData<AnyResource>,
    field: F,
    pointer: ReadonlyArray<string>,
  ): Result<RelationshipValue, JSONAPIError<any>> {
    const relationships = data.relationships || EMPTY_OBJECT;
    const value = (relationships as any)[field.name];
    if (isUndefined(value)) {
      return Result.accept(field.isToOneRelationship() ? null : []);
    }
    if (field.isValid(value.data)) {
      return Result.accept(value.data);
    }
    // TODO: Augment ApiValidationError feedback using RelationshipResourceField meta
    const expectedValue = field.isToOneRelationship()
      ? `a Resource identifier or null`
      : `an array of Resource identifiers`;
    return Result.reject(
      new JSONAPIValidationError(
        dedent`Invalid relationship value, "${field.name}" must be ${expectedValue}`,
        value,
        pointer.concat(field.name),
      ),
    );
  }

  getIncludedResourceData(
    identifier: ResourceIdentifier<any>,
    included: Array<ResourceData<any>>,
    pointer: ReadonlyArray<string>,
  ): Result<ResourceData<any>, JSONAPIError<any>[]> {
    const data = included.find(
      (resource) =>
        resource[ResourceDocumentKey.TYPE] === identifier[ResourceDocumentKey.TYPE] &&
        resource[ResourceDocumentKey.ID] === identifier[ResourceDocumentKey.ID],
    );
    return isSome(data)
      ? Result.accept(data)
      : Result.reject([
          new JSONAPIResponseError(
            dedent`Resource of type "${identifier[ResourceDocumentKey.TYPE]}" with id "${
              identifier[ResourceDocumentKey.ID]
            }" is not be included`,
            identifier,
            pointer,
          ),
        ]);
  }

  decodeResource<R extends AnyResource>(
    Resource: ResourceConstructor<R>,
    data: ResourceData<R>,
    included: Array<ResourceData<any>>,
    fieldsParam: JSONAPIFieldsParameterValue,
    includeParam: IncludeParameterValue,
    pointer: ReadonlyArray<string>,
  ): Result<R, JSONAPIError<any>[]> {
    // TODO: should the data of a resource be added to the included data because
    // a relationship MAY depend on it?
    included.push(data);

    const fieldNames = fieldsParam[Resource.type] || keys(Resource.fields);
    const values: Record<string, any> = createEmptyObject();
    const errors: Array<JSONAPIError<any>> = [];

    if (Resource[ResourceDocumentKey.TYPE] !== data[ResourceDocumentKey.TYPE]) {
      errors.push(
        new JSONAPIResponseError(
          dedent`Invalid type for Resource of type "${Resource[ResourceDocumentKey.TYPE]}"`,
          data[ResourceDocumentKey.TYPE],
          pointer.concat(ResourceDocumentKey.TYPE),
        ),
      );
    } else {
      values[ResourceDocumentKey.TYPE] = data[ResourceDocumentKey.TYPE];
    }

    if (!isString(data.id)) {
      errors.push(
        new JSONAPIResponseError(
          dedent`Invalid id for Resource of type "${Resource[ResourceDocumentKey.TYPE]}"`,
          data[ResourceDocumentKey.ID],
          pointer.concat(ResourceDocumentKey.ID),
        ),
      );
    } else {
      values[ResourceDocumentKey.ID] = data[ResourceDocumentKey.ID];
    }

    fieldNames.forEach((name) => {
      const field = Resource.fields[name];

      if (isUndefined(field)) {
        if (__DEV__) {
          throw new Error(
            dedent`[ApiController#decodeResource] Resource of type "${
              Resource[ResourceDocumentKey.TYPE]
            }" has no "${name}" field`,
          );
        } else {
          throw new Error(DebugErrorCode.FIELD_DOES_NOT_EXIST as any);
        }
      }

      if (field.isAttributeField()) {
        const result = this.getAttributeValue(data, field, pointer).map((value) => {
          values[name] = value;
        });
        if (result.isRejected()) {
          errors.push(result.value);
        }
      } else if (field.isRelationshipField()) {
        const relationshipData = this.getRelationshipData(data, field, pointer).map((value) => {
          const RelationshipResource = field.getResource();
          if (isNone(value)) {
            values[name] = null;
          } else if (isNone(includeParam) || isUndefined(includeParam[name])) {
            if (isArray(value)) {
              values[name] = value.map(
                (identifier) => new ResourceIdentifier(identifier.type, identifier.id),
              );
            } else {
              values[name] = new ResourceIdentifier(value.type, value.id);
            }
          } else if (isArray(value)) {
            values[name] = [];
            value.map((identifier) => {
              const result = this.getIncludedResourceData(
                identifier,
                included,
                pointer.concat(field.name),
              )
                .flatMap((includedRelationshipData) => {
                  return this.decodeResource(
                    RelationshipResource,
                    includedRelationshipData,
                    included,
                    fieldsParam,
                    includeParam[field.name] || EMPTY_OBJECT,
                    pointer.concat(field.name),
                  );
                })
                .map((relationshipResource) => {
                  values[name].push(relationshipResource);
                });
              if (result.isRejected()) {
                errors.push(...result.value);
              }
            });
          } else {
            const result = this.getIncludedResourceData(value, included, pointer.concat(field.name))
              .flatMap((includedRelationshipData) =>
                this.decodeResource(
                  RelationshipResource,
                  includedRelationshipData,
                  included,
                  fieldsParam,
                  includeParam[field.name] || EMPTY_OBJECT,
                  pointer.concat(field.name),
                ),
              )
              .map((relationshipResource) => {
                values[name] = relationshipResource;
              });
            if (result.isRejected()) {
              errors.push(...result.value);
            }
          }
        });
        if (relationshipData.isRejected()) {
          errors.push(relationshipData.value);
        }
      }
    });

    return errors.length
      ? Result.reject(errors)
      : Result.accept(new Resource(values as any) as any);
  }

  encodeResource<R extends AnyResource>(
    Resource: ResourceConstructor<R>,
    values: R,
    fieldsNames: Array<string>,
    pointer: ReadonlyArray<string>,
  ): Result<any, JSONAPIError<any>[]> {
    const errors: Array<JSONAPIError<any>> = [];
    const data: Record<string, any> = createEmptyObject();

    if (
      ResourceDocumentKey.TYPE in values &&
      values[ResourceDocumentKey.TYPE] !== Resource[ResourceDocumentKey.TYPE]
    ) {
      errors.push(
        new JSONAPIValidationError(
          dedent`Invalid type for Resource of type ${Resource.type}`,
          values[ResourceDocumentKey.TYPE],
          pointer.concat(ResourceDocumentKey.TYPE),
        ),
      );
    }

    data[ResourceDocumentKey.TYPE] = Resource[ResourceDocumentKey.TYPE];

    if (ResourceDocumentKey.ID in values) {
      if (isString(values[ResourceDocumentKey.ID])) {
        data[ResourceDocumentKey.ID] = values[ResourceDocumentKey.ID];
      } else {
        errors.push(
          new JSONAPIValidationError(
            dedent`Invalid id value for Resource of type ${Resource.type}`,
            values[ResourceDocumentKey.ID],
            pointer.concat(ResourceDocumentKey.ID),
          ),
        );
      }
    }

    fieldsNames.forEach((name) => {
      const field = (Resource.fields as any)[name];
      if (isUndefined(field)) {
        if (__DEV__) {
          throw new Error(
            dedent`[ApiController#encodeResource] Resource of type "${Resource.type}" has no "${name}" field`,
          );
        } else {
          throw new Error(DebugErrorCode.FIELD_DOES_NOT_EXIST as any);
        }
      }

      const value = (values as any)[name];
      if (isUndefined(value)) {
        return;
      }
      if (field.isAttributeField()) {
        if (field.isValid(value)) {
          (data.attributes || (data.attributes = createEmptyObject()))[name] = value;
        } else if (field.isRequiredAttribute() || isSome(value)) {
          errors.push(
            new JSONAPIValidationError(
              `Invalid attribute at "${name}" for Resource of type ${Resource.type}`,
              value,
              pointer.concat(name),
            ),
          );
        }
      } else if (field.isRelationshipField()) {
        if (field.isValid(value)) {
          (data.relationships || (data.relationships = createEmptyObject()))[name] =
            createDataValue({
              data: isArray(value)
                ? value.map((identifier: any) =>
                    createDataValue({ type: identifier.type, id: identifier.id }),
                  )
                : isNone(value)
                ? null
                : createDataValue({ type: value.type, id: value.id }),
            });
        } else if (name in values) {
          errors.push(
            new JSONAPIValidationError(
              `Invalid relationship data at "${name}" for Resource of type ${Resource.type}`,
              value,
              pointer.concat(name),
            ),
          );
        }
      }
    });

    return errors.length ? Result.reject(errors) : Result.accept({ data });
  }
}
