import './polyfills'
import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware((context, next) => {
  // All requests pass through - root redirect is now handled by index.astro
  return next()
})