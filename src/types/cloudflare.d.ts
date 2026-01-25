// Cloudflare Pages / Workers types
declare global {
  interface D1Database {
    prepare(sql: string): D1PreparedStatement
    batch(statements: D1PreparedStatement[]): Promise<D1Result[]>
    exec(sql: string): Promise<D1ExecResult>
  }

  interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement
    first<T = any>(): Promise<T | null>
    all<T = any>(): Promise<{ results: T[]; success: boolean }>
    run(): Promise<D1Result>
  }

  interface D1Result {
    success: boolean
    meta: {
      duration: number
      last_row_id: number
      changes: number
      served_by: string
    }
  }

  interface D1ExecResult {
    success: boolean
    meta: {
      duration: number
      rows_read: number
      rows_written: number
    }
  }

  interface KVNamespace {
    get(key: string, options?: { type: 'text' }): Promise<string | null>
    get(key: string, options?: { type: 'json' }): Promise<any | null>
    get(
      key: string,
      options?: { type: 'arrayBuffer' },
    ): Promise<ArrayBuffer | null>
    get(
      key: string,
      options?: { type: 'stream' },
    ): Promise<ReadableStream | null>
    put(
      key: string,
      value: string | ReadableStream | ArrayBuffer,
      options?: { expiration?: number; expirationTtl?: number },
    ): Promise<void>
    delete(key: string): Promise<void>
  }

  namespace Astro {
    interface Locals {
      runtime?: {
        env: {
          DB: D1Database
          COMMENT_KV: KVNamespace
        }
      }
    }
  }
}

export {}
