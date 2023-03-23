import { Repositories, RepositoryEntry, RepositoryPlugin } from "@/types/repositories";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, addDoc, where } from 'firebase/firestore/lite';
import { chunk } from "lodash";
import { nextTick, ref } from "vue";
// TODO: Add SDKs for Firebase products
// https://firebase.google.com/docs/web/setup#available-libraries

export default function firebasePlugin(): RepositoryPlugin {
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
  const updates = collection(db, 'updates');
  
  return {
    id: Repositories.firebase,
    configuration: '',

    configure() {
      return ''; // no further config needed
    },

    async pullUpdate(address): Promise<string> {
      // bulk query up to 10: const q = query(ref, where('address', 'in', ['1', '2', ...]));
      const entries = await getDocs(query(updates, where('address', '==', address)));
      return entries.docs.map(doc => doc.data() as RepositoryEntry)[0].data;
    },

    async pullUpdates(addresses: Array<string>, progress = ref(0)): Promise<Array<RepositoryEntry>> {
      // bulk query up to 10: const q = query(ref, where('address', 'in', ['1', '2', ...]));
      const entries = [];
      for (const block of chunk(addresses, 10)) {
        entries.push(...(await getDocs(query(updates, where('address', 'in', block)))).docs);
        progress.value += block.length;
        await nextTick();
      }
      return entries.map(doc => doc.data() as RepositoryEntry);
    },
    pushUpdate(address, data) {
      addDoc(updates, { address, data } as RepositoryEntry);
    },
    source() {
      return {
        repository: Repositories.firebase,
        configuration: 'default',
      }
    },
    isSecure: () => false
  };
}