export const FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

const encoder = new TextEncoder();

export function normalizeField(value) {
  if (value === undefined || value === null) return 0n;
  let parsed;
  try {
    parsed = BigInt(value);
  } catch (e) {
    if (typeof value === 'string' && !value.startsWith('0x')) {
      parsed = BigInt('0x' + value);
    } else {
      throw e;
    }
  }
  const normalized = parsed % FIELD_MODULUS;
  return normalized >= 0n ? normalized : normalized + FIELD_MODULUS;
}

export function fieldToString(value) {
  return normalizeField(value).toString();
}

export function randomField(cryptoProvider = globalThis.crypto) {
  const bytes = new Uint8Array(32);
  cryptoProvider.getRandomValues(bytes);
  return bytesToField(bytes).toString();
}

export async function userIdToField(userId, cryptoProvider = globalThis.crypto) {
  const digest = await cryptoProvider.subtle.digest('SHA-256', encoder.encode(userId));
  return bytesToField(new Uint8Array(digest)).toString();
}

export function computeCommitment(deviceSecret, userIdHash) {
  const secret = normalizeField(deviceSecret);
  return fieldToString(secret * secret + normalizeField(userIdHash));
}

export function computeNullifier(deviceSecret, challenge, userIdHash, usbSerial) {
  return fieldToString(
    normalizeField(deviceSecret) * normalizeField(challenge) +
      normalizeField(userIdHash) +
      normalizeField(usbSerial ?? 0),
  );
}

function bytesToField(bytes) {
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) + BigInt(byte);
  }
  return value % FIELD_MODULUS;
}
