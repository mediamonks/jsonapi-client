import { isArray, isUndefined, isNull } from 'isntnt'

import { ResourceFieldFlag, ValidationErrorMessage } from '../data/enum'
import {
  createValidationErrorObject,
  ResourceValidationError,
  ResourceValidationErrorObject,
} from '../error'
import type { ResourceFields, ResourcePatchData, JSONAPIResourceObject } from '../types'
import { resourceTypeNotFoundDetail, onResourceOfTypeMessage } from '../util/formatting'
import { resourceIdentifier, resourcePatchData } from '../util/validators'
import type { ResourceFormatter } from '../formatter'

export const encodeResourcePatchData = <T extends ResourceFormatter>(
  formatters: ReadonlyArray<T>,
  data: ResourcePatchData<T>,
): { data: JSONAPIResourceObject } => {
  if (!resourcePatchData.predicate(data)) {
    console.error(ValidationErrorMessage.InvalidResourcePatchData, data)
    throw new ResourceValidationError(ValidationErrorMessage.InvalidResourcePatchData, data, [])
  }

  const formatter = formatters.find((formatter) => formatter.type === data.type)
  if (!formatter) {
    console.error(ValidationErrorMessage.InvalidResourcePatchData, data)
    throw new ResourceValidationError(ValidationErrorMessage.InvalidResourcePatchData, data, [
      createValidationErrorObject(
        ValidationErrorMessage.InvalidResourceType,
        resourceTypeNotFoundDetail(formatters),
        ['type'],
        data,
      ),
    ])
  }

  const errors: Array<ResourceValidationErrorObject> = []
  const body: JSONAPIResourceObject = {
    type: data.type,
    id: data.id,
  }

  Object.keys(data).forEach((key) => {
    if (key !== 'type' && key !== 'id' && !formatter.hasField(key)) {
      errors.push(
        createValidationErrorObject(
          ValidationErrorMessage.FieldNotFound,
          onResourceOfTypeMessage([formatter], `Field "${key}" does not exist`),
          [key],
          data,
        ),
      )
    }
  })

  Object.keys(formatter.fields).forEach((fieldName) => {
    const field: ResourceFields[any] = formatter.getField(fieldName as any)
    const value = data[fieldName as keyof typeof data]

    if (!isUndefined(value)) {
      if (field.matches(ResourceFieldFlag.PatchForbidden)) {
        errors.push(
          createValidationErrorObject(
            ValidationErrorMessage.InvalidResourceField,
            onResourceOfTypeMessage([formatter], `Field "${fieldName}" must be omitted`),
            [fieldName],
            data,
          ),
        )
      } else if (field.matches(ResourceFieldFlag.PatchRequired) && isNull(value)) {
        errors.push(
          createValidationErrorObject(
            ValidationErrorMessage.InvalidAttributeValue,
            onResourceOfTypeMessage([formatter], `Field "${fieldName}" is required`),
            [fieldName],
            data,
          ),
        )
      } else if (field.isAttributeField()) {
        const attributes: Record<string, any> = (body.attributes ||= {})
        if (isNull(value)) {
          attributes[fieldName] = value
        } else {
          const serializedValue = (attributes[fieldName] = field.serialize(value))
          field.validate(serializedValue).forEach((detail) => {
            errors.push(
              createValidationErrorObject(
                ValidationErrorMessage.InvalidAttributeValue,
                detail,
                [fieldName],
                data,
              ),
            )
          })
        }
      } else if (field.isRelationshipField()) {
        const relationships: Record<string, any> = (body.relationships ||= {})
        const relationshipFormatters = field.getFormatters()
        if (field.isToOneRelationshipField()) {
          if (isNull(value)) {
            relationships[fieldName] = { data: value }
          } else {
            if (!resourceIdentifier.predicate(value)) {
              resourceIdentifier.validate(value).forEach((detail) => {
                errors.push(
                  createValidationErrorObject(
                    ValidationErrorMessage.InvalidResourceIdentifier,
                    detail,
                    [fieldName],
                    data,
                  ),
                )
              })
            } else if (!relationshipFormatters.some((formatter) => formatter.type === value.type)) {
              relationships[fieldName] = { data: value }
              errors.push(
                createValidationErrorObject(
                  ValidationErrorMessage.InvalidResourceType,
                  `To-One relationship "${fieldName}" must be a resource identifier of type "${relationshipFormatters}"`,
                  [fieldName],
                  data,
                ),
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
                data,
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
                        data,
                      ),
                    )
                  })
                  return item
                } else if (
                  !relationshipFormatters.some((formatter) => formatter.type === item.type)
                ) {
                  errors.push(
                    createValidationErrorObject(
                      ValidationErrorMessage.InvalidResourceType,
                      resourceTypeNotFoundDetail(relationshipFormatters),
                      [fieldName],
                      data,
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
    }
  })

  if (errors.length) {
    console.error(ValidationErrorMessage.InvalidResourcePatchData, errors)
    throw new ResourceValidationError(ValidationErrorMessage.InvalidResourcePatchData, data, errors)
  }
  return { data: body }
}
