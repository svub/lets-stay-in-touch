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
  name: string;
  label?: string;
  avatar: string;
  location: ContactLocation;
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
  id: string; // address or pub?
  pub: JsonWebKey;
  profile: ContactProfile;
  data: ContactDataItem[];
  urls: ContactUrlItem[];
  sources: string[];
};

export type Me = {
  pk: JsonWebKey,
  contact: Contact,
}

