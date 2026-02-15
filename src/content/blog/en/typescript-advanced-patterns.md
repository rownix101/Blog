---
title: 'TypeScript Advanced Patterns: From Basics to Production'
description: 'Master TypeScript type gymnastics, design patterns, and large-scale project architecture to write robust type-safe code'
date: '2026-02-18'
tags: ['TypeScript', 'Frontend', 'Type System', 'Architecture', 'Engineering']
authors: ['rownix']
draft: false
---

> **TL;DR**: From basic types to advanced patterns, covering type gymnastics, design patterns, and large-scale project architecture to make your TypeScript code go from "it works" to "it's robust".

## Why Deep Dive into TypeScript?

### The Value of Type Systems

```typescript
// ❌ JavaScript: Errors discovered at runtime
function calculateTotal(price, quantity) {
  return price * quantity  // NaN? undefined? Exposed at runtime
}

calculateTotal("100", 2)  // "100100" instead of 200
```

```typescript
// ✅ TypeScript: Catch errors at compile time
function calculateTotal(price: number, quantity: number): number {
  return price * quantity
}

calculateTotal("100", 2)  // ❌ Compile error: Argument of type 'string' is not assignable to parameter of type 'number'
```

### Type Safety in Large Projects

In a 100k-line codebase:
- **Refactoring confidence**: Change function signatures, compiler tells you what needs updating
- **Documentation as code**: Types are the best documentation
- **IDE experience**: IntelliSense, autocomplete, go to definition

## Part 1: Type System Foundations (Review & Deep Dive)

### 1.1 Type Inference vs Annotation

```typescript
// TypeScript can infer, no need for explicit annotation
const users = [{ name: 'Alice', age: 30 }]  // Type inferred automatically

// Scenarios requiring explicit annotation
function fetchUser(id: string): Promise<User> {
  // Return type should be clear to help callers understand
}

// Type alias vs Interface
type UserID = string  // Basic type alias
type FetchUser = (id: string) => Promise<User>  // Function type

interface User {
  name: string
  age: number
}  // Object shape (can be extended)
```

### 1.2 Generics: Functions for Types

```typescript
// Generic function
function identity<T>(arg: T): T {
  return arg
}

// Generic constraints
interface HasLength {
  length: number
}

function logLength<T extends HasLength>(arg: T): T {
  console.log(arg.length)
  return arg
}

// Multiple generic parameters
function mapObject<K extends string, V, R>(
  obj: Record<K, V>,
  mapper: (value: V, key: K) => R
): Record<K, R> {
  const result = {} as Record<K, R>
  for (const key in obj) {
    result[key] = mapper(obj[key], key)
  }
  return result
}

// Usage
const prices = { apple: 1.5, banana: 2.0 }
const doubled = mapObject(prices, (p) => p * 2)
// doubled type: { apple: number, banana: number }
```

### 1.3 Conditional Types & Mapped Types

```typescript
// Conditional types
type IsString<T> = T extends string ? true : false

type A = IsString<'hello'>  // true
type B = IsString<123>      // false

// Built-in mapped types
interface User {
  name: string
  age: number
  email: string
}

type PartialUser = Partial<User>      // All properties optional
type RequiredUser = Required<User>    // All properties required
type ReadonlyUser = Readonly<User>    // All properties readonly
type UserPick = Pick<User, 'name' | 'email'>  // Pick partial properties
type UserOmit = Omit<User, 'age'>     // Omit partial properties

// Custom mapped type: turn all properties into functions
type Functionify<T> = {
  [K in keyof T]: () => T[K]
}

type UserFunctions = Functionify<User>
// { name: () => string, age: () => number, email: () => string }
```

## Part 2: Type Gymnastics in Practice

### 2.1 Recursive Types & Deep Operations

```typescript
// Deep readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object 
    ? DeepReadonly<T[K]> 
    : T[K]
}

interface Config {
  database: {
    host: string
    port: number
    credentials: {
      username: string
      password: string
    }
  }
}

type ReadonlyConfig = DeepReadonly<Config>
// All levels become readonly

// Deep partial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object 
    ? DeepPartial<T[K]> 
    : T[K]
}
```

### 2.2 Template Literal Types

```typescript
// Event handler types
type EventName<T extends string> = `on${Capitalize<T>}`

type UserEvents = EventName<'click' | 'hover' | 'focus'>
// 'onClick' | 'onHover' | 'onFocus'

// CSS variable types
type Spacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type SpacingType = `margin-${Spacing}` | `padding-${Spacing}`
// 'margin-xs' | 'margin-sm' | ... | 'padding-xl'

// Path types (for deep access)
type Path<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends object
    ? `${K}` | `${K}.${Path<T[K]>}`
    : `${K}`
  : never

interface Nested {
  user: {
    profile: {
      name: string
      age: number
    }
  }
}

type NestedPath = Path<Nested>
// 'user' | 'user.profile' | 'user.profile.name' | 'user.profile.age'
```

### 2.3 Type Guards & Narrowing

```typescript
// Custom type guard
interface Cat {
  type: 'cat'
  meow(): void
}

interface Dog {
  type: 'dog'
  bark(): void
}

type Animal = Cat | Dog

// Type guard function
function isCat(animal: Animal): animal is Cat {
  return animal.type === 'cat'
}

function makeSound(animal: Animal) {
  if (isCat(animal)) {
    animal.meow()  // TypeScript knows this is Cat
  } else {
    animal.bark()  // TypeScript infers this is Dog
  }
}

// Discriminated union pattern
interface Success<T> {
  success: true
  data: T
}

interface Failure {
  success: false
  error: string
}

type Result<T> = Success<T> | Failure

function handleResult<T>(result: Result<T>): T | null {
  if (result.success) {
    return result.data  // Automatically narrowed to Success<T>
  } else {
    console.error(result.error)
    return null
  }
}
```

## Part 3: Design Patterns in Practice

### 3.1 Factory Pattern + Generics

```typescript
// Entity factory
interface Entity {
  id: string
  createdAt: Date
}

class EntityFactory<T extends Entity> {
  private entities: Map<string, T> = new Map()

  create(data: Omit<T, 'id' | 'createdAt'>): T {
    const entity = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    } as T
    
    this.entities.set(entity.id, entity)
    return entity
  }

  findById(id: string): T | undefined {
    return this.entities.get(id)
  }

  findAll(): T[] {
    return Array.from(this.entities.values())
  }
}

// Usage
interface User extends Entity {
  name: string
  email: string
}

interface Post extends Entity {
  title: string
  content: string
  authorId: string
}

const userFactory = new EntityFactory<User>()
const postFactory = new EntityFactory<Post>()

const user = userFactory.create({ name: 'Alice', email: 'alice@example.com' })
const post = postFactory.create({ title: 'Hello', content: 'World', authorId: user.id })
```

### 3.2 Observer Pattern

```typescript
// Type-safe observer
type EventMap = {
  userCreated: { userId: string; name: string }
  userDeleted: { userId: string }
  postPublished: { postId: string; title: string }
}

class TypedEventEmitter<Events extends Record<string, any>> {
  private listeners: {
    [K in keyof Events]?: Array<(data: Events[K]) => void>
  } = {}

  on<K extends keyof Events>(
    event: K,
    listener: (data: Events[K]) => void
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event]!.push(listener)

    return () => this.off(event, listener)
  }

  off<K extends keyof Events>(
    event: K,
    listener: (data: Events[K]) => void
  ): void {
    const listeners = this.listeners[event]
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const listeners = this.listeners[event]
    if (listeners) {
      listeners.forEach((listener) => listener(data))
    }
  }
}

// Usage
const emitter = new TypedEventEmitter<EventMap>()

emitter.on('userCreated', ({ userId, name }) => {
  console.log(`User ${name} created with ID ${userId}`)
})

emitter.emit('userCreated', { userId: '123', name: 'Alice' })
```

### 3.3 Builder Pattern

```typescript
// Fluent API builder
class QueryBuilder<T extends Record<string, any>> {
  private fields: (keyof T)[] = []
  private conditions: string[] = []
  private orderByField: keyof T | null = null
  private orderDirection: 'ASC' | 'DESC' = 'ASC'
  private limitValue: number | null = null

  select<K extends keyof T>(...fields: K[]): QueryBuilder<T> {
    this.fields = fields
    return this
  }

  where<K extends keyof T>(
    field: K,
    operator: '=' | '>' | '<' | '>=',
    value: T[K]
  ): QueryBuilder<T> {
    this.conditions.push(`${String(field)} ${operator} ${JSON.stringify(value)}`)
    return this
  }

  orderBy<K extends keyof T>(field: K, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder<T> {
    this.orderByField = field
    this.orderDirection = direction
    return this
  }

  limit(count: number): QueryBuilder<T> {
    this.limitValue = count
    return this
  }

  build(): string {
    const fields = this.fields.length > 0 
      ? this.fields.join(', ') 
      : '*'
    
    let query = `SELECT ${fields} FROM table`
    
    if (this.conditions.length > 0) {
      query += ` WHERE ${this.conditions.join(' AND ')}`
    }
    
    if (this.orderByField) {
      query += ` ORDER BY ${String(this.orderByField)} ${this.orderDirection}`
    }
    
    if (this.limitValue) {
      query += ` LIMIT ${this.limitValue}`
    }
    
    return query
  }
}

// Usage
interface User {
  id: number
  name: string
  age: number
  email: string
}

const query = new QueryBuilder<User>()
  .select('id', 'name', 'email')
  .where('age', '>', 18)
  .where('name', '=', 'Alice')
  .orderBy('age', 'DESC')
  .limit(10)
  .build()

console.log(query)
// SELECT id, name, email FROM table WHERE age > 18 AND name = "Alice" ORDER BY age DESC LIMIT 10
```

## Part 4: Large Project Architecture

### 4.1 Modularity & Dependency Injection

```typescript
// Service interfaces
interface IUserService {
  findById(id: string): Promise<User | null>
  create(data: CreateUserDTO): Promise<User>
}

interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>
}

// Dependency container
type ServiceMap = {
  userService: IUserService
  emailService: IEmailService
}

class Container {
  private services: Partial<ServiceMap> = {}

  register<K extends keyof ServiceMap>(
    key: K,
    implementation: ServiceMap[K]
  ): void {
    this.services[key] = implementation
  }

  resolve<K extends keyof ServiceMap>(key: K): ServiceMap[K] {
    const service = this.services[key]
    if (!service) {
      throw new Error(`Service ${key} not registered`)
    }
    return service
  }
}

// Usage
const container = new Container()

container.register('userService', new UserService())
container.register('emailService', new EmailService())

// Use in controller
class UserController {
  constructor(
    private userService = container.resolve('userService'),
    private emailService = container.resolve('emailService')
  ) {}

  async createUser(data: CreateUserDTO) {
    const user = await this.userService.create(data)
    await this.emailService.send(
      user.email,
      'Welcome!',
      'Thanks for joining us!'
    )
    return user
  }
}
```

### 4.2 API Type Safety

```typescript
// Shared API contract
// shared/api.ts

export interface APIEndpoints {
  '/api/users': {
    GET: {
      response: User[]
      query: { page?: number; limit?: number }
    }
    POST: {
      body: CreateUserDTO
      response: User
    }
  }
  '/api/users/:id': {
    GET: {
      response: User
      params: { id: string }
    }
    PUT: {
      params: { id: string }
      body: UpdateUserDTO
      response: User
    }
    DELETE: {
      params: { id: string }
      response: void
    }
  }
}

// Type-safe fetch wrapper
type EndpointPath = keyof APIEndpoints
type Method<Path extends EndpointPath> = keyof APIEndpoints[Path]

async function api<
  Path extends EndpointPath,
  M extends Method<Path>
>(path: Path, method: M, config: any): Promise<any> {
  // Implementation details...
  const response = await fetch(path, {
    method,
    body: config.body ? JSON.stringify(config.body) : undefined,
  })
  return response.json()
}

// Usage - fully type safe!
const users = await api('/api/users', 'GET', { query: { page: 1 } })
// users type automatically inferred as User[]

const newUser = await api('/api/users', 'POST', {
  body: { name: 'Alice', email: 'alice@example.com' }
})
// newUser type automatically inferred as User
```

### 4.3 Configuration Management

```typescript
// Environment config types
type Environment = 'development' | 'staging' | 'production'

interface Config {
  env: Environment
  database: {
    host: string
    port: number
    name: string
  }
  redis: {
    url: string
    ttl: number
  }
  features: {
    enableCache: boolean
    enableAnalytics: boolean
  }
}

// Config validation
type ConfigValidator<T> = {
  [K in keyof T]: T[K] extends object
    ? ConfigValidator<T[K]>
    : (value: unknown) => T[K]
}

const configValidator: ConfigValidator<Config> = {
  env: (v): Environment => {
    if (!['development', 'staging', 'production'].includes(v as string)) {
      throw new Error('Invalid environment')
    }
    return v as Environment
  },
  database: {
    host: (v) => {
      if (typeof v !== 'string') throw new Error('Database host must be string')
      return v
    },
    port: (v) => {
      if (typeof v !== 'number') throw new Error('Database port must be number')
      return v
    },
    name: (v) => {
      if (typeof v !== 'string') throw new Error('Database name must be string')
      return v
    },
  },
  // ... other validators
}

// Config loader
function loadConfig(): Config {
  const raw = {
    env: process.env.NODE_ENV,
    database: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      name: process.env.DB_NAME,
    },
    // ...
  }
  
  // Validate and return type-safe config
  return validateConfig(raw, configValidator)
}
```

## Part 5: Practical Tips & Pitfalls

### 5.1 Type Declaration Files

```typescript
// types/global.d.ts

declare global {
  interface Window {
    __INITIAL_STATE__: AppState
    analytics: {
      track(event: string, properties?: Record<string, any>): void
    }
  }
}

// Extend third-party libraries
declare module 'some-library' {
  export interface Options {
    timeout?: number
    retries?: number
  }
  
  export function doSomething(options?: Options): Promise<void>
}

export {}  // Ensure this is a module
```

### 5.2 Common Pitfalls & Solutions

```typescript
// ❌ Pitfall 1: Overuse of any
function processData(data: any) {
  return data.value  // No type checking
}

// ✅ Use unknown, force type checking
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value
  }
  throw new Error('Invalid data')
}

// ❌ Pitfall 2: Confusing optional chaining with nullish
const value = obj?.property || 'default'  // '' or 0 will also use default

// ✅ Use nullish coalescing
const value = obj?.property ?? 'default'  // Only null/undefined uses default

// ❌ Pitfall 3: Enum pitfalls
enum Status {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}
// Bundle size increases, tree-shaking difficult

// ✅ Use const assertion
const Status = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE'
} as const

type Status = typeof Status[keyof typeof Status]
```

### 5.3 Performance Optimization

```typescript
// ✅ Use const enum to reduce runtime overhead
const enum HttpStatus {
  OK = 200,
  NotFound = 404,
  Error = 500
}

// ✅ Use import type for type imports
import type { User } from './types'  // Removed after compilation, no bundle size increase

// ✅ Conditional types simplify complex logic
type Simplify<T> = {
  [K in keyof T]: T[K]
} & {}

// Used to expand intersection types, improve IDE display
```

## Summary

### TypeScript Learning Path

```
Foundation Stage:
├── Basic types and interfaces
├── Generic basics
└── Type inference and annotation

Advanced Stage:
├── Conditional types and mapped types
├── Type guards and narrowing
└── Template literal types

Expert Stage:
├── Type gymnastics practice
├── Design pattern applications
└── Large project architecture

Master Stage:
├── Type system principles
├── Compiler API
└── Custom type utility libraries
```

### Recommended Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Type Challenges](https://github.com/type-challenges/type-challenges) - Type gymnastics exercises
- [Total TypeScript](https://www.totaltypescript.com/) - Matt Pocock's tutorials

---

**What type challenges have you faced in TypeScript development? Share your experience!** 👇
