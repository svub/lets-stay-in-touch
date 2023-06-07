import { Ref } from "vue";

export enum Repositories {
  test, firebase, 
}
export const repositoryNames = {
  [Repositories.test]: "Test",
  [Repositories.firebase]: "Firebase",
}

export type Repository = {
  id: Repositories,
  configuration: string, // each plugin can do with that as it pleases
}

export type RepositoryEntry = {
  address: string;
  data: string;
}

export type RepositorySource = {
  repository: Repositories;
  configuration: string;
}

export interface RepositoryPlugin extends Repository {
  configure(): string; // do config to start using this repo
  pushUpdate(address: string, data: string): void;
  pullUpdate(address: string): Promise<string>;
  pullUpdates(addresses: Array<string>, progress?: Ref<number> ): Promise<Array<RepositoryEntry>>;
  source: () => RepositorySource; // for others to pull my updates
}
// safe to store pk here
export interface SecureRepositoryPlugin extends RepositoryPlugin {
  pullBackup(): Promise<string>;
  pushBackup(data: string): void;
}

export function isSecure(plugin: RepositoryPlugin): plugin is SecureRepositoryPlugin {
  const secure = plugin as SecureRepositoryPlugin;
  return typeof secure.pullBackup === 'function' && typeof secure.pushBackup === 'function';
}