import { defineStore } from 'pinia';
import { Contact  } from '@/types/contacts';
import { getPeter } from '@/util/dummies';
import { computed, ref } from 'vue';

export const DUMMY = location.href.indexOf('localhost') > -1;

export const useContactsStore = defineStore('contacts', () => {
  const contacts = ref(new Map<string, Contact>());

  const ids = computed(() => contacts.value.keys());
  const all = computed(() => contacts.value.values());

  const add = (contact: Contact) => contacts.value.set(contact.id, contact);

  if (DUMMY) {
    getPeter().then(peter => add(peter));
  }

  return {
    contacts, // state
    ids, // getters
    all, 
    add, // actions
  };
});
