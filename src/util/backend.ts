import { useMeStore } from "@/store";
import { Contact, Repository } from "@/types/contacts";
import { hash } from "./crypto";

// DUMMY
export async function update() {
  const store = useMeStore();
  // TODO: for each contact, encrypt and push data to all configured remote storage places.
  // TODOv2: keep in mind which contact is to see what information.
  return store.previousMeHash = await hash(JSON.stringify(store.contact));
}

// DUMMY
export async function configure(repository: Repository) {
  // TODO: load repo plugin, call it's config process and store the result as repo config
}
