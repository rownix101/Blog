import type { CommentPlatformEnv } from '$lib/server/comments';

declare global {
  namespace App {
    interface Locals {
      lang: import('$lib/i18n').Lang;
      user: { id: number; email: string; displayName: string } | null;
    }

    interface Platform {
      env?: CommentPlatformEnv & {
        AUTH_KV?: KVNamespace;
        GOOGLE_CLIENT_ID?: string;
        GOOGLE_CLIENT_SECRET?: string;
        X_CLIENT_ID?: string;
        X_CLIENT_SECRET?: string;
      };
      ctx?: {
        waitUntil: (promise: Promise<unknown>) => void;
      };
    }
  }
}

export {};
