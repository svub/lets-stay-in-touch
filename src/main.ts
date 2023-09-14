import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import { IonicVue } from '@ionic/vue';
import { createPinia, Store } from 'pinia';
import localForage from "localforage";
import { cloneDeep, debounce, isEqual } from "lodash";

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables */
import './theme/variables.css';
import { BSON } from 'bson';
import { deserialize, serialize } from './util/io';
import { fromBase64, toBase64 } from './util/crypto';

localForage.config({
  name        : 'lsit',
  version     : 1.0,
  storeName   : 'pinia_backup',
});


// TODO: consider extracting this into a reusable NPM module; needed this functionality in two projects already.
// consider using `pinia.state.value = {}` as described here https://pinia.vuejs.org/core-concepts/state.html#replacing-the-state
async function persistencePlugin({ store }: { store: Store }) {
  const COMPRESSED = true;

  if (!Object.hasOwn(window, 'resetPiniaStores')) {
    Object.defineProperty(window, 'resetPiniaStores', {
      value: () => {
        for (const store of (window as any).resetPiniaStoreRefs) {
          store.$state = {};
        }
        localStorage.clear();
        localForage.clear();
        window.location.reload();
      }
    });
  }
  if (!Object.hasOwn(window, 'resetPiniaStoreRefs')) {
    Object.defineProperty(window, 'resetPiniaStoreRefs', { value: [store] });
  } else {
    (window as any).resetPiniaStoreRefs.push(store);
  }

  const key = store.$id + '-state';
  function persist() {
    const compressed = serialize(store.$state, COMPRESSED);
    localStorage.setItem(key, toBase64(compressed));
    localForage.setItem(key, compressed);
  }

  function patch(data: Uint8Array) {
    store.$patch(deserialize(data, COMPRESSED));
  }
  
  const quickRaw = localStorage.getItem(key);
  let quick = quickRaw ? new Uint8Array(fromBase64(quickRaw)) : undefined;
  if (quick) {
    try {
      patch(quick);
    } catch(e) {
      quick = undefined; // loading quickly failed, trigger patching via localForage
    }
  }
  
  const stored = await localForage.getItem(key) as Uint8Array;
  if (stored && quick != stored) {
    patch(stored);
    localStorage.setItem(key, toBase64(stored));
  } 
  if (quick && !stored) {
    await persist();
  }

  store.$subscribe(debounce(persist, 1000));
}

const pinia = createPinia();
pinia.use(persistencePlugin);

const app = createApp(App)
    .use(IonicVue)
    .use(router)
    .use(pinia);

router.isReady().then(() => {
  app.mount('#app');
});
