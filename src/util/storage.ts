import firebasePlugin from "@/repositories/firebase";
import { useMeStore, useContactsStore } from "@/store";
import { Contact, ContactProfile } from "@/types/contacts";
import { Repositories, Repository, RepositoryPlugin, SecureRepositoryPlugin, isSecure } from "@/types/repositories";
import { pull } from "lodash";
import { nextTick, ref, watchEffect } from "vue";
import { decrypt, decryptWithSecret, encrypt, encryptWithSecret, fromBase64, hash, importPrivateKey, importPublicKey, toBase64 } from "./crypto";
import { useBackupStore } from "@/store/backup";

const pluginFactory = new Map<Repositories, () => RepositoryPlugin>([
  [Repositories.firebase, firebasePlugin]
]);
const plugins = new Map<Repositories, RepositoryPlugin>();
const meStore = useMeStore();
const contactsStore = useContactsStore();



// Updates ////////////////////////////////////////////////////////////////////

export async function pushUpdate(progress = ref(0)) {
  const me = meStore.contact!;
  const meHash = await hash(JSON.stringify(me?.profile));

  if (meStore.previousHash === meHash) {
    return console.warn('Pushed for update but users data hash hasn\'t changed');
  }

  // TODO v2: keep in mind which contact is to see what information.
  // for each contact, encrypt and push data to all configured remote storage places.
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
  // to allow for bulk requests, process restructured to:
  // for all repos, pull available updates in parallel, for all results, decrypt and update contact profile with latest version
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
    // TODO get rid of ! and do proper error handling (though impossible to be undefined at this point)
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



// Backups ////////////////////////////////////////////////////////////////////

const backupStore = useBackupStore();
type Backup = {
  me: typeof meStore.$state;
  contacts: typeof contactsStore.contacts;
  version: number;
};

export async function pushBackup(masterPassword: string) {
  // Get all data (meStore, contacts), encrypt with master password and push backup to secure repositories
  backupStore.version++;
  const me = meStore.$state;
  const backup: Backup = { me, contacts: contactsStore.contacts, version: backupStore.version };
  const data = toBase64(await encryptWithSecret(JSON.stringify(backup), masterPassword));
  return await Promise.all(loadSecurePlugins().map(secure => {
    secure.pushBackup(data);
  }));
}

export async function pullBackup(masterPassword: string) {
  let latest: Backup | undefined;
  await Promise.all(loadSecurePlugins().map(async secure => {
    const data = fromBase64(await secure.pullBackup());
    const backup = JSON.parse(await decryptWithSecret(data, masterPassword)) as Backup;
    if (!latest || backupStore.version < backup.version) {
      latest = backup;
    }
  }));
  if (latest) {
    useMeStore().$patch(latest.me);
    contactsStore.contacts = latest.contacts;
  }
}



// Repositories ///////////////////////////////////////////////////////////////

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



// Utilities //////////////////////////////////////////////////////////////////

export async function createAddress(from: Contact, to: Contact, secret: number): Promise<string> {
  return await hash([from.pub, to.pub, secret].map(x => JSON.stringify(x)).join());
}

function loadSecurePlugins(): SecureRepositoryPlugin[] {
  return loadAllPlugins().filter(repository => isSecure(repository)) as SecureRepositoryPlugin[];
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