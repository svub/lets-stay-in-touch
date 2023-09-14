import firebasePlugin from "@/repositories/firebase";
import { useMeStore, useContactsStore } from "@/store";
import { Contact, ContactProfile } from "@/types/contacts";
import { Repositories, Repository, RepositoryPlugin, SecureRepositoryPlugin, isSecure, repositoryNames, DataItem } from "@/types/repositories";
import { cloneDeep, pull } from "lodash";
import { nextTick, ref } from "vue";
import { decode, decrypt, decryptWithSecret, encode, encrypt, encryptWithSecret, hash, importPrivateKey, importPublicKey, toHex } from "./crypto";
import { useBackupStore } from "@/store/backup";
import web3Plugin from "@/repositories/web3";
import testPlugin from "@/repositories/test";
import { compress, inflate } from "./io";

const pluginFactory = new Map<Repositories, () => Promise<RepositoryPlugin<any, any>>>([
  [Repositories.test, testPlugin],
  [Repositories.firebase, firebasePlugin],
  [Repositories.web3, web3Plugin],
]);
const plugins = new Map<Repositories, RepositoryPlugin<any, any>>();
const meStore = useMeStore();
const contactsStore = useContactsStore();



// Updates ////////////////////////////////////////////////////////////////////

/**
 * For each contact, encrypt and push my profile data to all configured remote storage places.
 * @param progress a 0..1 value representing the progress of pushing the update
 * @returns 
 */
export async function pushUpdate(progress = ref(0)) {
  const me = meStore.contact!;
  const meHash = toHex(await hash(encode(me?.profile)));

  if (meStore.previousHash === meHash) {
    return console.warn('pushUpdate: user data hash hasn\'t changed.');
  }

  // TODO v2: keep in mind which contact is to see what information.
  const contacts = [...contactsStore.contacts.values()]; // TODO is this needed? Or could the store property be used directly in the for statement below? -- if it works in step 2, the answer is no.
  if (contacts.length < 1) {
    return console.warn('pushUpdate: nothing to push, no contacts.');
  }

  me.profile.version++;
  const encoded = encode(me.profile);
  const data = await compress(encoded);
  console.log(`storage.push: data compressed from ${encoded.byteLength} to ${data.byteLength}`);
  // Despite being uglier, I need to collect all updates first and then push them to each plugin at once
  // Otherwise, a separate key and name would be required for each contact in the web3 plugin :(
  // Upside: the heavy lifting is done here once, and the plugins can then optimize the transport (bulk push)

  // step 1: preparing all updates for all contacts
  const updates = new Map<Repository<any>, DataItem[]>(meStore.repositories.map(repo => [repo, []]));
  for (const [index, contact] of contacts.entries()) {
    progress.value = (index + 1) / contacts.length * .5; // upto 50% progress for step 1
    await nextTick();

    const pub = await importPublicKey(contact.pub);
    const encrypted = await encrypt(data, pub);
    const address = await createAddress(me!, contact, contact.secret); 

    for (const repository of meStore.repositories) {
      updates.get(repository)!.push({ address, data: encrypted }); 
    }
  }

  console.log(updates);
  console.log(JSON.stringify(updates));

  // step 2: push updates online
  for (const [index, repository] of meStore.repositories.entries()) {
    progress.value = .5 + (index + 1) / meStore.repositories.length * .5; // 50 to 100% for step 2
    await nextTick();

    const plugin = await loadPlugin(repository.id);
    const list = updates.get(repository)!;
    console.log(`storage.push: updates for ${repositoryNames[repository.id]}`, list);
    try {
      await plugin.pushUpdates(repository, list);
    } catch(e) {
      console.error(`Storage: ${repositoryNames[repository.id]} failed to push update`, e);
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

  await Promise.all(contact.profile.sources.map(async (source, i, a) => {
    const plugin = await loadPlugin(source.repository);
    
    const data = await plugin.pullUpdate(source, address);
    if (!data || data.byteLength < 1) return;

    const decrypted = await decrypt(data, key!);
    const update = decode(await inflate(decrypted)) as ContactProfile;
    console.log(`storage.push: found update via ${repositoryNames[source.repository]}`, update);

    if (update.version > latestUpdate.version) {
      latestUpdate = update;
    }

    return update;
  }));
  
  if (latestUpdate !== contact.profile) {
    console.log('storage.push: applying update', latestUpdate);
    const old = cloneDeep(contact);
    contact.profile = latestUpdate;
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
  const encrypted = await encryptWithSecret(await compress(encode(backup)), masterPassword);
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
    const backup = decode(await inflate(await decryptWithSecret(encrypted, masterPassword))) as Backup;
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

async function refreshSources() {
  meStore.contact!.profile.sources = await Promise.all(meStore.repositories.map(async repository => {
    const plugin = await loadPlugin(repository.id);
    return plugin.source(repository);
  }));
}

export async function enableRepository(id: Repositories) {
  const plugin = await loadPlugin(id);
  const repository = await plugin.createRepository();

  meStore.repositories.push(repository);
  // meStore.contact!.profile.sources.push(plugin.source(repository));
  await refreshSources();

  return repository;
}

export async function disableRepository(repository: Repository<any>) {
  const plugin = await loadPlugin(repository.id);
  pull(meStore.repositories, repository);
  // could be done with _.remove, but would require each repo to have a unique ID
  // pull(meStore.contact!.profile.sources, plugin.source(repository));
  await refreshSources();
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