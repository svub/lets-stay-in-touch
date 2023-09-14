import { BSON } from "bson";
import { gunzipSync, gzipSync } from "fflate"

export function compress(data: ArrayBuffer) {
  return gzipSync(new Uint8Array(data), {
    level: 9,
  });
}

export function inflate(data: ArrayBuffer) {
  return gunzipSync(new Uint8Array(data));
}

/**
 * Uses BSON as it allows for UInt8Arrays to be restored properly. Compression saves 30%+
 * @param data JS object
 * @param compressData uses GZip and saves 30+%
 * @returns object as bytes
 */
export function serialize(data: any, compressData = false) {
  const serialized = BSON.serialize(data);
  if (!compressData) return serialized;
  return compress(serialized);
}

/**
 * Uses BSON for deserialization (allows for UInt8Arrays to be restored properly). Inflates the data if it was serialized with compression enabled.
 * @param serialized 
 * @param inflateData set to true if the data was serialized with compression enabled
 * @returns restored JS object
 */
export function deserialize(serialized: Uint8Array, inflateData = false) {
  return BSON.deserialize(inflateData ? inflate(serialized) : serialized, { promoteBuffers: true });
}