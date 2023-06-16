import { RepositorySource } from "./repositories";

export enum LocationPrecision {
  exact, city, state, country, continent,
}
export const locationPrecisionLabels = {
  [LocationPrecision.exact]: "exact",
  [LocationPrecision.city]: "city",
  [LocationPrecision.state]: "state",
  [LocationPrecision.country]: "country",
  [LocationPrecision.continent]: "continent",
}

export type ContactLocation = {
  precision: LocationPrecision;
  label: string;
  lat?: number;
  lng?: number;
  countryCode?: string;
}

export type ContactProfile = {
  version: number;
  name: string;
  label?: string;
  avatar: string;
  location: ContactLocation;
  data: ContactDataItem[];
  urls: ContactUrlItem[];
  sources: RepositorySource<any>[];
}

export type ContactDataItem = {
  key: string;
  value: string;
}

export type ContactUrlItem = {
  label: string;
  url: string;
}

export type Contact = {
  id: string; // address
  pub: JsonWebKey;
  secret: number;
  profile: ContactProfile;
};
