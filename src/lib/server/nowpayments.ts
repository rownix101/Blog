import { env as privateEnv } from '$env/dynamic/private';

const encoder = new TextEncoder();

const getEnv = (platformEnv: Record<string, string | undefined> | undefined, key: string) =>
  platformEnv?.[key];

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const sortJson = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => (left > right ? 1 : left < right ? -1 : 0))
        .map(([key, entry]) => [key, sortJson(entry)])
    );
  }

  return value;
};

export const createNowPaymentsSignaturePayload = (payload: unknown) =>
  JSON.stringify(sortJson(payload));

export const verifyNowPaymentsSignature = async ({
  payload,
  signature,
  ipnSecret
}: {
  payload: unknown;
  signature: string | null;
  ipnSecret: string;
}) => {
  if (!signature) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ipnSecret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(createNowPaymentsSignaturePayload(payload))
  );

  return toHex(digest) === signature.toLowerCase();
};

export const createNowPaymentsInvoice = async ({
  amount,
  origin,
  returnPath,
  platformEnv
}: {
  amount: string;
  origin: string;
  returnPath: string;
  platformEnv?: Record<string, string | undefined>;
}) => {
  const env = { ...privateEnv, ...platformEnv };
  const apiKey = getEnv(env, 'NOWPAYMENTS_API_KEY');
  const apiBase = getEnv(env, 'NOWPAYMENTS_API_BASE') ?? 'https://api.nowpayments.io/v1';
  const priceCurrency = (getEnv(env, 'NOWPAYMENTS_PRICE_CURRENCY') ?? 'usd').toLowerCase();
  const payCurrency = getEnv(env, 'NOWPAYMENTS_PAY_CURRENCY')?.toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const orderId = `SPC${now}${crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;

  if (!apiKey) {
    throw new Error('NOWPAYMENTS_API_KEY must be configured.');
  }

  const response = await fetch(`${apiBase.replace(/\/$/, '')}/invoice`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      price_amount: amount,
      price_currency: priceCurrency,
      ...(payCurrency ? { pay_currency: payCurrency } : {}),
      ipn_callback_url: `${origin}/api/sponsor/notify`,
      order_id: orderId,
      order_description: 'Rownix Blog Sponsor',
      success_url: `${origin}${returnPath}`,
      cancel_url: `${origin}${returnPath}`,
      is_fixed_rate: getEnv(env, 'NOWPAYMENTS_FIXED_RATE') === 'true',
      is_fee_paid_by_user: getEnv(env, 'NOWPAYMENTS_FEE_PAID_BY_USER') === 'true'
    })
  });

  const result = (await response.json().catch(() => null)) as {
    invoice_url?: string;
    message?: string;
  } | null;

  if (!response.ok || !result?.invoice_url) {
    throw new Error(result?.message ?? 'Failed to create NOWPayments invoice.');
  }

  return result.invoice_url;
};

export const getNowPaymentsIpnSecret = (
  platformEnv?: Record<string, string | undefined>
) => getEnv({ ...privateEnv, ...platformEnv }, 'NOWPAYMENTS_IPN_SECRET');
