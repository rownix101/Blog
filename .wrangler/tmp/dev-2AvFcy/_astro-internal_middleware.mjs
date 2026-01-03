globalThis.process ??= {}; globalThis.process.env ??= {};
import { d as defineMiddleware, s as sequence } from './chunks/index_CiSOh0D-.mjs';
import './chunks/astro-designed-error-pages_CAOi62zL.mjs';
import './chunks/astro/server_CkFWa3cY.mjs';

if (typeof globalThis.MessageChannel === "undefined") {
  globalThis.MessageChannel = class MessageChannel {
    port1;
    port2;
    constructor() {
      this.port1 = {
        postMessage: () => {
        },
        close: () => {
        },
        start: () => {
        },
        onmessage: null,
        addEventListener: () => {
        },
        removeEventListener: () => {
        },
        dispatchEvent: () => {
        }
      };
      this.port2 = {
        postMessage: () => {
        },
        close: () => {
        },
        start: () => {
        },
        onmessage: null,
        addEventListener: () => {
        },
        removeEventListener: () => {
        },
        dispatchEvent: () => {
        }
      };
    }
  };
}

const onRequest$2 = defineMiddleware((context, next) => {
  return next();
});

const onRequest$1 = (context, next) => {
  if (context.isPrerendered) {
    context.locals.runtime ??= {
      env: process.env
    };
  }
  return next();
};

const onRequest = sequence(
	onRequest$1,
	onRequest$2
	
);

export { onRequest };
