const hashAlgo = 'SHA-256';

const algo = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: hashAlgo,
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const usage: KeyUsage[] = ['encrypt', 'decrypt'];
const crypt: SubtleCrypto = crypto.subtle;

export function randomString(length = 10) {
  return decoder.decode(crypto.getRandomValues(new Uint8Array(length)));
}

export async function createKeyPair() {
  return crypt.generateKey(algo, true, usage);
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

export function fromBase64(string: string) {
  const binaryString = atob(string);
  const length: number = binaryString.length;
  const uint8ArrayDecoded: Uint8Array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    uint8ArrayDecoded[i] = binaryString.charCodeAt(i);
  }
  return uint8ArrayDecoded.buffer;
}

export function stringToHex(data: string) {
  return toHex(encoder.encode(data));
}

export function stringFromHex(data: string) {
  return decoder.decode(fromHex(data));
}

export async function hash(string: string): Promise<string> {
  return toHex(await crypt.digest(hashAlgo, encoder.encode(string)));
}

export async function address(key: CryptoKey) {
  if (key.type !== 'public') throw 'public keys only';
  return hash(await serializeKey(key));
}

export async function encrypt(data: string, key: CryptoKey) {
  return crypt.encrypt(algo, key, encoder.encode(data))
}

export async function decrypt(data: BufferSource, key: CryptoKey) {
  return decoder.decode(await crypt.decrypt(algo, key, data));
}

export async function exportKey(key: CryptoKey) {
  return await crypt.exportKey('jwk', key);
}

export async function importPublicKey(key: JsonWebKey) {
  return await crypt.importKey('jwk', key, algo, true, ['encrypt']);
}

export async function importPrivateKey(key: JsonWebKey) {
  return await crypt.importKey('jwk', key, algo, true, ['decrypt']);
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
