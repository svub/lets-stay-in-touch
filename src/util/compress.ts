import { gunzipSync, gzipSync } from "fflate"

export function compress(data: ArrayBuffer) {
  return gzipSync(new Uint8Array(data), {
    level: 9,
  });
}

export function inflate(data:ArrayBuffer) {
  return gunzipSync(new Uint8Array(data));
}
