/**
 * @jest-environment jsdom
 */
// to make TextEncoder and Decoder available to crypto

import { createKeyPair, decode, decrypt, decryptWithSecret, encode, encrypt, encryptWithSecret, fromHex, parsePrivateKey, parsePublicKey, serializeKey, stringFromBase64, stringFromHex, stringToBase64, stringToHex, toHex } from '@/util/crypto';
import { fill } from 'lodash';

const message = "test data 123 ❤️";
const longMessage = fill(new Array(100), message).join();

describe('Crypto.ts', () => {
  it('create pair', async () => {
    const pair = await createKeyPair();
    expect(pair).not.toBeUndefined();
    const pub = pair.publicKey;
    expect(pub).not.toBeUndefined();
    expect(pub.usages).toContain("encrypt");
    const pk = pair.privateKey;
    expect(pk).not.toBeUndefined();
    expect(pk.usages).toContain("decrypt");
  });

  it('hex and dehex', async () => {
    const data = new TextEncoder().encode(message);
    const encoded = toHex(data);
    expect(encoded).not.toBeFalsy();
    const data2 = fromHex(encoded);
    const message2 = new TextDecoder().decode(data2);
    expect(message2).toEqual(message);
  });

  it('hex and dehex string', async () => {
    const encoded = stringToHex(message);
    expect(encoded).not.toBeFalsy();
    const message2 = stringFromHex(encoded);
    expect(message2).toEqual(message);
  });

  it('base64 encode and decode', async () => {
    const encoded = stringToBase64(message);
    expect(encoded).not.toBeFalsy();
    const message2 = stringFromBase64(encoded);
    expect(message2).toEqual(message);
  });

  it('encodes and decodes short', async () => {
    const pair = await createKeyPair();
    const data = new TextEncoder().encode(message).buffer;
    console.log('encoded length', data.byteLength);
    // asymmetrical encryption works for encoded length 150 and fails at 160
    const encrypted = await encrypt(data, pair.publicKey);
    console.log('encrypted length', encrypted.byteLength);
    expect(encrypted).toBeDefined();
    expect(encrypted.byteLength).toEqual(256);
    const decrypted = await decrypt(encrypted, pair.privateKey);
    expect(decrypted).toEqual(data);
    expect(new TextDecoder().decode(decrypted)).toEqual(message);
  });

  it('encodes and decodes long', async () => {
    const pair = await createKeyPair();
    const data = new TextEncoder().encode(longMessage).buffer;
    console.log('encoded length', data.byteLength);
    // should use hybrid encryption for large data (160 and up)
    const encrypted = await encrypt(data, pair.publicKey);
    console.log('encrypted length', encrypted.byteLength);
    expect(encrypted).toBeDefined();
    const decrypted = await decrypt(encrypted, pair.privateKey);
    expect(decrypted).toEqual(data);
    expect(new TextDecoder().decode(decrypted)).toEqual(longMessage);
  });

  it('serialize and parse pub', async () => {
    const key = (await createKeyPair()).publicKey;
    const serialized = await serializeKey(key);
    expect(serialized).toBeDefined();
    const parsed = await parsePublicKey(serialized);
    expect(parsed).toMatchObject(key);
  });

  it('serialize and parse pk', async () => {
    const pair = await createKeyPair();
    const serialized = await serializeKey(pair.privateKey);
    expect(serialized).toBeDefined();
    const parsed = await parsePrivateKey(serialized);
    expect(parsed).toMatchObject(pair.privateKey);
  });

  it('encodes and decodes via password', async () => {
    const data = new TextEncoder().encode(longMessage).buffer;
    const secret = "my secret";
    const encrypted = await encryptWithSecret(data, secret);
    console.log('encrypted length', encrypted.byteLength);
    expect(encrypted).toBeDefined();
    // expect(encrypted.byteLength).toEqual(256);
    const decrypted = await decryptWithSecret(encrypted, secret);
    expect(decrypted).toEqual(data);
    expect(new TextDecoder().decode(decrypted)).toEqual(longMessage);
  });

  it('encodes and decode', async () => {
    const encoded = encode(longMessage);
    const decoded = decode(encoded);
    expect(decoded).toEqual(longMessage);
  });
});
