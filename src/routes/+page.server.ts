import { redirect } from '@sveltejs/kit';
import { defaultLang } from '$lib/i18n';

export const load = () => {
  throw redirect(308, `/${defaultLang}`);
};
