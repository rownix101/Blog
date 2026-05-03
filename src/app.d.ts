import type { CommentPlatformEnv } from '$lib/server/comments';

declare global {
  namespace App {
    interface Locals {
      lang: import('$lib/i18n').Lang;
    }

    interface Platform {
      env?: CommentPlatformEnv;
      ctx?: {
        waitUntil: (promise: Promise<unknown>) => void;
      };
    }
  }
}

export {};
