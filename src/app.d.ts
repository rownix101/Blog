declare global {
  namespace App {
    interface Locals {
      lang: import('$lib/i18n').Lang;
    }
  }
}

export {};
