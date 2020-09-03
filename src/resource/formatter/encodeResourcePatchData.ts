import { isArray, isNone, isNull } from 'isntnt'

import { ResourceFieldFlag, ValidationErrorMessage } from '../../enum'
import {
  createValidationErrorObject,
  ResourceValidationError,
  ResourceValidationErrorObject,
} from '../../error'
import type { ResourceFields, ResourcePatchData, JSONAPIResourceObject } from '../../types'
import { resourceIdentifier, resourcePatchData } from '../../util/validators'
import type { ResourceFormatter } from '../formatter'

export const encodeResourcePatchData = (
  formatters: ReadonlyArray<ResourceFormatter>,
  data: ResourcePatchData<ResourceFormatter>,
): { data: JSONAPIResourceObject } => {
  resourcePatchData.assert(data)

  const errors: Array<ResourceValidationErrorObject> = []
  const body: JSONAPIResourceObject = {
    type: data.type,
    id: data.id,
  }

  const formatter = formatters.find((formatter) => formatter.type === data.type)
  if (!formatter) {
    errors.push(
      createValidationErrorObject(
        ValidationErrorMessage.InvalidResourceType,
        `Data type must match that of formatter`, // TODO: Improve err message
        ['type'],
      ),
    )
  } else {
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

    Object.keys(formatter.fields).forEach((key) => {
      const field: ResourceFields[any] = formatter.getField(key)
      const value = data[key as keyof typeof data]

      if (field.matches(ResourceFieldFlag.NeverPatch)) {
        errors.push(
          createValidationErrorObject(
            ValidationErrorMessage.InvalidResourceField,
            `Field "${key}" must be omitted from patch-data on resource of type "${formatter}"`,
            [key],
          ),
        )
      } else if (field.isAttributeField()) {
        const attributes: Record<string, any> = body.attributes || (body.attributes = {})
        if (isNone(value)) {
          if (!field.validate(null)) {
            errors.push(
              createValidationErrorObject(
                ValidationErrorMessage.InvalidAttributeValue,
                `Field "${key}" is required on resource of type "${formatter}"`,
                [key],
              ),
            )
          } else {
            attributes[key] = null
          }
        } else {
          const serializedValue = field.serialize(value)
          attributes[key] = serializedValue
          field.validate(serializedValue).forEach((detail) => {
            errors.push(
              createValidationErrorObject(ValidationErrorMessage.InvalidAttributeValue, detail, [
                key,
              ]),
            )
          })
        }
      } else if (field.isRelationshipField()) {
        const relationships: Record<string, any> = body.relationships || (body.relationships = {})
        const resources = field.getResources()
        if (field.isToOneRelationshipField()) {
          if (isNone(value)) {
            relationships[key] = null
          } else {
            if (!resourceIdentifier.predicate(value)) {
              resourceIdentifier.validate(value).forEach((detail) => {
                errors.push(
                  createValidationErrorObject(
                    ValidationErrorMessage.InvalidResourceIdentifier,
                    detail,
                    [key],
                  ),
                )
              })
            } else if (!resources.some((resource) => resource.type === value.type)) {
              errors.push(
                createValidationErrorObject(ValidationErrorMessage.InvalidResourceType, `todo`, [
                  key,
                ]),
              )
            } else {
              relationships[key] = { data: { type: value.type, id: value.id } }
            }
          }
        } else {
          if (!isArray(value)) {
            errors.push(
              createValidationErrorObject(
                ValidationErrorMessage.InvalidToManyRelationshipData,
                `To-Many relationship data must be an Array`,
                [key],
              ),
            )
          } else {
            relationships[key] = {
              data: value.map((item) => {
                if (!resourceIdentifier.predicate(item)) {
                  resourceIdentifier.validate(item).forEach((detail) => {
                    errors.push(
                      createValidationErrorObject(
                        ValidationErrorMessage.InvalidResourceIdentifier,
                        detail,
                        [
                          key,
                          // String(index),
                        ],
                      ),
                    )
                  })
                  return item
                } else if (!resources.some((resource) => resource.type === item.type)) {
                  errors.push(
                    createValidationErrorObject(
                      ValidationErrorMessage.InvalidResourceType,
                      resources.length === 1
                        ? `Resource type must equal "${resources}"`
                        : `Resource type must be one of; ${resources
                            .map((resource) => `"${resource.type}"`)
                            .join(', ')}`,
                      [
                        key,
                        // String(index),
                      ],
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
  }

  if (errors.length) {
    throw new ResourceValidationError(ValidationErrorMessage.InvalidResourcePatchData, data, errors)
  }
  return { data: body }
}
