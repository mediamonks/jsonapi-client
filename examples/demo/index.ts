import JSONAPI, { ImplicitRelationshipData } from '../../src'

import { user } from './resources'

const url = new URL('https://example.com/api/v1/')

const client = JSONAPI.client(url, {
  implicitRelationshipData: ImplicitRelationshipData.None,
  implicitPrimaryRelationshipData: ImplicitRelationshipData.None,
})

const users = client.endpoint('users', user)

users.create({
  emailAddress: 'user@example.com',
  password: 'password1',
  dateOfBirth: new Date(1970, 0, 1),
})

const userDetailsFilter = user.filter(
  {
    User: ['givenName', 'birthCountry'],
  },
  {
    birthCountry: null,
  },
)

const getUserDetails = users.one(userDetailsFilter)

getUserDetails('1').then((user) => user.data.givenName)

getUserDetails('42').then((resource) => {
  console.log(Object.keys(resource.data)) // > ['type', 'id', 'emailAddress']
})

users.getOne('42', userDetailsFilter).then(async (resource) => {
  if (resource.data.birthCountry?.type === 'Country') {
    console.log(resource.data.birthCountry.locales)
  }

  await users.update('12', {
    // givenName: 'Hans', // Uncomment to see IllegalField error
    // birthCountry: null,
    friends: [{ type: 'User', id: '16' }],
  })

  await users.updateRelationship('96', 'friends', [])

  await users.addRelationships('8', 'friends', [resource.data])

  await users.delete('13')
})

users.getOneRelationship('128', 'birthCountry').then((resource) => {
  console.log(resource.data.type)
})

users.getManyRelationship('64', 'friends').then((manyResource) => {
  manyResource.data[0].familyName
})
