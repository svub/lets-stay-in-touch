/**
 * @jest-environment jsdom
 */
// to make TextEncoder and Decoder available to crypto

import { compress, serialize, deserialize, inflate } from "@/util/io";
import { fill } from "lodash";

const shortMessage = "test data 123 ❤️";
const longMessage = fill(new Array(100), shortMessage).join();

describe('Compression', () => {
  it('compress and inflate', async () => {
    const message = longMessage;
    const data = new TextEncoder().encode(message);
    console.log('data length', data.byteLength);
    const compressed = await compress(data);
    console.log('compressed length', compressed.byteLength);
    expect(compressed).toBeDefined();
    expect(compressed.byteLength).toBeLessThanOrEqual(data.byteLength);
    const inflated = await inflate(compressed);
    expect(inflated.buffer).toEqual(data.buffer);
    expect(new TextDecoder().decode(inflated)).toEqual(message);
  });
});

describe('Serialization', () => {
  it('serialize and deserialize', async () => {
    const data = { longMessage };
    const serialized = await serialize(data);
    console.log('serialized length', serialized.byteLength);
    expect(serialized).toBeDefined();
    const deserialized = await deserialize(serialized);
    expect(deserialized).toEqual(data);
    expect(deserialized.longMessage).toEqual(data.longMessage);
  });
});

describe('Serialization with compression', () => {
  it('serialize and deserialize', async () => {
    const data = { longMessage };
    const serialized = await serialize(data, true);
    console.log('serialized length', serialized.byteLength);
    expect(serialized).toBeDefined();
    const deserialized = await deserialize(serialized, true);
    expect(deserialized).toEqual(data);
    expect(deserialized.longMessage).toEqual(data.longMessage);
  });
});
