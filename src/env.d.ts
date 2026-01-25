/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

declare global {
  interface Window {
    adsbygoogle?: any[] & { loaded?: boolean }
  }

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

  namespace App {
    type CloudflareRuntime = import('@astrojs/cloudflare').Runtime<{
      DB: D1Database
    }>
    interface Locals extends CloudflareRuntime {}
  }
}

export {}
