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
