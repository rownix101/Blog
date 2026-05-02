import { redirect } from '@sveltejs/kit';
import { preferredLangFromHeader } from '$lib/i18n';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, request, url }) => {
  const lang = preferredLangFromHeader(request.headers.get('accept-language'));

  throw redirect(302, `/${lang}/${params.path}${url.search}`);
};
