import Client from '../../src'
import { User } from './resources'

const individualResourceQuery = User.parseResourceQuery(
  {
    User: ['givenName', 'birthCountry'],
    Country: ['locales', 'a'],
    A: ['x'],
  },
  {
    birthCountry: {
      a: null,
    },
    // friends: null, // Uncomment to see IllegalField error
  },
)

const url = new URL('https://example.com')

const client = new Client(url, {
  defaultRelationshipData: 'resource-identifiers',
  parsePageQuery(query: { offset?: number; limit: number }) {
    return query
  },
})

const users = client.endpoint('users', User)

users.create({
  emailAddress: 'user@example.com',
  password: 'password1',
  dateOfBirth: new Date(1970, 0, 1),
})

const getUserEmailAddress = users.one({
  fields: {
    User: ['emailAddress'],
  },
})

getUserEmailAddress('42').then((resource) => {
  console.log(Object.keys(resource.data)) // > ['type', 'id', 'emailAddress']
})

users.getOne('42', individualResourceQuery).then((resource) => {
  if (resource.data.birthCountry?.type === 'Country') {
    console.log(resource.data.birthCountry.locales)

    resource.data.givenName
  }

  users.update(resource.data, {
    // givenName: 'Hans', // Uncomment to see IllegalField error
    birthCountry: null,
    friends: [{ type: 'User', id: '16' }],
  })

  users.updateRelationship({ type: 'User', id: '96' }, 'birthCountry', {
    type: 'Country',
    id: '<id>',
  })

  users.addRelationships({ type: 'User', id: '8' }, 'partners', [])

  users.delete(resource.data)
})

users.getOneRelationship('128', 'birthCountry', {}).then((resource) => {
  console.log(resource.data.type)
})

users.getManyRelationship('64', 'friends', {}).then((manyResources) => {
  manyResources.data[0].familyName
  return manyResources.nextPage()
})

const resourcePostObject = User.createResourcePostObject({
  password: 'password1',
  emailAddress: 'user@example.com',
})

const resourcePatchObject = User.createResourcePatchObject('12', {
  password: 'password1',
  emailAddress: 'user@example.com',
})
