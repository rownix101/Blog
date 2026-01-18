// Polyfills for Cloudflare Workers environment

// MessageChannel polyfill for React DOM SSR
if (typeof globalThis.MessageChannel === 'undefined') {
  globalThis.MessageChannel = class MessageChannel {
    port1: any
    port2: any

    constructor() {
      this.port1 = {
        postMessage: () => {},
        close: () => {},
        start: () => {},
        onmessage: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }
      this.port2 = {
        postMessage: () => {},
        close: () => {},
        start: () => {},
        onmessage: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }
    }
  }
}
