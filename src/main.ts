import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import { IonicVue } from '@ionic/vue';
import { createPinia, Store } from 'pinia';
import localForage from "localforage";
import { debounce } from "lodash";

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

localForage.config({
  name        : 'lsit',
  version     : 1.0,
  storeName   : 'pinia_backup',
});

// TODO: consider extracting this into generic module, needed this functionality in two projects already.
async function persistencePlugin({ store }: { store: Store }) {
  const key = store.$id + '-state';
  const persist = () => {
    // plain objects should work but caused problems with indexedDB, to be tested, but serialized works always.
    const data = JSON.stringify(store.$state);
    localStorage.setItem(key, data);
    localForage.setItem(key, data);
  };
  
  let quick = localStorage.getItem(key)
  if (quick) {
    try {
      store.$patch(JSON.parse(quick))
    } catch(e) {
      quick = null; // trigger patching via localForage
    }
  }
  
  const stored = await localForage.getItem(key) as string;
  if (stored && quick != stored) {
    store.$patch(JSON.parse(stored))
    localStorage.setItem(key, stored);
  } 
  if (quick && !stored) {
    persist();
  }

  store.$subscribe(debounce(persist, 50));
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
