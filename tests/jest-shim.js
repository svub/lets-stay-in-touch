import { ArrayBuffer, TextDecoder, TextEncoder } from 'util';

// otherwise they are not available, for unknown reason, they are not part of "jsdom"
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// otherwise crypto = undefined
Object.defineProperty(globalThis, 'crypto', {
  value: require('crypto').webcrypto
});
