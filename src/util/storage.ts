import firebasePlugin from "@/repositories/firebase";
import { useMeStore, useContactsStore } from "@/store";
import { Contact, ContactProfile } from "@/types/contacts";
import { Repositories, Repository, RepositoryPlugin, SecureRepositoryPlugin, isSecure, repositoryNames } from "@/types/repositories";
import { cloneDeep, pull } from "lodash";
import { nextTick, ref } from "vue";
import { decode, decrypt, decryptWithSecret, encode, encrypt, encryptWithSecret, hash, importPrivateKey, importPublicKey, toHex } from "./crypto";
import { useBackupStore } from "@/store/backup";
import web3Plugin from "@/repositories/web3";
import testPlugin from "@/repositories/test";

const pluginFactory = new Map<Repositories, () => Promise<RepositoryPlugin<any, any>>>([
  [Repositories.test, testPlugin],
  [Repositories.firebase, firebasePlugin],
  [Repositories.web3, web3Plugin],
]);
const plugins = new Map<Repositories, RepositoryPlugin<any, any>>();
const meStore = useMeStore();
const contactsStore = useContactsStore();



// Updates ////////////////////////////////////////////////////////////////////

export async function pushUpdate(progress = ref(0)) {
  const me = meStore.contact!;
  const meHash = toHex(await hash(encode(me?.profile)));

  if (meStore.previousHash === meHash) {
    return console.warn('pushUpdate: user data hash hasn\'t changed.');
  }

  // TODO v2: keep in mind which contact is to see what information.
  // for each contact, encrypt and push data to all configured remote storage places.
  const contacts = [...contactsStore.contacts.values()]; // is this needed? Or could the store property be used directly in the for statement below?
  me.profile.version++;
  const data = encode(me.profile);
  for (const [index, contact] of contacts.entries()) {
    progress.value = (index + 1) / contacts.length;
    await nextTick();

    const pub = await importPublicKey(contact.pub);
    const encrypted = await encrypt(data, pub);
    const address = await createAddress(me!, contact, contact.secret); 
    
    for (const repository of meStore.repositories) {
      const plugin = await loadPlugin(repository.id);
      try {
        plugin.pushUpdate(repository, address, encrypted);
      } catch(e) {
        console.error(`Storage: ${repositoryNames[repository.id]} failed to push update`, e);
      }
    }
  }
  return meStore.previousHash = meHash;
}
  
// export async function pullUpdates(progress = ref(0), updatedIds = ref<Array<string>>([])) {
//   // for each contact and each configured repository, pull, decrypt, and store updated contact profile
//   // to allow for bulk requests, process restructured to:
//   // for all repos, pull available updates in parallel, for all results, decrypt and update contact profile with latest version
//   const { contact: me, pk } = meStore;
//   const contacts = [...contactsStore.contacts.values()];
//   const plugins = await loadAllPlugins();
//   const key = await importPrivateKey(pk!);

//   const entries = new Map<string, Contact> ();
//   await Promise.all(contacts.map(async contact => {
//     entries.set(await createAddress(contact, me!, contact.secret), contact);
//   }));
//   const addresses = [...entries.keys()];

//   const workers = plugins.map(plugin => {
//     const progress = ref(0);
//     const results = plugin.pullUpdates(addresses, progress);
//     return { plugin, progress, results };
//   });

//   watchEffect(() => {
//     progress.value = workers.map(worker => worker.progress.value).reduce((sum, current) => sum + current, 0) / (workers.length + 1);
//   });

//   const progressState = progress.value;
//   const results = (await Promise.all(workers.map(worker => worker.results))).flat();
//   for (const [index, result] of results.entries()) {
//     // FIXME remove base 64
//     const decrypted = await decrypt(fromBase64(result.data), key);
//     const update = JSON.parse(decrypted) as ContactProfile;
//     // TODO get rid of ! and do proper error handling (though impossible to be undefined at this point)
//     const id = entries.get(result.address)!.id;
//     const contact = contactsStore.get(id)!;
//     if (update.version > contact.profile.version) {
//       // TODO will the store be updated when updating the entries' contact? 
//       // contactStore.contacts.get(contact.id)!.profile = update;
//       contact.profile = update; // those this trigger store update or does it require "set(...)"?
//       updatedIds.value.push(id);
//     }

//     progress.value = progressState + (1 - progressState) * (index / results.length);
//     await nextTick();
//   }
// }

export type Update<Type> = {
  old: Type,
  new: Type,
}

export async function pullUpdate(contact: Contact, key?: CryptoKey): Promise<Update<Contact> | undefined> {
  const me = meStore.contact;
  if (!key) key = await importPrivateKey(meStore.pk!);
  const address = await createAddress(contact, me!, contact.secret);
  let latestUpdate = contact.profile;

  await Promise.all(contact.profile.sources.map(async source => {
    const plugin = await loadPlugin(source.repository);
    
    const data = await plugin.pullUpdate(source, address);
    if (!data || data.byteLength < 1) return;

    const decrypted = await decrypt(data, key!);
    const update = decode(decrypted) as ContactProfile;

    if (update.version > latestUpdate.version) {
      latestUpdate = update;
    }
  }));
  
  if (latestUpdate !== contact.profile) {
    const old = cloneDeep(contact);
    contact.profile = latestUpdate; // TODO does this trigger the store to update or does it require "set(...)"?
    return { old, new: contact };
  }
}

export async function pullUpdates(progress = ref(0), updated = ref<Array<Update<Contact>>>([])) {
  const contacts = [...contactsStore.contacts.values()];
  const key = await importPrivateKey(meStore.pk!);

  for (const [index, contact] of contacts.entries()) {
    const update = await pullUpdate(contact, key);
    if (update) {
      updated.value.push(update);
    }
  
    progress.value = (index + 1) / contacts.length;
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
  const encrypted = await encryptWithSecret(encode(backup), masterPassword);
  const plugins = await loadSecureMyPlugins();

  return await Promise.all(plugins.map(secure => {
    secure.pushBackup(encrypted);
  }));
}

export async function pullBackup(masterPassword: string) {
  let latest: Backup | undefined;
  const plugins = await loadSecureMyPlugins();

  await Promise.all(plugins.map(async secure => {
    const encrypted = await secure.pullBackup();
    const backup = decode(await decryptWithSecret(encrypted, masterPassword)) as Backup;
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

export async function enableRepository(id: Repositories) {
  const plugin = await loadPlugin(id);
  const repository = await plugin.createRepository();

  meStore.repositories.push(repository);
  // meStore.contact!.profile.sources.push(plugin.source(repository));
  meStore.contact!.profile.sources = await Promise.all(meStore.repositories.map(async repository => {
    const plugin = await loadPlugin(repository.id);
    return plugin.source(repository);
  }));

  return repository;
}

export async function disableRepository(repository: Repository<any>) {
  const plugin = await loadPlugin(repository.id);
  pull(meStore.repositories, repository);
  // pull(meStore.contact!.profile.sources, plugin.source(repository));
}



// Utilities //////////////////////////////////////////////////////////////////

export async function createAddress(from: Contact, to: Contact, secret: number): Promise<string> {
  const data = new Uint8Array([...encode(from.pub), ...encode(to.pub), ...encode(secret)]);
  return toHex(await hash(data));
}

async function loadSecureMyPlugins(): Promise<SecureRepositoryPlugin<any, any>[]> {
  return (await loadAllMyPlugins()).filter(repository => isSecure(repository)) as SecureRepositoryPlugin<any, any>[];
}

async function loadAllMyPlugins(): Promise<RepositoryPlugin<any, any>[]> {
  return Promise.all(meStore.repositories.map(repository => loadPlugin(repository.id)));
}  

export async function loadPlugin(id: Repositories): Promise<RepositoryPlugin<any, any>> {
  const plugin = plugins.get(id);
  if (plugin) return plugin;
  
  const factory = pluginFactory.get(id);
  if (factory) {
    const plugin = await factory();
    plugins.set(id, plugin);
    return plugin;
  }
  
  throw new Error(`Plugin ${id} not found.`);
}