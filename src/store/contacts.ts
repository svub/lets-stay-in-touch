import { defineStore } from 'pinia';
import { Contact, LocationPrecision, Me } from '@/types/contacts';
import { getPeter } from '@/util/dummies';
import { computed, ref } from 'vue';
import { address, createKeyPair, exportKey } from '@/util/crypto';

export const DUMMY = location.href.indexOf('localhost') > -1;

async function createMe(): Promise<Me> {
  const pair = await createKeyPair();
  const pk = await exportKey(pair.privateKey);
  const pub = await exportKey(pair.publicKey);
  const id = await address(pair.publicKey);
  return {
    pk,
    contact: {
      profile: {
        avatar: "",
        name: "",
        location: {
          label: "",
          precision: LocationPrecision.city,
        },
      },
      id, 
      pub,
      urls: [],
      data: [],
      sources: [],
    }
  };
}

export const useContactsStore = defineStore('contacts', () => {
  const contacts = ref(new Map<string, Contact>());
  const me = ref<Me>();
  createMe().then(created => { me.value = created; console.log(JSON.stringify(created)) });

  const ids = computed(() => contacts.value.keys());
  const all = computed(() => contacts.value.values());

  const add = (contact: Contact) => contacts.value.set(contact.id, contact);

  if (DUMMY) {
    getPeter().then(peter => add(peter));
  }

  return {
    contacts, // state
    me, 
    ids, // getters
    all, 
    add, // actions
  };
});
