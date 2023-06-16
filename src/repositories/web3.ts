import { Repositories, Repository, RepositoryPlugin, RepositorySource } from "@/types/repositories";
import { Ref, ref } from "vue";
import * as Name from 'w3name';
import { Web3Storage } from 'web3.storage'
import { defineStore } from "pinia";
import { sum } from "lodash";

export const useWeb3RepositoryStore = defineStore('web3-repository', () => {
  const revision: Ref<Map<string, Uint8Array | undefined>> = ref(new Map());

  return {
    revision,
  };
});

type Config = {
  key: Uint8Array;
};

type Source = {
  name: string;
};

export default async function web3Plugin(): Promise<RepositoryPlugin<Config, Source>> {

  const pluginConfig = {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDMxZTRDQWM5N0MyMzFlMDcyNzA2MEU3MTgzMjcwYWY4MThCMzYzMmUiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2ODYzMDcxOTgzMDIsIm5hbWUiOiJsZXRzLXN0YXktaW4tdG91Y2gifQ.0C7yKu2di3Ono_r9tLGXAk7hn0GzcvOWEkZuvsJ7fy4",
  };
  const client = new Web3Storage(pluginConfig);

  async function publish(repository: Repository<Config>, path: string) {
    const store = useWeb3RepositoryStore();
  
    // if (!store.key) {
    //   const name = await Name.create();
    //   // store.id = name.toString();
    //   store.key = name.key.bytes;
    // }
    // const name = await Name.from(store.key);
    if (!repository.configuration.key) throw new Error('Web3 repository not initialized properly, "key" missing.');
    const name = await Name.from(repository.configuration.key);
  
    const revisionRaw = store.revision.get(name.toString());
    const revision = !revisionRaw
      ? await Name.v0(name, path) 
      : await Name.increment(Name.Revision.decode(revisionRaw), path);
    store.revision.set(name.toString(), Name.Revision.encode(revision));
    console.log(`web3.publish: path ${path} -> name ${name.toString()} -> revision ${revision.name}`);
      
    await Name.publish(revision, name.key);
  }
  
  async function latest(name: string) {
    const nameObj = Name.parse(name);
    const revision = await Name.resolve(nameObj);
    return revision.value;
  }
  
  async function get(source: RepositorySource<Source>, address: string) {
    const cid = await latest(source.configuration.name);
    console.log('cid', cid);
    const res = await client.get(cid);
    console.log('res', res);
    if (!res?.ok) {
      throw new Error(`Failed to get ${cid}${ res ? `- [${res.status}] ${res.statusText}` : ''}`)
    }
  
    const files = await res.files();
    console.log('files #', files.length, files);
    console.log('address', address);
    const file = files.find(file => file.name == address);
    console.log(file);
    if (file) return file.arrayBuffer();
  }  
  
  return {
    async createRepository() {
      const nameObj = await Name.create();
      const name = nameObj.toString();
      const key = nameObj.key.bytes;
      const repoConfig = { name, key }
      const repository = { 
        id: Repositories.web3,
        configuration: repoConfig
      }
      console.warn(repository);
      return repository;
    },

    async pullUpdate(source, address) {
      return get(source, address);
    },

    // async pullUpdates(sources, address, progress = ref(0)) {
    //   const updates: Array<RepositoryEntry<Source>> = [];
    //   for (const source of sources) {
    //     const data = await get(source, address);
    //     progress.value++;
    //     if (data) {
    //       updates.push({ source, data });
    //     }
    //     await nextTick();
    //   }
    //   return updates;
    // },
  
    async pushUpdates(repository, updates) {
      // TODO delete old file - via latest()
      const files = updates.map(update => new File([update.data], update.address));
      const cid = await client.put(files);
      console.log('web3.push: cid', cid, '# updates', updates.length, 'data size', sum(files.map(file => file.size)));
      publish(repository, cid);
    },

    async source(repository) {
      // const store = useWeb3RepositoryStore();
      // if (!store.key) throw new Error("web3.source: key not initialized.");
      // const name = (await Name.from(store.key)).toString();
      const name = (await Name.from(repository.configuration.key)).toString();
      return {
        repository: Repositories.web3,
        configuration: { name },
      }
    },
  };
}