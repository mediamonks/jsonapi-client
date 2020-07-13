import { Client } from '../../src'

import { User } from './resources'

const url = new URL('https://example.com/api/v1/')

const client = new Client(url, {
  initialRelationshipData: 'resource-identifiers',
})

client.create(User, {
  emailAddress: 'user@example.com',
  password: 'password1',
  dateOfBirth: new Date(1970, 0, 1),
})

const userDetailsFilter = User.createFilter(
  {
    User: ['givenName', 'birthCountry'],
  },
  {
    birthCountry: null,
  },
)

const getUserDetails = client.one(User, userDetailsFilter)

getUserDetails('1').then((user) => user.data.givenName)

getUserDetails('42').then((resource) => {
  console.log(Object.keys(resource.data)) // > ['type', 'id', 'emailAddress']
})

client.getOne(User, '42', userDetailsFilter).then((resource) => {
  if (resource.data.birthCountry?.type === 'Country') {
    console.log(resource.data.birthCountry.locales)

    resource.data.givenName
  }

  client.update(User, '12', {
    // givenName: 'Hans', // Uncomment to see IllegalField error
    birthCountry: null,
    friends: [{ type: 'User', id: '16' }],
  })

  client.updateRelationship(User, '96', 'birthCountry', {
    type: 'Country',
    id: '<id>',
  })

  client.addRelationships(User, '8', 'partners', [])

  client.delete(User, '13')
})

// client.getOneRelationship(User, '128', 'birthCountry').then((resource) => {
//   console.log(resource.data.type)
// })

// client.getManyRelationship(User, '64', 'friends').then((manyResource) => {
//   manyResource.data[0].familyName
// })
