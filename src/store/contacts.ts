import { defineStore } from 'pinia';
import { Contact  } from '@/types/contacts';
import { getPeter } from '@/util/dummies';
import { computed, ref } from 'vue';

export const DUMMY = false; location.href.indexOf('localhost') > -1;

export const useContactsStore = defineStore('contacts', () => {
  const contacts = ref(new Array<Contact>());

  const ids = computed(() => contacts.value.map(contact => contact.id));
  const all = computed(() => contacts.value); // legacy

  // TODO? avoid duplicates? error on duplicate? (dup via ID)
  const add = (contact: Contact) => contacts.value.push(contact);
  const replace = (contact: Contact) => {
    const index = contacts.value.findIndex((old => old.id === contact.id));
    if (index > -1) contacts.value[index] = contact;
    else throw new Error(`Contact with ID ${contact.id} not found.`);
  }
  const get = (id: string) => contacts.value.find(contact => contact.id === id);

  if (DUMMY && contacts.value.length < 1) {
    getPeter().then(peter => add(peter));
  }

  return {
    contacts, // state
    ids, // getters
    all, 
    add, // actions
    replace,
    get,
  };
});