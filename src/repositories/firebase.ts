import { Repositories, RepositoryPlugin } from "@/types/repositories";
import { fromBase64, toBase64 } from "@/util/crypto";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, writeBatch, deleteDoc } from 'firebase/firestore/lite';

type Config = Record<string, never> // {} the linter doesn't like as empty object
type Source = Record<string, never> // {}

export default async function firebasePlugin(): Promise<RepositoryPlugin<Config, Source>>  {
  // TODO currently supporting only one static Firebase instance, config could be on a repository basis to enable multiple instances to be configured and used.
  const firebaseConfig = {
    apiKey: "AIzaSyBWq07w0_rjZIKSmnla86Ks26Ie3nJlT2A",
    authDomain: "let-stay-in-touch.firebaseapp.com",
    projectId: "let-stay-in-touch",
    storageBucket: "let-stay-in-touch.appspot.com",
    messagingSenderId: "128480004585",
    appId: "1:128480004585:web:95be9cbdd64556b3b92378"
  };
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  function ref(address: string) {
    return doc(db, 'updates', address);
  }
  
  return {
    async createRepository() {
      const repository = {
        id: Repositories.firebase,
        configuration: {}, // could make collection name configurable if needed at some point
      }
      return repository; 
    },

    async pullUpdate(repository, address) {
      // const entries = await getDocs(query(updates, where('address', '==', address)));
      // return entries.docs.map(doc => doc.data() as RepositoryEntry)[0].data;
      const doc = ref(address);
      const entry = await getDoc(doc);
      if (entry.exists()) {
        const data = fromBase64(entry.get('data'));
        await deleteDoc(doc); // free up space
        return data;
      }
    },

    // async pullUpdates(addresses: Array<string>, progress = ref(0)): Promise<Array<RepositoryEntry>> {
    //   // bulk query up to 10: const q = query(ref, where('address', 'in', ['1', '2', ...]));
    //   const entries = [];
    //   for (const block of chunk(addresses, 10)) {
    //     entries.push(...(await getDocs(query(updates, where('address', 'in', block)))).docs);
    //     progress.value += block.length;
    //     await nextTick();
    //   }
    //   // FIXME convert data from string to Buffer via base64
    //   return entries.map(doc => doc.data() as RepositoryEntry);
    // },

    async pushUpdates(repository, list) {
      // TODO chunk request if >= 500
      if (list.length >= 500) throw new Error('Maximum of 500 supported.');

      const batch = writeBatch(db);
      for (const { address, data } of list) {
        batch.set(ref(address), { data: toBase64(data) });
      }

      await batch.commit();
    },

    async source() {
      return {
        repository: Repositories.firebase,
        configuration: {},
      }
    },
  };
}