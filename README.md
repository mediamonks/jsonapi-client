# JSONAPIClient

## Design Goals

- Improve TS performance and type inference.
- Prevent resource fields and its type representation from going out of sync.
- Resource fields should support read/modify/write rules.
- Resource fields with a NeverGet flag should not be prevented to be included in a ResourceQuery
- Attribute fields should support data serialization.
- Relationships fields should support resources of more than one type.
- Resource query values should no longer be required to be cast `as const`.
- Resource include query values should only allow relationships that are present in its fields query.

## TODO

- Explore replacing AttributeField type predicate with type validator for more detailed error messages.
- Write specs
- Implement everything...

# Getting Started

## Define a JSON:API Resource Formatter

```typescript
type UserType = 'User'

type UserFields = {
  emailAddress: Attribute.Required<string>
  password: Attribute.RequiredWriteOnly<string>
  userName: Attribute.RequiredStatic<string>
  dateOfBirth: Attribute.Optional<string, Date>
  role: Attribute.RequiredReadOnly<'admin' | 'editor' | 'subscriber'>
  messages: Attribute.ToManyReadOnly<MessageResource>
  friends: Relationship.ToMany<UserResource>
}

type UserResource = ResourceConstructor<UserType, UserFields>

const dateStringFormatter = {
  serialize: (value: Date) => value.toISOString(),
  deserialize: (value: string) => new Date(value),
}

const isUserRole = either('admin', 'editor', 'subscriber')

const User = resource('User', 'users', {
  emailAddress: Attribute.required(isString),
  password: Attribute.requiredWriteOnly(isString),
  userName: Attribute.requiredStatic(isString),
  dateOfBirth: Attribute.optional(isString, dateStringFormatter),
  role: Attribute.requiredReadOnly(isUserRole),
  messages: Relationship.toMany(() => [Message]),
  friends: Relationship.toMany(() => [User]),
})
```

## Create a Client

```typescript
const url = new URL('https://example.com/api/')

const client = new JSONAPIClient(url, {
  defaultIncludeFields: 'primary-relationships',
})
```

## Create a JSON:API Resource

```typescript
const myFirstUser = {
  emailAddress: 'jane.smiht@example.com',
  password: 'password1',
  userName: 'example_jane',
}

client.create(User, myFirstUser).then((user) => {
  console.log(user.data.messages)
})
```

## Update a JSON:API Resource

```typescript
const myFirstUserUpdate = {
  emailAddress: 'jane.smith@example.com',
}

client.update(User, myFirstUserUpdate)
```

## Get a Single Resource Using a Filter

```typescript
const userEmailFilter = User.createFilter({
  User: ['emailAddress', 'dateOfBirth'],
})

client.getOne(User, '12', userEmailFilter).then((userResource) => {
  console.log(userResource.data)
  /* Resource { 
    type: 'User', 
    id: string,
    emailAddress: string,
    dateOfBirth: Date | null,
  }
  */
})
```

# API (In Progress)

## Resource

### resource

```
(ResourceType, ResourceFields) -> ResourceConstructor
```

ResourceConstructor factory, returns a ResourceConstructor (Resource) with static methods to perform operations on (formatted) JSON:API data for this resource.

### Resource#constructor

```
(Resource) -> Resource
```

constructs a Resource instance

### Resource.identifier

```
(ResourceId) -> ResourceIdentifier<ResourceType>
```

Create a ResourceIdentifier from the Resource static `type` and `id` parameter

### Resource.parseResourceQuery

```
(ResourceFieldsQuery, ResourceIncludeQuery) -> ResourceQuery<ResourceFieldsQuery, ResourceIncludeQuery>
```

### Resource.parseResourceDocument

```
(JSONAPIDocument) -> Resource
```

### Resource.createResourcePostObject

```
(ResourcePostData) -> JSONAPIResourceObject
```

### Resource.createResourcePatchObject

```
(ResourceId, ResourcePatchData) -> JSONAPIResourceObject
```

## ResourceField

## ResourceField#constructor

```
(ResourceFieldRoot, ResourceFieldFlag) -> ResourceField
```

## ResourceField#matches

```
(ResourceFieldFlag) -> boolean
```

## Attribute

Extends ResourceField

### createAttributeFieldFactory

```
([ResourceFieldRule, ResourceFieldRule, ResourceFieldRule]) -> (Predicate, AttributeFieldFormatter) -> AttributeField<T, AttributeValue, ResourceFieldFlag>
```

## Relationship

Extends ResourceField

### createToOneRelationshipField

```
([ResourceFieldRule, ResourceFieldRule, ResourceFieldRule]) -> (Predicate, AttributeFieldFormatter) -> AttributeField<ResourceConstructor, RelationshipFieldType.ToOne, ResourceFieldFlag>
```

### createToManyRelationshipField

```
([ResourceFieldRule, ResourceFieldRule, ResourceFieldRule]) -> (Predicate, AttributeFieldFormatter) -> AttributeField<ResourceConstructor, RelationshipFieldType.ToMany, ResourceFieldFlag>
```

## Client

### Client#constructor

```
(URL, ClientSetup) -> JSONAPIClient
```

### Client#create

```
async (ResourceConstructor, ResourceCreateData) -> OneResource
```

### Client#update

```
async (ResourceConstructor, ResourceId, ResourcePatchData) -> void
```

### Client#delete

```
async (ResourceConstructor, ResourceId) -> void
```

### Client#updateRelationship

```
async (ResourceConstructor, ResourceId, ToManyRelationshipNameWithFlag, RelationshipPatchData) -> void
```

### Client#addRelationships

```
async (ResourceConstructor, ResourceId, ToManyRelationshipNameWithFlag, ToManyRelationshipPatchData) -> void
```

### Client#deleteRelationships

```
async (ResourceConstructor, ResourceId, ToManyRelationshipNameWithFlag, ToManyRelationshipPatchData) -> void
```

### Client#getOne

```
async (ResourceConstructor, ResourceId, ResourceQuery) -> OneResource
```

### Client#getMany

```
async (ResourceConstructor, ClientQuery, ResourceQuery) -> ManyResource
```

### Client#getOneRelationship

```
async (ResourceConstructor, ResourceId, ToManyRelationshipName, ResourceQuery) -> OneResource
```

### Client#getManyRelationship

```
async (ResourceConstructor, ResourceId, ToManyRelationshipName, ResourceQuery) -> ManyResource
```

### Client#one

```
(ResourceConstructor, ResourceQuery) -> (ResourceId) -> OneResource
```

### Client#many

```
(ResourceConstructor, ResourceQuery) -> (ClientQuery) -> ManyResource
```

### Client#toOne

```
(ResourceConstructor, ToOneRelationshipFieldNameWithFlag, ResourceQuery) -> (ResourceId) -> OneResource
```

### Client#toMany

```
(ResourceConstructor, ToManyRelationshipFieldNameWithFlag, ResourceQuery) -> (ResourceId) -> ManyResource
```

## OneResource

### OneResource#constructor

```
(FilteredResource, JSONAPIMetaObject, JSONAPIResourceLinks) -> OneResource
```

## ManyResource

### ManyResource#constructor

```
(FilteredResource[], JSONAPIMetaObject, JSONAPIResourceLinks & JSONAPIPaginationLinks) -> ManyResource
```
