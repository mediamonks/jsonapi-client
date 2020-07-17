import { ResourceFieldsQuery, ResourceFilter, JSONAPISearchParams } from '../types'

export const createURL = (
  baseUrl: URL,
  path: Array<string>,
  resourceQuery: ResourceFilter<any> = {},
  searchParams: JSONAPISearchParams = {},
) => {
  const url = new URL(path.join('/'), baseUrl)
  getFieldsParamEntries(resourceQuery.fields).forEach(([name, value]) => {
    url.searchParams.append(name, value)
  })
  return url
}

export const getFieldsParamEntries = (
  fieldsQuery?: ResourceFieldsQuery<any>,
): Array<[string, string]> =>
  Object.entries(fieldsQuery || {})
    .filter(([, fieldNames]) => fieldNames?.length)
    .map(([type, fieldNames]) => [`fields[${type}]`, fieldNames!.join(',')])
