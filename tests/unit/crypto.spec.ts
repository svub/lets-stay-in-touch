/**
 * @jest-environment jsdom
 */
// to make TextEncoder and Decoder available to crypto

import { createKeyPair, decrypt, encrypt, fromHex, parsePrivateKey, parsePublicKey, serializeKey, stringFromHex, stringToHex, toHex } from '@/util/crypto';

// import { TextEncoder, TextDecoder } from '@vue/vue3-jest/lib'
// global.TextEncoder = TextEncoder
// global.TextDecoder = TextDecoder

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
    const message = "test data 123";
    const data = new TextEncoder().encode(message);
    const encoded = toHex(data);
    expect(encoded).not.toBeFalsy();
    const data2 = fromHex(encoded);
    const message2 = new TextDecoder().decode(data2);
    expect(message2).toEqual(message);
  });

  it('hex and dehex string', async () => {
    const message = "test data 123";
    const encoded = stringToHex(message);
    expect(encoded).not.toBeFalsy();
    const message2 = stringFromHex(encoded);
    expect(message2).toEqual(message);
  });

  it('encodes and decodes', async () => {
    const pair = await createKeyPair();
    const data = "data 123";
    const encrypted = await encrypt(data, pair.publicKey);
    expect(encrypted).toBeDefined();
    const decrypted = await decrypt(encrypted, pair.privateKey);
    expect(decrypted).toEqual(data);
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
});
