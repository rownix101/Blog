import {
  buildSponsorPayment,
  normalizeAmount,
  normalizePayType,
  normalizeReturnLang
} from '$lib/server/yifut';
import { error, type RequestHandler } from '@sveltejs/kit';

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export const POST: RequestHandler = async ({ request, url, platform }) => {
  const form = await request.formData();
  const amount = normalizeAmount(form.get('custom_amount') || form.get('amount'));
  const returnLang = normalizeReturnLang(form.get('lang'));

  if (!amount) {
    error(400, 'Invalid sponsor amount.');
  }

  const payment = await buildSponsorPayment({
    amount,
    payType: normalizePayType(form.get('pay_type')),
    origin: url.origin,
    returnPath: `/api/sponsor/return/${returnLang}`,
    platformEnv: platform?.env as Record<string, string | undefined> | undefined
  });

  const inputs = Object.entries(payment.fields)
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`
    )
    .join('\n');

  return new Response(
    `<!doctype html>
<html lang="zh">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Redirecting to payment</title>
  </head>
  <body>
    <form id="payment-form" action="${escapeHtml(payment.gateway)}" method="post">
      ${inputs}
      <noscript><button type="submit">Continue to payment</button></noscript>
    </form>
    <script>document.getElementById('payment-form').submit();</script>
  </body>
</html>`,
    {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store'
      }
    }
  );
};
