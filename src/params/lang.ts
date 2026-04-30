import { isLang } from '$lib/i18n';

export const match = (param: string) => isLang(param);
