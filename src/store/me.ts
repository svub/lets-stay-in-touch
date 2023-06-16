import { defineStore } from "pinia";
import { ref } from "vue";
import { Contact, LocationPrecision } from "@/types/contacts";
import { address, createKeyPair, exportKey, toHex } from '@/util/crypto';
import { Repository } from "@/types/repositories";

async function createMe(): Promise<{pk: JsonWebKey; contact: Contact}> {
  const pair = await createKeyPair();
  const pk = await exportKey(pair.privateKey);
  const pub = await exportKey(pair.publicKey);
  const id = toHex(await address(pair.publicKey));
  return {
    pk,
    contact: {
      id, 
      pub,
      secret: 0,
      profile: {
        version: 0,
        avatar: "",
        name: "You",
        location: {
          label: "Berlin",
          countryCode: "DE",
          precision: LocationPrecision.city,
        },
        urls: [],
        data: [],
        sources: [],
      },
    }
  };
}

export const useMeStore = defineStore('me', () => {
  const pk = ref<JsonWebKey>();
  const contact = ref<Contact>();
  const repositories = ref<Array<Repository<any>>>([]); // activated repos
  const previousHash = ref("");

  // start creating a new profile while waiting for local storage to load back-up
  createMe().then(created => { 
    if (!contact.value) { // First time using the app? Initialize...
      ({ pk: pk.value, contact: contact.value } = created);
    }
  });

  return {
    pk,
    contact, 
    previousHash,
    repositories,
  };
});