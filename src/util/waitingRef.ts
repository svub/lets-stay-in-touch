import { Ref, ref, UnwrapRef } from "vue";

export function waitingRef<T>(p: Promise<T>): Ref<T | undefined> {
  const r = ref<T | undefined>();
  p.then(v => r.value = v);
  return r;
}

export function importedRef<T>(url: string): Ref<T | undefined> {
  const p = import('@/util/countryCodes') as Promise<T>;
  return waitingRef(p);
}