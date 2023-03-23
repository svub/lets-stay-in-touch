import { useContactsStore, useMeStore } from "@/store";
import { Contact } from "@/types/contacts";
import { Repositories, RepositoryEntry, RepositoryPlugin } from "@/types/repositories";
import { createAddress } from "@/util/storage";
import { cloneDeep } from "lodash";
import { ref } from "vue";

const textEncoder = new TextEncoder();

export default function testPlugin(): RepositoryPlugin {
  return {
    id: Repositories.test,
    configuration: '',
    configure() {
      return '';
    },
    pullUpdate(address) {
      const profile = cloneDeep(contacts.get(address)!.profile);
      profile.version++;
      return new Promise(() => {
        return JSON.stringify(profile);
      });
    },
    pullUpdates(addresses, progress = ref(1)) {
      progress.value = 1;
      return Promise.all(addresses.map(async address => {
        return {
          address, data: await this.pullUpdate(address)
        } as RepositoryEntry;
      }));
    },
    pushUpdate(address, data) {
      // do nothing
    },
    isSecure: () => true,
    source() { 
      return {
        repository: Repositories.test,
        configuration: '',
      };
    },
  }
}

const contacts = new Map<string, Contact>();
const contactStore = useContactsStore();
const me = useMeStore().contact!;

(() => {
  contactStore.contacts.forEach(async contact => {
    contacts.set(await createAddress(contact, me, contact.secret), contact);
  })
})();
