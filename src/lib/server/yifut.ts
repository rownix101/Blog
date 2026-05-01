import { env as privateEnv } from '$env/dynamic/private';

type PayParams = Record<string, string>;

const encoder = new TextEncoder();

const getEnv = (platformEnv: Record<string, string | undefined> | undefined, key: string) =>
  platformEnv?.[key];

const normalizePem = (value: string) => value.replace(/\\n/g, '\n').trim();

const pemToDer = (pem: string) => {
  const base64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
};

export const createSignContent = (params: PayParams) =>
  Object.entries(params)
    .filter(([key, value]) => key !== 'sign' && key !== 'sign_type' && value !== '')
    .sort(([left], [right]) => (left > right ? 1 : left < right ? -1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

export const signParams = async (params: PayParams, privateKeyPem: string) => {
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(normalizePem(privateKeyPem)),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(createSignContent(params))
  );

  return toBase64(signature);
};

export const verifyParams = async (params: PayParams, publicKeyPem: string) => {
  const signature = params.sign;

  if (!signature) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    'spki',
    pemToDer(normalizePem(publicKeyPem)),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['verify']
  );

  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    pemToDer(`-----BEGIN SIGNATURE-----\n${signature}\n-----END SIGNATURE-----`),
    encoder.encode(createSignContent(params))
  );
};

export const buildSponsorPayment = async ({
  amount,
  payType,
  origin,
  returnPath,
  platformEnv
}: {
  amount: string;
  payType: string;
  origin: string;
  returnPath: string;
  platformEnv?: Record<string, string | undefined>;
}) => {
  const env = { ...privateEnv, ...platformEnv };
  const pid = getEnv(env, 'YIFUT_PID');
  const privateKey = getEnv(env, 'YIFUT_PRIVATE_KEY');
  const gateway = getEnv(env, 'YIFUT_GATEWAY') ?? 'https://www.yifut.com/api/pay/submit';

  if (!pid || !privateKey) {
    throw new Error('YIFUT_PID and YIFUT_PRIVATE_KEY must be configured.');
  }

  const now = Math.floor(Date.now() / 1000);
  const outTradeNo = `SP${now}${crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
  const params: PayParams = {
    pid,
    type: payType,
    out_trade_no: outTradeNo,
    notify_url: `${origin}/api/sponsor/notify`,
    return_url: `${origin}${returnPath}`,
    name: 'Rownix Blog Sponsor',
    money: amount,
    param: 'sponsor',
    timestamp: String(now),
    sign_type: 'RSA'
  };

  return {
    gateway,
    fields: {
      ...params,
      sign: await signParams(params, privateKey)
    }
  };
};

export const getYifutPublicKey = async (
  platformEnv?: Record<string, string | undefined>
) => {
  return getEnv({ ...privateEnv, ...platformEnv }, 'YIFUT_PUBLIC_KEY');
};

export const normalizeAmount = (rawAmount: FormDataEntryValue | null) => {
  const value = String(rawAmount ?? '').trim();

  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return null;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 1 || amount > 5000) {
    return null;
  }

  return amount.toFixed(2);
};

export const normalizePayType = (rawType: FormDataEntryValue | null) => {
  const value = String(rawType ?? '').trim();
  const allowed = new Set(['alipay', 'wxpay', 'crypto']);

  return allowed.has(value) ? value : 'alipay';
};

export const normalizeReturnLang = (rawLang: FormDataEntryValue | null) => {
  const value = String(rawLang ?? '').trim();

  return value === 'en' ? 'en' : 'zh';
};
