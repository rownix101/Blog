import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ params }) => {
  redirect(303, `/${params.lang}/sponsor?paid=1`);
};
