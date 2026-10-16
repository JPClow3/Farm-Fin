const encoder = new TextEncoder();

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

/** HMAC-SHA256 of the exact request body, hex-encoded. */
export async function signScheduledJobBody(body: string, secret: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(secret, 'sign'),
    encoder.encode(body)
  );
  return bytesToHex(signature);
}

export async function verifyScheduledJobSignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  try {
    return await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret, 'verify'),
      hexToBytes(signature) as BufferSource,
      encoder.encode(body)
    );
  } catch {
    return false;
  }
}
