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

const User = resource('User', {
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

## Create an Endpoint

```typescript
const userEndpoint = client.endpoint('users', User)
```

## Create a JSON:API Resource

```typescript
const myFirstUser = {
  emailAddress: 'jane.smiht@example.com',
  password: 'password1',
  userName: 'example_jane',
}

userEndpoint.create(myFirstUser).then((user) => {
  console.log(user.data.messages)
})
```

# Update a JSON:API Resource

```typescript
const myFirstUserUpdate = {
  emailAddress: 'jane.smith@example.com',
}

userEndpoint.update(myFirstUserUpdate).then((user) => {
  console.log(user.data.messages)
})
```

## Get a Single Resource Using a ResourceQuery

```typescript
const userEmailQuery = User.parseResourceQuery({
  User: ['emailAddress', 'dateOfBirth'],
})

userEndpoint.getOne('<user-id>', userEmailQuery).then((userResource) => {
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

### Resource.createResourcePostObject

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

### Client#endpoint

```
(ResourcePath, ResourceConstructor) -> JSONAPIEndpoint
```

## Endpoint

### Endpoint#constructor

```
(JSONAPIClient, ResourcePath, ResourceConstructor) -> JSONAPIEndpoint
```

### Endpoint#create

```
async (ResourceCreateData) -> OneResource
```

### Endpoint#update

```
async (Resource, ResourcePatchData) -> OneResource
```

### Endpoint#delete

```
async (ResourceId) -> void
```

### Endpoint#updateRelationship

```
async (Resource, ToManyRelationshipNameWithFlag, RelationshipPatchData) -> OneResource
```

### Endpoint#addRelationships

```
async (Resource, ToManyRelationshipNameWithFlag, ToManyRelationshipPatchData) -> OneResource
```

### Endpoint#deleteRelationships

```
async (Resource, ToManyRelationshipNameWithFlag, ToManyRelationshipPatchData) -> OneResource
```

### Endpoint#getOne

```
async (ResourceId, ResourceQuery) -> OneResource
```

### Endpoint#getMany

```
async (ClientQuery, ResourceQuery) -> ManyResource
```

### Endpoint#getOneRelationship

```
async (ResourceId, ToManyRelationshipName, ResourceQuery) -> OneResource
```

### Endpoint#getManyRelationship

```
async (ResourceId, ToManyRelationshipName, ResourceQuery) -> ManyResource
```

### Endpoint#one

```
(ResourceQuery) -> (ResourceId) -> OneResource
```

### Endpoint#many

```
(ResourceQuery) -> (ClientQuery) -> ManyResource
```

### Endpoint#toOne

```
(ToOneRelationshipFieldNameWithFlag, ResourceQuery) -> (ResourceId) -> OneResource
```

### Endpoint#many

```
(ToManyRelationshipFieldNameWithFlag, ResourceQuery) -> (ResourceId) -> ManyResource
```

## OneResource

### OneResource#constructor

```
(Resource, JSONAPIMetaObject, JSONAPIResourceLinks) -> OneResource
```

## ManyResource

### ManyResource#constructor

```
(Resource[], JSONAPIMetaObject, JSONAPIResourceLinks & JSONAPIPaginationLinks) -> ManyResourceOneResource
```

### ManyResource#hasPrevPage

```
() -> boolean
```

### ManyResource#hasNextPage

```
() -> boolean
```

### ManyResource#firstPage

```
async () -> ManyResource
```

### ManyResource#prevPage

```
async () -> ManyResource
```

### ManyResource#nextPage

```
async () -> ManyResource
```

### ManyResource#lastPage

```
async () -> ManyResource
```
