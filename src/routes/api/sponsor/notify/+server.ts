import { getYifutPublicKey, verifyParams } from '$lib/server/yifut';
import { text, type RequestHandler } from '@sveltejs/kit';

const paramsFromSearch = (searchParams: URLSearchParams) =>
  Object.fromEntries(searchParams.entries()) as Record<string, string>;

const handleNotify = async (
  params: Record<string, string>,
  platformEnv?: Record<string, string | undefined>
) => {
  const status = params.trade_status;
  const publicKey = await getYifutPublicKey(platformEnv);
  const verified = publicKey ? await verifyParams(params, publicKey) : true;

  if (verified && status === 'TRADE_SUCCESS') {
    return text('success');
  }

  return text('ignored');
};

export const GET: RequestHandler = ({ url, platform }) =>
  handleNotify(
    paramsFromSearch(url.searchParams),
    platform?.env as Record<string, string | undefined> | undefined
  );

export const POST: RequestHandler = async ({ request, platform }) => {
  const form = await request.formData();
  const params = Object.fromEntries(
    Array.from(form.entries()).map(([key, value]) => [key, String(value)])
  );

  return handleNotify(
    params,
    platform?.env as Record<string, string | undefined> | undefined
  );
};
