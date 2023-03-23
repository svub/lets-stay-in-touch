import firebasePlugin from "@/repositories/firebase";
import { useMeStore, useContactsStore } from "@/store";
import { Contact, ContactProfile } from "@/types/contacts";
import { Repositories, Repository, RepositoryPlugin } from "@/types/repositories";
import { pull } from "lodash";
import { nextTick, ref, watchEffect } from "vue";
import { decrypt, encrypt, fromBase64, hash, importPrivateKey, importPublicKey, toBase64 } from "./crypto";

const pluginFactory = new Map<Repositories, () => RepositoryPlugin>([
  [Repositories.firebase, firebasePlugin]
]);
const plugins = new Map<Repositories, RepositoryPlugin>();
const meStore = useMeStore();
const contactsStore = useContactsStore();

export async function pushUpdate(progress = ref(0)) {
  const me = meStore.contact!;
  const meHash = await hash(JSON.stringify(me?.profile));

  if (meStore.previousHash === meHash) {
    return console.warn('Pushed for update but users data hash hasn\'t changed');
  }

  // v1: for each contact, encrypt and push data to all configured remote storage places.
  // TODO v2: keep in mind which contact is to see what information.
  const contacts = [...contactsStore.contacts.values()];
  me.profile.version++;
  const data = JSON.stringify(me.profile);
  const plugins = loadAllPlugins();
  try {
    for (const [index, contact] of contacts.entries()) {
      const pub = await importPublicKey(contact.pub);
      const encrypted = toBase64(await encrypt(data, pub));
      const address = await createAddress(me!, contact, contact.secret); 
      
      for (const plugin of plugins) {
        plugin.pushUpdate(address, encrypted);
      }
      
      progress.value = (index + 1) / contacts.length;
      await nextTick();
    }
    return meStore.previousHash = meHash;
  } catch(e) {
    // TODO proper error handling!
    console.error('Storage: failed to push update', e);
  }
}

export async function pullUpdates(progress = ref(0), updatedIds = ref<Array<string>>([])) {
  // for each contact and each configured repository, pull, decrypt, and store updated contact profile
  const { contact: me, pk } = meStore;
  const contacts = [...contactsStore.contacts.values()];
  const plugins = loadAllPlugins();
  const key = await importPrivateKey(pk!);

  const entries = new Map<string, Contact> ();
  await Promise.all(contacts.map(async contact => {
    entries.set(await createAddress(contact, me!, contact.secret), contact);
  }));
  const addresses = [...entries.keys()];

  const workers = plugins.map(plugin => {
    const progress = ref(0);
    const results = plugin.pullUpdates(addresses, progress);
    return { plugin, progress, results };
  });

  watchEffect(() => {
    progress.value = workers.map(worker => worker.progress.value).reduce((sum, current) => sum + current, 0) / (workers.length + 1);
  });

  const progressState = progress.value;
  const results = (await Promise.all(workers.map(worker => worker.results))).flat();
  for (const [index, result] of results.entries()) {
    const decrypted = await decrypt(fromBase64(result.data), key);
    const update = JSON.parse(decrypted) as ContactProfile;
    const id = entries.get(result.address)!.id;
    const contact = contactsStore.get(id)!;
    if (update.version > contact.profile.version) {
      // TODO will the store be updated when updating the entries' contact? 
      // contactStore.contacts.get(contact.id)!.profile = update;
      contact.profile = update; // those this trigger store update or does it require "set(...)"?
      updatedIds.value.push(id);
    }

    progress.value = progressState + (1 - progressState) * (index / results.length);
    await nextTick();
  }
}



export async function enableRepository(repository: Repository) {
  const plugin = loadPlugin(repository.id);
  repository.configuration = plugin.configure();

  meStore.repositories.push(repository);
  meStore.contact!.profile.sources.push(plugin.source());
}

export async function disableRepository(repository: Repository) {
  const source = loadPlugin(repository.id).source();
  // TODO could it make sense to have some repo types being used multiple times, e.g. with varying configs?
  pull(meStore.repositories, repository);
  pull(meStore.contact!.profile.sources, source);
}

export async function createAddress(from: Contact, to: Contact, secret: number): Promise<string> {
  return await hash([from.pub, to.pub, secret].map(x => JSON.stringify(x)).join());
}



function loadAllPlugins(): RepositoryPlugin[] {
  return meStore.repositories.map(repository => loadPlugin(repository.id));
}

function loadPlugin(id: Repositories): RepositoryPlugin {
  const plugin = plugins.get(id);
  if (plugin) return plugin;
  
  const factory = pluginFactory.get(id);
  if (factory) {
    const plugin = factory();
    plugins.set(id, plugin);
    return plugin;
  }
  
  throw new Error(`Plugin ${id} not found.`);
}