import { defineStore } from "pinia";
import { ref } from "vue";
import { Contact, LocationPrecision, Repository } from "@/types/contacts";
import { address, createKeyPair, exportKey } from '@/util/crypto';

async function createMe(): Promise<{pk: JsonWebKey; contact: Contact}> {
  const pair = await createKeyPair();
  const pk = await exportKey(pair.privateKey);
  const pub = await exportKey(pair.publicKey);
  const id = await address(pair.publicKey);
  return {
    pk,
    contact: {
      id, 
      pub,
      secret: 0,
      profile: {
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
  const contact = ref<Contact>();
  const pk = ref<JsonWebKey>();
  const previousMeHash = ref("");
  const repositories = ref<Array<Repository>>([]);

  createMe().then(created => { 
    ({ pk: pk.value, contact: contact.value } = created);
  });

  return {
    pk,
    contact, 
    previousMeHash,
    repositories,
  };
});
