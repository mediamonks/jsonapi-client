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

export const encodeResourcePatchData = (
  formatters: ReadonlyArray<ResourceFormatter>,
  data: ResourcePatchData<ResourceFormatter>,
): { data: JSONAPIResourceObject } => {
  resourcePatchData.assert(data)

  const formatter = formatters.find((formatter) => formatter.type === data.type)
  if (!formatter) {
    throw new ResourceValidationError(ValidationErrorMessage.InvalidResourcePatchData, data, [
      createValidationErrorObject(
        ValidationErrorMessage.InvalidResourceType,
        resourceTypeNotFoundDetail(formatters),
        ['type'],
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
          `Field "${key}" does not exist on resource of type "${formatter}"`,
          [key],
        ),
      )
    }
  })

  Object.keys(formatter.fields).forEach((fieldName) => {
    const field: ResourceFields[any] = formatter.getField(fieldName)
    const value = data[fieldName as keyof typeof data]

    if (!isUndefined(value)) {
      if (field.matches(ResourceFieldFlag.PatchForbidden)) {
        errors.push(
          createValidationErrorObject(
            ValidationErrorMessage.InvalidResourceField,
            onResourceOfTypeMessage([formatter], `Field "${fieldName}" must be omitted`),
            [fieldName],
          ),
        )
      } else if (field.matches(ResourceFieldFlag.PatchRequired) && isNull(value)) {
        errors.push(
          createValidationErrorObject(
            ValidationErrorMessage.InvalidAttributeValue,
            onResourceOfTypeMessage([formatter], `Field "${fieldName}" is required`),
            [fieldName],
          ),
        )
      } else if (field.isAttributeField()) {
        const attributes: Record<string, any> = body.attributes || (body.attributes = {})
        if (isNull(value)) {
          attributes[fieldName] = value
        } else {
          const serializedValue = field.serialize(value)
          attributes[fieldName] = serializedValue
          field.validate(serializedValue).forEach((detail) => {
            errors.push(
              createValidationErrorObject(ValidationErrorMessage.InvalidAttributeValue, detail, [
                fieldName,
              ]),
            )
          })
        }
      } else if (field.isRelationshipField()) {
        const relationships: Record<string, any> = body.relationships || (body.relationships = {})
        const formatters = field.getFormatters()
        if (field.isToOneRelationshipField()) {
          if (isNull(value)) {
            relationships[fieldName] = value
          } else {
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
            } else if (!formatters.some((formatter) => formatter.type === value.type)) {
              errors.push(
                createValidationErrorObject(ValidationErrorMessage.InvalidResourceType, `todo`, [
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
            errors.push(
              createValidationErrorObject(
                ValidationErrorMessage.InvalidToManyRelationshipData,
                onResourceOfTypeMessage(
                  [formatter],
                  `To-Many relationship "${fieldName}" must be an Array`,
                ),
                [fieldName],
              ),
            )
          } else {
            relationships[fieldName] = {
              data: value.map((item) => {
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
                } else if (!formatters.some((formatter) => formatter.type === item.type)) {
                  errors.push(
                    createValidationErrorObject(
                      ValidationErrorMessage.InvalidResourceType,
                      resourceTypeNotFoundDetail(formatters),
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
    }
  })

  if (errors.length) {
    throw new ResourceValidationError(ValidationErrorMessage.InvalidResourcePatchData, data, errors)
  }
  return { data: body }
}
