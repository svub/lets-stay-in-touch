const hashAlgo = 'SHA-256';

const asymmetricAlgorithm = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: hashAlgo,
};

const symmetricAlgorithm: AesKeyAlgorithm = { 
  name: 'AES-GCM', 
  length: 256,
};

// const symetricAlgorithm: AesCtrParams = {
//   name: 'AES-CTR',
//   counter: new Uint8Array(16),
//   length: 128,
// };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const usage: KeyUsage[] = ['encrypt', 'decrypt'];
const crypt: SubtleCrypto = crypto.subtle;

export function randomString(length = 10) {
  return decoder.decode(crypto.getRandomValues(new Uint8Array(length)));
}

export async function createKeyPair() {
  return crypt.generateKey(asymmetricAlgorithm, true, usage);
}

export async function createKey(keyString: string): Promise<CryptoKey> {
  // making sure the key string is always 32 bytes long, required for 265bit AES encryption
  const hashed = await hash(keyString);
  const encodedData = new Uint8Array(hashed).subarray(0, 32); 
  console.log(`createKey: using data with ${encodedData.length*8}bits`);

  try {
    return crypt.importKey('raw', encodedData, symmetricAlgorithm, true, ['encrypt', 'decrypt']);
  } catch (error) {
    console.error('Error creating CryptoKey:', error);
    throw error;
  }
}

export function pubKey(pair: CryptoKeyPair) {
  return pair.publicKey;
}

export function toHex(data: ArrayBuffer) {
  return Array.from(new Uint8Array(data))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function fromHex(hex: string) {
  return new Uint8Array((hex.match(/../g) ?? []).map(h => parseInt(h, 16)));
}

export function toBase64(bytes: ArrayBuffer) {
  const uint8Array = new Uint8Array(bytes);
  return btoa(String.fromCharCode(...uint8Array));
}

export function stringToBase64(string: string) {
  return toBase64(encoder.encode(string));
}

export function fromBase64(string: string) {
  const binaryString = atob(string);
  const length: number = binaryString.length;
  const uint8ArrayDecoded: Uint8Array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    uint8ArrayDecoded[i] = binaryString.charCodeAt(i);
  }
  return uint8ArrayDecoded.buffer;
}

export function stringFromBase64(string: string) {
  return decoder.decode(fromBase64(string));
}

export function stringToHex(data: string) {
  return toHex(encoder.encode(data));
}

export function stringFromHex(data: string) {
  return decoder.decode(fromHex(data));
}

export function encode(data: {}) {
  return encoder.encode(JSON.stringify(data));
}

export function decode(data: ArrayBuffer) {
  return JSON.parse(decoder.decode(data));
}

export async function hash(data: ArrayBuffer): Promise<ArrayBuffer> {
  return crypt.digest(hashAlgo, data);
}

// sync cyrb53 hashing algorithm
export function hashQuick(str: string, seed = 0): string { 
  let h1 = 0xdeadbeef ^ seed,
      h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);  
}

export async function address(key: CryptoKey) {
  if (key.type !== 'public') throw 'public keys only';
  return hash(await serializeKey(key));
}

export async function encrypt(data: ArrayBuffer, key: CryptoKey) {
  // const encoded = encoder.encode(data); -- let the user decide
  // From testing with tests/unit/crypto.spec.ts, data.length <=180 works, leaving some space
  if (data.byteLength < 100) {
    // the result is always 265 bytes long
    return crypt.encrypt(asymmetricAlgorithm, key, data);
  } else { // hybrid crypto
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const algorithm = { ...symmetricAlgorithm, iv };

    const symmetricKey = await crypt.generateKey(algorithm, true, ['encrypt', 'decrypt']);
    const encodedSymKey = encoder.encode(await serializeKey(symmetricKey));
    const encryptedSymKey = await crypt.encrypt(asymmetricAlgorithm, key, encodedSymKey);
    const encryptedData = await crypt.encrypt(algorithm, symmetricKey, data);

    console.log('part sizes encrypted-sym-key, iv, encrypted-data', encryptedSymKey.byteLength, iv.byteLength, encryptedData.byteLength)
    if (encryptedSymKey.byteLength != 256) throw new Error("encrypt: mismatch of encrypted sym key size.");
    if (iv.byteLength != 12) throw new Error("encrypt: IV size mismatch.");

    const container = new Uint8Array(encryptedData.byteLength + 12 + 256);
    container.set(new Uint8Array(encryptedSymKey), 0);
    container.set(iv, 256);
    container.set(new Uint8Array(encryptedData), 256 + 12);
    return container.buffer;
  }
}

export async function decrypt(data: ArrayBuffer, key: CryptoKey) {
  if (data.byteLength <= 256) {
    return await crypt.decrypt(asymmetricAlgorithm, key, data);
  } else { // hybrid 
    const container = new Uint8Array(data);
    const encryptedSymKey = container.slice(0, 256);
    const iv = container.slice(256, 256 + 12);
    const encryptedData = container.slice(256 + 12);
    const algorithm = { ...symmetricAlgorithm, iv };

    const decryptedSymKey = await crypt.decrypt(asymmetricAlgorithm, key, encryptedSymKey);
    console.log('decryptedSymKey', decryptedSymKey);
    const decodedSymKey = decoder.decode(decryptedSymKey);
    console.log('decodedSymKey', decryptedSymKey);
    const symmetricKey = await crypt.importKey('jwk', JSON.parse(decodedSymKey), algorithm, true, ['encrypt', 'decrypt']);

    return crypt.decrypt(algorithm, symmetricKey, encryptedData);
  }
}

export async function encryptWithSecret(data: ArrayBuffer, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const algorithm = { ...symmetricAlgorithm, iv };
  const key = await createKey(secret);
  const encrypted = await crypt.encrypt(algorithm, key, data);

  if (iv.byteLength != 12) throw new Error("encrypt: IV size mismatch.");

  const container = new Uint8Array(encrypted.byteLength + 12);
  container.set(iv, 0);
  container.set(new Uint8Array(encrypted), 12);
  return container.buffer;
}

export async function decryptWithSecret(data: ArrayBuffer, secret: string) {

  const container = new Uint8Array(data);
  const iv = container.slice(0, 12);
  const encryptedData = container.slice(12);
  const algorithm = { ...symmetricAlgorithm, iv };

  const key = await createKey(secret);
  return crypt.decrypt(algorithm, key, encryptedData);
}

export async function exportKey(key: CryptoKey) {
  return crypt.exportKey('jwk', key);
}

export async function importPublicKey(key: JsonWebKey) {
  return crypt.importKey('jwk', key, asymmetricAlgorithm, true, ['encrypt']);
}

export async function importPrivateKey(key: JsonWebKey) {
  return crypt.importKey('jwk', key, asymmetricAlgorithm, true, ['decrypt']);
}

export async function serializeKey(key: CryptoKey) {
  return JSON.stringify((await exportKey(key)));
}

export async function parsePublicKey(string: string) {
  return importPublicKey(JSON.parse(string) as JsonWebKey);
}

export async function parsePrivateKey(string: string) {
  return importPrivateKey(JSON.parse(string) as JsonWebKey);
}

export function createSecret() {
  return Math.floor(Math.random() * 1e10);
}
