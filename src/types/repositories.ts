import { Ref } from "vue";

export enum Repositories {
  test, firebase, web3, 
}
export const repositoryNames = {
  [Repositories.test]: "Test",
  [Repositories.firebase]: "Firebase",
  [Repositories.web3]: "Web3",
}

export type Repository<ConfigType> = {
  id: Repositories,
  configuration: ConfigType, // private config, each plugin can do with that as it pleases
}

export type RepositoryEntry<SourceType> = {
  source: RepositorySource<SourceType>;
  data: ArrayBuffer;
}

export type RepositorySource<ConfigType> = {
  repository: Repositories;
  configuration: ConfigType; // public config for others to be able to pull updates
}

export type DataItem = {
  address: string;
  data: ArrayBuffer;
}

export interface RepositoryPlugin<ConfigType, SourceType> {
  /**
   * Initializes a repository for this plugin and returns it.
   */
  createRepository(): Promise<Repository<ConfigType>>;
  // /**
  //  * Push an update to a specific contact via their address.
  //  * @param repository to push update to
  //  * @param address for whom the update is
  //  * @param data the encrypted update data
  //  */
  // pushUpdate(repository: Repository<ConfigType>, address: string, data: ArrayBuffer): void;
  /**
   * Push an update to a specific contact via their address.
   * @param repository to push updates to
   * @param updates a list of addresses and the data to be pushed
   */
  pushUpdates(repository: Repository<ConfigType>, updates: DataItem[]): Promise<void>;
  /**
   * Look if there is an update in the given repo for my address and get it.
   * @param source to pull the update from
   * @param address my address, the one to look for updates for
   */
  pullUpdate(source: RepositorySource<SourceType>, address: string): Promise<ArrayBuffer | undefined>;
  // /**
  //  * @see pullUpdate but in bulk
  //  * @param sources to updates from
  //  * @param address 
  //  * @param progress optional, gets updated with the progress, starts with 0 and ends with <repositories.length -1>.
  //  */
  // pullUpdates(sources: Array<RepositorySource<SourceType>>, address: string, progress?: Ref<number> ): Promise<Array<RepositoryEntry<SourceType>>>;
  /**
   * Returns the configuration needed for others to pull updates from the given repository.
   * @param repository will be turned into a sources for others to pull updates.
   */
  source(repository: Repository<ConfigType>): Promise<RepositorySource<SourceType>>;
}
// safe to store pk here
export interface SecureRepositoryPlugin<ConfigType, SourceType> extends RepositoryPlugin<ConfigType, SourceType> {
  pullBackup(): Promise<ArrayBuffer>;
  pushBackup(data: ArrayBuffer): void;
}

export function isSecure<ConfigType, SourceType>(plugin: RepositoryPlugin<ConfigType, SourceType>): plugin is SecureRepositoryPlugin<ConfigType, SourceType> {
  const secure = plugin as SecureRepositoryPlugin<ConfigType, SourceType>;
  return typeof secure.pullBackup === 'function' && typeof secure.pushBackup === 'function';
}