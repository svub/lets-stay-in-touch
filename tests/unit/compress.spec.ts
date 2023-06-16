/**
 * @jest-environment jsdom
 */
// to make TextEncoder and Decoder available to crypto

import { compress, inflate } from "@/util/compress";
import { fill } from "lodash";

const shortMessage = "test data 123 ❤️";
const longMessage = fill(new Array(100), shortMessage).join();

describe('Compress.ts', () => {
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
