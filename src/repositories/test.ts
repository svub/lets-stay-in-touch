import { useContactsStore, useMeStore } from "@/store";
import { Contact } from "@/types/contacts";
import { Repositories, RepositoryPlugin } from "@/types/repositories";
import { encode } from "@/util/crypto";
import { createAddress } from "@/util/storage";

const textEncoder = new TextEncoder();

export default async function testPlugin(): Promise<RepositoryPlugin<any, string>> {
  return {
    async createRepository() {
      return {
        id: Repositories.test,
        configuration: '',
      };
    },
    async pullUpdate(repository, address) {
      const profile = JSON.parse(JSON.stringify(contacts.get(address)!.profile));
      if (Math.random() > .2) profile.version++;
      return new Promise((resolve) => {
        console.log('test.push: profile', profile);
        resolve(encode(profile));
        // resolve(undefined);
      });
    },
    // pullUpdates(addresses, progress = ref(1)) {
    //   progress.value = 1;
    //   return Promise.all(addresses.map(async address => {
    //     return {
    //       address, data: await this.pullUpdate(address)
    //     } as RepositoryEntry;
    //   }));
    // },
    async pushUpdates() {
      // do nothing
    },
    async source() { 
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
