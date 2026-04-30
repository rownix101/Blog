declare global {
  namespace App {
    interface Locals {
      lang: import('$lib/i18n').Lang;
    }

    interface Platform {
      env?: Record<string, string | undefined>;
    }
  }
}

export {};
