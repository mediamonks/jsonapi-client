// type Predicate<T> = (value: unknown, ...rest: Array<unknown>) => value is T
// type Static<T extends Predicate<any>> = T extends Predicate<infer R> ? R : never

// type RequiredType<T> = Exclude<T, null | undefined>

// type ResourceConstructor<R extends Resource<any, any>> = {
//   type: R['type']
//   fields: Record<keyof R, any>
//   new (values: R): R
// }

// type ResourceAttributeValue =
//   | string
//   | number
//   | boolean
//   | null
//   | { [key: string]: ResourceAttributeValue }
//   | Array<ResourceAttributeValue>

// type Resource<T extends string, M extends ResourceModel<M>> = M &
//   ResourceIdentifier<T>

// class ResourceIdentifier<T extends string> {
//   type: T
//   id: string

//   constructor(type: T, id: string) {
//     this.type = type
//     this.id = id
//   }
// }

// type ResourceIdentifierKey = keyof ResourceIdentifier<any>

// type ResourceModel<M extends Record<string, any>> = {
//   [K in keyof M]: K extends ResourceIdentifierKey ? never : M[K]
// }

// const resource = <T extends string>(type: T) => {
//   return class JsonApiResource<
//     M extends ResourceModel<Omit<M, ResourceIdentifierKey>>
//   > extends ResourceIdentifier<T> {
//     static type: T = type
//     static fields: Record<string, any> = Object.create(null)
//     constructor(data: Resource<T, M>) {
//       super(data.type, data.id)
//       Object.assign(this, data)
//     }
//   }
// }

// type ValuesOf<T> = T[keyof T]

// type ResourceRelationships<T extends Resource<any, any>> = ValuesOf<
//   {
//     [K in keyof T]: Exclude<T[K], null> extends ResourceIdentifier<any>
//       ? ResourceWithRelationships<T[K]>
//       : T[K] extends ResourceIdentifier<any>[]
//       ? ResourceWithRelationships<T[K][number]>
//       : never
//   }
// >

// type ResourceFirstRelationships<T extends Resource<any, any>> = ValuesOf<
//   {
//     [K in keyof T]: Exclude<T[K], null> extends ResourceIdentifier<any>
//       ? T[K]
//       : T[K] extends ResourceIdentifier<any>[]
//       ? T[K][number]
//       : never
//   }
// >

// type ResourceWithRelationships<T extends Resource<any, any>> =
//   | T
//   | ResourceRelationships<T>

// type ResourceRelationshipFieldName<T extends Resource<any, any>> = ValuesOf<
//   {
//     [K in keyof T]: Exclude<T[K], null> extends ResourceIdentifier<any>
//       ? K
//       : T[K] extends ResourceIdentifier<any>[]
//       ? K
//       : never
//   }
// >

// type ResourceTypes<T extends Resource<any, any>> =
//   | T['type']
//   | ValuesOf<
//       {
//         [K in keyof T]: T[K] extends ResourceIdentifier<any>
//           ? ResourceTypes<T[K]>
//           : T[K] extends ResourceIdentifier<any>[]
//           ? ResourceTypes<T[K][number]>
//           : T[K] extends ResourceConstructor<any>
//           ? ResourceTypes<T[K]>
//           : never
//       }
//     >

// type ResourceModels<T extends Resource<any, any>, X = never> =
//   | T
//   | ValuesOf<
//       {
//         [K in keyof T]: Exclude<T[K], null> extends ResourceIdentifier<any>
//           ? Exclude<T[K], null> extends X
//             ? never
//             : ResourceModels<Exclude<T[K], null>, X | T>
//           : T[K] extends ResourceIdentifier<any>[]
//           ? T[K][number] extends X
//             ? never
//             : ResourceModels<T[K][number], X | T>
//           : never
//       }
//     >

// type ResourceFields<T extends Resource<any, any>> = {
//   [K in T['type']]: Array<Exclude<keyof T, ResourceIdentifierKey>>
// }

// type Test = ResourceFields<Person>

// type ResourceInstance = any
// type ResourceAttributeDescriptor = void

// type CollectionType<T extends Collection<any>> = T['resources'][number]['type']

// class Collection<R extends Array<ResourceConstructor<any>>> {
//   resources: R
//   constructor(...resources: R) {
//     this.resources = resources
//   }
// }

// class ApiEndpoint<R extends ResourceConstructor<any>> {
//   path: string
//   Resource: R
//   constructor(path: string, Resource: R) {
//     this.path = path
//     this.Resource = Resource
//   }

//   get(id: string, fields: any): InstanceType<R> {
//     return new this.Resource({ id } as any)
//   }

//   getFrom<T extends ResourceRelationshipFieldName<InstanceType<R>>>(
//     id: string,
//     relationship: T,
//   ) {}

//   query() {}
// }

// const isString = (value: unknown): value is string => typeof value === 'string'

// const requiredAttribute = <
//   T extends Predicate<RequiredType<ResourceAttributeValue>>
// >(
//   predicate: T,
// ) => (target: ResourceInstance, name: string): ResourceAttributeDescriptor => {
//   target.fields[name] = predicate
// }

// const optionalAttribute = <
//   T extends Predicate<RequiredType<ResourceAttributeValue>>
// >(
//   predicate: T,
// ) => (target: ResourceInstance, name: string): ResourceAttributeDescriptor => {
//   target.fields[name] = predicate
// }

// const toOneRelationship = <T extends string>(type: T) => (
//   target: ResourceInstance,
//   name: string,
// ) => {}
// const toManyRelationship = <T extends string>(type: T) => (
//   target: ResourceInstance,
//   name: string,
// ) => {}

// class Person extends resource('person')<Person> {
//   @requiredAttribute(isString) name!: string
//   @toOneRelationship('person') partner!: Person | null
//   @toManyRelationship('thing') thing!: Thing[]
// }

// class Thing extends resource('thing')<Thing> {
//   @requiredAttribute(isString) title!: string
// }

// const collection = new Collection(Person, Thing)

// const people = new ApiEndpoint('people', Person)

// const hans = people.get('test', {
//   person: ['name'],
// })

// people.getFrom('1234', 'partner')

// type CollectionKey = CollectionType<typeof collection>

// const person = new Person({
//   type: 'person',
//   id: 'test',
//   name: 'hans',
//   partner: null,
//   thing: [
//     {
//       type: 'thing',
//       id: 'x',
//       title: 'some thing',
//     },
//   ],
// })
