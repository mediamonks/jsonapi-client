import { isArray, isNone, isUndefined } from 'isntnt'

import { ResourceFieldFlag, ValidationErrorMessage } from '../data/enum'
import {
  createValidationErrorObject,
  ResourceValidationError,
  ResourceValidationErrorObject,
} from '../error'
import type { ResourceFields, JSONAPIResourceCreateObject, ResourceCreateData } from '../types'
import { resourceTypeNotFoundDetail, onResourceOfTypeMessage } from '../util/formatting'
import { resourceCreateData, resourceIdentifier } from '../util/validators'
import type { ResourceFormatter } from '../formatter'

export const encodeResourceCreateData = <T extends ResourceFormatter>(
  formatters: ReadonlyArray<T>,
  data: ResourceCreateData<T>,
): { data: JSONAPIResourceCreateObject<T> } => {
  if (!resourceCreateData.predicate(data)) {
    throw new ResourceValidationError(ValidationErrorMessage.InvalidResourceCreateData, data, [])
  }

  const formatter = formatters.find((formatter) => formatter.type === data.type)
  if (!formatter) {
    throw new ResourceValidationError(ValidationErrorMessage.InvalidResourceCreateData, data, [
      createValidationErrorObject(
        ValidationErrorMessage.InvalidResourceType,
        resourceTypeNotFoundDetail(formatters),
        ['type'],
      ),
    ])
  }

  const errors: Array<ResourceValidationErrorObject> = []
  const body: JSONAPIResourceCreateObject =
    'id' in data
      ? {
          type: data.type,
          id: data.id,
        }
      : {
          type: data.type,
        }

  Object.keys(data).forEach((key) => {
    if (key !== 'type' && key !== 'id' && !formatter.hasField(key)) {
      errors.push(
        createValidationErrorObject(
          ValidationErrorMessage.FieldNotFound,
          onResourceOfTypeMessage([formatter], `Field "${key}" does not exist`),
          [key],
        ),
      )
    }
  })

  Object.keys(formatter.fields).forEach((fieldName) => {
    const field: ResourceFields[any] = formatter.getField(fieldName as any)
    const value = data[fieldName as keyof typeof data]

    if (field.matches(ResourceFieldFlag.PostForbidden)) {
      errors.push(
        createValidationErrorObject(
          ValidationErrorMessage.InvalidResourceField,
          onResourceOfTypeMessage(
            [formatter],
            `Field "${fieldName}" must be omitted`,
          ),
          [fieldName],
        ),
      )
      // check for undefined only for to-many relationship field because null is an invalid value
    } else if (field.isToManyRelationshipField() ? isUndefined(value) : isNone(value)) {
      if (field.matches(ResourceFieldFlag.PostRequired)) {
        errors.push(
          createValidationErrorObject(
            ValidationErrorMessage.InvalidResourceField,
            onResourceOfTypeMessage(
              [formatter],
              `Field "${fieldName}" is required`,
            ),
            [fieldName],
          ),
        )
      }
    } else if (field.isAttributeField()) {
      const attributes = (body.attributes ||= {})
      const serializedValue = (attributes[fieldName] = field.serialize(value))
      field.validate(serializedValue).forEach((detail) => {
        errors.push(
          createValidationErrorObject(ValidationErrorMessage.InvalidAttributeValue, detail, [
            fieldName,
          ]),
        )
      })
    } else if (field.isRelationshipField()) {
      const relationships: Record<string, any> = (body.relationships ||= {})
      const relationshipFormatters = field.getFormatters()
      if (field.isToOneRelationshipField()) {
        if (!resourceIdentifier.predicate(value)) {
          resourceIdentifier.validate(value).forEach((detail) => {
            errors.push(
              createValidationErrorObject(
                ValidationErrorMessage.InvalidResourceIdentifier,
                detail,
                [fieldName],
              ),
            )
          })
        } else {
          if (!relationshipFormatters.some(formatter => formatter.type === value.type)) {
            relationships[fieldName] = { data: value }
            errors.push(
              createValidationErrorObject(ValidationErrorMessage.InvalidResourceType, 
                `To-One relationship "${fieldName}" must be a resource identifier of type "${relationshipFormatters}"`, [
                fieldName,
              ]),
            )            
          } else {
            relationships[fieldName] = {
              data: {
                type: value.type,
                id: value.id,
              },
            }
          }
        }
      } else {
        if (!isArray(value)) {
          relationships[fieldName] = { data: value }
          errors.push(
            createValidationErrorObject(
              ValidationErrorMessage.InvalidToManyRelationshipData,
              onResourceOfTypeMessage(
                relationshipFormatters,
                `To-Many relationship "${fieldName}" must be an Array`,
              ),
              [fieldName],
            ),
          )
        } else {
          relationships[fieldName] = {
            data: value.map((item: unknown) => {
              if (!resourceIdentifier.predicate(item)) {
                resourceIdentifier.validate(item).forEach((detail) => {
                  errors.push(
                    createValidationErrorObject(
                      ValidationErrorMessage.InvalidResourceIdentifier,
                      detail,
                      [fieldName],
                    ),
                  )
                })
                return item
              } else if (!relationshipFormatters.some(formatter => formatter.type === item.type)) {
                errors.push(
                  createValidationErrorObject(
                    ValidationErrorMessage.InvalidResourceType,
                    resourceTypeNotFoundDetail(relationshipFormatters),
                    [fieldName],
                  ),
                )
                return item
              }
              return {
                type: item.type,
                id: item.id,
              }
            }),
          }
        }
      }
    }
  })

  if (errors.length) {
    throw new ResourceValidationError(
      ValidationErrorMessage.InvalidResourceCreateData,
      data,
      errors,
    )
  }
  return { data: body }
}
