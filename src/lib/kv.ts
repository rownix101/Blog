interface KVNamespace {
  put(
    key: string,
    value: string | ReadableStream | ArrayBuffer,
    options?: { expiration?: number; expirationTtl?: number },
  ): Promise<void>
  get(key: string, options?: { type: 'text' }): Promise<string | null>
  delete(key: string): Promise<void>
}

export async function setVerificationCode(
  kv: KVNamespace,
  email: string,
  code: string,
): Promise<void> {
  await kv.put(`verify:${email}`, code, { expirationTtl: 300 })
  await kv.put(`cooldown:${email}`, '1', { expirationTtl: 60 })
}

export async function getVerificationCode(
  kv: KVNamespace,
  email: string,
): Promise<string | null> {
  return await kv.get(`verify:${email}`, { type: 'text' })
}

export async function deleteVerificationCode(
  kv: KVNamespace,
  email: string,
): Promise<void> {
  await kv.delete(`verify:${email}`)
}

export async function checkCooldown(
  kv: KVNamespace,
  email: string,
): Promise<boolean> {
  const result = await kv.get(`cooldown:${email}`, { type: 'text' })
  return result !== null
}
